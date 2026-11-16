package nl.nedfa.service

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.io.IOException
import java.time.Instant
import java.time.OffsetDateTime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import nl.nedfa.data.Learner
import nl.nedfa.data.Preferences
import nl.nedfa.data.Review
import nl.nedfa.data.ReviewEvent
import nl.nedfa.data.json

/**
 * Sign in with Google (in a Custom Tab; nedfa.nl checks Google's answer and sends back a one-time code to nl.nedfa://auth)
 * and keep progress in step with nedfa.nl. Accounts made with Apple on an iPhone work here too once Google is linked.
 */
object Cloud {
    enum class Status(val text: String) {
        STARTING("Even kijken of je bent ingelogd…"),
        GUEST("Je voortgang staat op deze telefoon."),
        SYNCING("Opslaan…"),
        SAVED("Opgeslagen in je account."),
        RETRY("Nog niet online opgeslagen. We proberen het opnieuw."),
    }

    @Serializable
    data class User(val id: String, val name: String = "", val email: String = "", val providers: List<String> = emptyList()) {
        fun has(provider: String) = provider in providers
    }

    var status by mutableStateOf(Status.STARTING); private set
    var user by mutableStateOf<User?>(null); private set
    var message by mutableStateOf<String?>(null)

    private const val BASE = "https://nedfa.nl/api"
    private const val SCHEME = "nl.nedfa"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var store: SharedPreferences
    private var token: String? = null
    private var working = false
    private var rerun = false
    private var pending: Job? = null
    private var remotePreferences: JsonObject = JsonObject(emptyMap())

    class SignedOut : Exception()
    class ServerError(val code: Int) : Exception()

    fun init(context: Context) {
        // Only on this phone (excluded from backups in the manifest's data extraction rules).
        store = context.getSharedPreferences("nedfa.session", Context.MODE_PRIVATE)
        token = store.getString("token", null)
        Learner.onChange = { scheduleSync() }
    }

    fun start() = scope.launch {
        if (token == null) { status = Status.GUEST; return@launch }
        try {
            val me = json.decodeFromString<MeResponse>(request("me"))
            setUser(me.user)
        } catch (e: SignedOut) {
            forgetToken(); setUser(null)
        } catch (e: Exception) {
            status = Status.RETRY
        }
    }

    @Serializable private data class MeResponse(val user: User? = null)
    @Serializable private data class SessionResponse(val token: String, val user: User)
    @Serializable private data class Ticket(val ticket: String)

    private suspend fun request(path: String, method: String = "GET", body: String? = null): String {
        val headers = token?.let { mapOf("Authorization" to "Bearer $it") } ?: emptyMap()
        val result = try { Http.request("$BASE/$path", method, body, headers) } catch (e: IOException) { throw e }
        if (result.code == 401) throw SignedOut()
        if (result.code !in 200..299) throw ServerError(result.code)
        return result.body
    }

    private suspend fun signedIn(session: SessionResponse) {
        token = session.token
        store.edit().putString("token", session.token).apply()
        setUser(session.user)
    }

    private fun forgetToken() { token = null; store.edit().remove("token").apply() }

    /** Opens Google sign-in in a Custom Tab; the answer comes back through [handle]. `link` adds Google to this account. */
    fun signInWithGoogle(context: Context, link: Boolean = false) = scope.launch {
        Analytics.event(if (link) "koppelen" else "inloggen", mapOf("provider" to "google"))
        val uri = Uri.parse("$BASE/auth/google").buildUpon().appendQueryParameter("mode", "app").appendQueryParameter("app", SCHEME)
        if (link) {
            val ticket = runCatching { json.decodeFromString<Ticket>(request("auth/link-ticket", "POST")) }.getOrNull()
            if (ticket == null) { message = "Koppelen lukt nu niet. Probeer het later opnieuw."; return@launch }
            uri.appendQueryParameter("ticket", ticket.ticket)
        }
        runCatching { CustomTabsIntent.Builder().setShowTitle(true).build().launchUrl(context, uri.build()) }
            .onFailure { message = "Er is geen browser gevonden om in te loggen." }
    }

    /** nl.nedfa://auth?code=… (signed in), ?linked=google or ?error=… */
    fun handle(uri: Uri) = scope.launch {
        if (uri.scheme != SCHEME) return@launch
        val code = uri.getQueryParameter("code")
        when {
            code != null -> try {
                signedIn(json.decodeFromString(request("auth/exchange", "POST", buildJsonObject { put("code", code) }.toString())))
            } catch (e: Exception) {
                message = "Inloggen lukt nu niet. Probeer het later opnieuw."
            }
            uri.getQueryParameter("linked") != null -> {
                runCatching { json.decodeFromString<MeResponse>(request("me")).user }.getOrNull()?.let { setUser(it) }
                message = "Google is gekoppeld aan je account."
            }
            uri.getQueryParameter("error").let { it != null && it != "cancelled" } ->
                message = "Google-inloggen is niet afgerond. Je kunt het opnieuw proberen."
        }
    }

    fun unlink(provider: String) = scope.launch {
        try {
            json.decodeFromString<MeResponse>(request("me/identities/$provider", "DELETE")).user?.let { user = it }
        } catch (e: Exception) {
            message = "Je hebt minstens één manier van inloggen nodig."
        }
    }

    fun signOut() = scope.launch {
        if (user == null) return@launch
        sync()
        runCatching { request("auth/signout", "POST") }
        forgetToken()
        setUser(null)
    }

    /** Deletes the account and everything saved with it, online and on this device. */
    fun deleteAccount() = scope.launch {
        if (user != null) {
            try { request("me", "DELETE") } catch (e: Exception) {
                message = "Je account kon niet worden verwijderd. Controleer je verbinding en probeer het opnieuw."; return@launch
            }
            forgetToken()
        }
        Learner.forgetDevice()
        Preferences.reset()
        user = null
        status = Status.GUEST
    }

    // Sync

    private suspend fun setUser(next: User?) {
        if (next?.id == user?.id && Learner.identity == (user?.id ?: "guest")) {
            user = next
            if (status == Status.STARTING) status = if (next == null) Status.GUEST else Status.SAVED
            return
        }
        user = next
        Learner.switchUser(next?.id)
        if (next == null) { status = Status.GUEST; return }
        status = Status.SYNCING
        try { load() } catch (e: SignedOut) { forgetToken(); setUser(null); return } catch (e: Exception) { status = Status.RETRY; return }
        sync()
    }

    @Serializable private data class CardRow(
        val card_id: String, val ease: Double, val interval_days: Int, val repetitions: Int,
        val due: String, val last_reviewed: String, val grade: Int, val reviews: Int,
    )
    @Serializable private data class EventRow(val id: String, val card_id: String, val grade: Int, val reviewed_at: String)
    @Serializable private data class PreferenceRow(val data: JsonObject = JsonObject(emptyMap()), val updated_at: String? = null)
    @Serializable private data class Progress(val cards: List<CardRow> = emptyList(), val events: List<EventRow> = emptyList(), val preferences: PreferenceRow? = null)

    private fun parse(text: String): Long = runCatching { OffsetDateTime.parse(text).toInstant().toEpochMilli() }.getOrElse { Instant.parse(text).toEpochMilli() }
    private fun iso(millis: Long) = Instant.ofEpochMilli(millis).toString()

    private suspend fun load() {
        val progress = json.decodeFromString<Progress>(request("me/progress"))
        Learner.merge(
            progress.cards.associate { it.card_id to Review(it.ease, it.interval_days, it.repetitions, parse(it.due), parse(it.last_reviewed), it.grade, it.reviews) },
            progress.events.map { ReviewEvent(it.id, it.card_id, it.grade, parse(it.reviewed_at)) },
        )
        progress.preferences?.let { remote ->
            val local = Preferences.updatedAt
            val remoteAt = remote.updated_at?.let { runCatching { parse(it) }.getOrNull() } ?: 0L
            if (local == null || remoteAt > local) {
                remote.data["goal"]?.jsonPrimitive?.intOrNull?.takeIf { it in Preferences.goals }?.let { Preferences.setGoal(it, sync = false) }
                remote.data["level"]?.jsonPrimitive?.contentOrNull?.takeIf { it in Preferences.levels }?.let { Preferences.setLevel(it, sync = false) }
                Preferences.setRemoteUpdated(remoteAt.takeIf { it > 0 })
            }
        }
        remotePreferences = progress.preferences?.data ?: JsonObject(emptyMap())
    }

    private fun scheduleSync() {
        pending?.cancel()
        pending = scope.launch { delay(2000); sync() }
    }

    @Serializable private data class CardItem(val id: String, val ease: Double, val interval: Int, val repetitions: Int, val due: String, val lastReviewed: String, val grade: Int, val reviews: Int)
    @Serializable private data class EventItem(val id: String, val cardId: String, val grade: Int, val at: String)
    @Serializable private data class Payload(val cards: List<CardItem>, val events: List<EventItem>)
    @Serializable private data class PreferencesBody(val data: JsonObject, val updated_at: String)

    suspend fun sync() {
        if (user == null) return
        if (working) { rerun = true; return }
        working = true
        status = Status.SYNCING
        val payload = Payload(
            Learner.reviews.map { (id, r) -> CardItem(id, r.ease, r.interval, r.repetitions, iso(r.due), iso(r.lastReviewed), r.grade, r.reviews) },
            Learner.events.map { EventItem(it.id, it.cardId, it.grade, iso(it.at)) },
        )
        try {
            request("me/sync", "POST", json.encodeToString(Payload.serializer(), payload))
            Preferences.updatedAt?.let { updated ->
                val data = remotePreferences.toMutableMap<String, JsonElement>()
                data["goal"] = JsonPrimitive(Preferences.goal)
                Preferences.level?.let { data["level"] = JsonPrimitive(it) }
                request("me/preferences", "PUT", json.encodeToString(PreferencesBody.serializer(), PreferencesBody(JsonObject(data), iso(updated))))
            }
            Learner.clearGuest()
            status = Status.SAVED
        } catch (e: SignedOut) {
            working = false
            forgetToken(); setUser(null); return
        } catch (e: Exception) {
            status = Status.RETRY
        }
        working = false
        if (rerun) { rerun = false; sync() }
    }
}
