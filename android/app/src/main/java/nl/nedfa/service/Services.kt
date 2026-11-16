package nl.nedfa.service

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Build
import android.content.res.Resources
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.io.File
import java.text.Normalizer
import java.util.Calendar
import java.util.Locale
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import nl.nedfa.BuildConfig
import nl.nedfa.MainActivity
import nl.nedfa.R
import nl.nedfa.data.Content
import nl.nedfa.data.ContentFile
import nl.nedfa.data.Preferences
import nl.nedfa.data.json

/**
 * Plays the Dutch clips (Ronnie or Pim). Clips come from nedfa.nl the first time and are kept on the phone,
 * so a sentence you heard once also plays offline.
 */
object Audio {
    val speeds = listOf(0.75f, 0.85f, 1f, 1.15f, 1.25f)
    var playing by mutableStateOf<String?>(null); private set
    private var player: MediaPlayer? = null
    private var job: Job? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var folder: File

    fun init(context: Context) { folder = File(context.filesDir, "audio") }

    fun has(text: String?) = text != null && Content.audio.clips.containsKey(text)

    fun play(text: String, speed: Float? = null) {
        stop()
        val key = Content.audio.clips[text] ?: return
        val voice = Preferences.voice
        playing = text
        job = scope.launch {
            val file = File(folder, "$voice/$key.mp3")
            if (!file.exists()) {
                val bytes = Http.download("https://nedfa.nl/assets/audio/$voice/$key.mp3") ?: run { if (playing == text) playing = null; return@launch }
                file.parentFile?.mkdirs()
                val temp = File(file.parentFile, "$key.tmp")
                temp.writeBytes(bytes)
                temp.renameTo(file)
            }
            if (playing != text) return@launch
            runCatching {
                val next = MediaPlayer()
                next.setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                next.setDataSource(file.path)
                next.prepare()
                next.playbackParams = PlaybackParams().setSpeed(speed ?: Preferences.speed)
                next.setOnCompletionListener { if (player === it) { it.release(); player = null; playing = null } }
                next.start()
                player = next
            }.onFailure { file.delete(); playing = null }
        }
    }

    fun stop() {
        job?.cancel()
        player?.let { runCatching { it.stop() }; it.release() }
        player = null
        playing = null
    }
}

/** Fetches new lessons from nedfa.nl/api/v1. A new version is used from the next launch, never mid-round. */
object ContentUpdater {
    private const val API = "https://nedfa.nl/api/v1"
    private fun file(context: Context) = File(context.filesDir, "content/content.json")

    fun downloaded(context: Context): ContentFile? {
        val file = file(context)
        if (!file.exists()) return null
        return runCatching { json.decodeFromString<ContentFile>(file.readText()) }.getOrElse { file.delete(); null }
    }

    suspend fun check(context: Context) {
        try {
            val version = Http.request("$API/version", timeout = 10_000)
            if (version.code != 200) return
            val latest = json.parseToJsonElement(version.body).jsonObject["version"]?.jsonPrimitive?.content ?: return
            if (latest == Content.version) return
            val file = file(context)
            val current = runCatching { json.parseToJsonElement(file.readText()).jsonObject["version"]?.jsonPrimitive?.content }.getOrNull()
            if (latest == current) return
            val body = Http.request("$API/content", timeout = 60_000)
            if (body.code != 200) return
            val content = json.decodeFromString<ContentFile>(body.body)
            if (content.version != latest || content.cards.isEmpty()) return
            file.parentFile?.mkdirs()
            val temp = File(file.parentFile, "content.tmp")
            temp.writeText(body.body)
            temp.renameTo(file)
        } catch (e: Exception) {
            // Offline or the server is busy: try again next launch.
        }
    }
}

/**
 * Anonymous usage statistics, sent to the same Umami as the website (https://nedfa.nl/stats, see docs/ANALYTICS.md).
 * No account id, no device id, nothing the learner typed. Off in debug builds and when turned off in Instellingen.
 */
object Analytics {
    private const val WEBSITE = "0cbc91c6-7ae2-4c9a-9851-d005214361fa"
    private const val ENDPOINT = "https://nedfa.nl/stats/api/send"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var store: android.content.SharedPreferences
    private var cache: String? = null
    private var lastPath = "/android"
    var enabled: Boolean
        get() = !store.getBoolean("nedfa.stats.off", false)
        set(value) { store.edit().putBoolean("nedfa.stats.off", !value).apply() }

    fun init(context: Context) { store = context.getSharedPreferences("nedfa", Context.MODE_PRIVATE) }

    fun screen(name: String) {
        val path = "/android/" + slug(name)
        if (path == lastPath) return
        lastPath = path
        send(mapOf("url" to JsonPrimitive(path), "title" to JsonPrimitive(name)))
    }

    fun event(name: String, data: Map<String, Any> = emptyMap()) {
        val extra = mutableMapOf<String, kotlinx.serialization.json.JsonElement>("url" to JsonPrimitive(lastPath), "name" to JsonPrimitive(name))
        if (data.isNotEmpty()) extra["data"] = JsonObject(data.mapValues { (_, v) -> when (v) { is Number -> JsonPrimitive(v); is Boolean -> JsonPrimitive(v); else -> JsonPrimitive(v.toString()) } })
        send(extra)
    }

    private fun send(extra: Map<String, kotlinx.serialization.json.JsonElement>) {
        if (BuildConfig.DEBUG || !enabled) return
        val metrics = Resources.getSystem().displayMetrics
        val payload = buildMap<String, kotlinx.serialization.json.JsonElement> {
            put("website", JsonPrimitive(WEBSITE)); put("hostname", JsonPrimitive("nedfa.nl")); put("referrer", JsonPrimitive(""))
            put("language", JsonPrimitive(Locale.getDefault().toLanguageTag()))
            put("screen", JsonPrimitive("${(metrics.widthPixels / metrics.density).toInt()}x${(metrics.heightPixels / metrics.density).toInt()}"))
            putAll(extra)
        }
        val body = buildJsonObject { put("type", "event"); put("payload", JsonObject(payload)) }.toString()
        // A browser-style agent, so the statistics show "Android, mobile" instead of an unknown client.
        val agent = "Mozilla/5.0 (Linux; Android ${Build.VERSION.RELEASE}; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Nedfa/${BuildConfig.VERSION_NAME}"
        scope.launch {
            val headers = buildMap { put("User-Agent", agent); cache?.let { put("x-umami-cache", it) } }
            runCatching { Http.request(ENDPOINT, "POST", body, headers, 10_000) }.getOrNull()?.let { result ->
                runCatching { json.parseToJsonElement(result.body).jsonObject["cache"]?.jsonPrimitive?.content }.getOrNull()?.let { cache = it }
            }
        }
    }

    /** "Thema: Werk & geld" → "thema-werk-geld". */
    private fun slug(name: String): String {
        val folded = Normalizer.normalize(name.lowercase(Locale("nl")), Normalizer.Form.NFD).replace(Regex("\\p{Mn}+"), "")
        return folded.split(Regex("[^\\p{L}\\p{N}]+")).filter { it.isNotEmpty() }.joinToString("-")
    }
}

/** Feedback from Instellingen, to the same inbox as the website and the iPhone app. */
object Feedback {
    suspend fun send(kind: String, message: String, screen: String): Boolean {
        val body = buildJsonObject {
            put("kind", kind); put("message", message); put("screen", screen)
            put("context", buildJsonObject { put("device", "${Build.MANUFACTURER} ${Build.MODEL}"); put("android", Build.VERSION.RELEASE) })
            put("platform", "android"); put("appVersion", "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})")
        }.toString()
        return runCatching { Http.request("https://nedfa.nl/api/feedback", "POST", body).code in 200..299 }.getOrDefault(false)
    }
}

/** Daily reminder at a chosen hour, planned on the phone itself. */
object Reminder {
    private const val CHANNEL = "daily"

    fun allowed(context: Context) = Build.VERSION.SDK_INT < 33 ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    private fun intent(context: Context) = PendingIntent.getBroadcast(
        context, 1, Intent(context, ReminderReceiver::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    fun schedule(context: Context, hour: Int?) {
        val alarms = context.getSystemService(AlarmManager::class.java)
        alarms.cancel(intent(context))
        if (hour == null) return
        val next = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
        }
        alarms.setInexactRepeating(AlarmManager.RTC_WAKEUP, next.timeInMillis, AlarmManager.INTERVAL_DAY, intent(context))
    }

    fun show(context: Context) {
        if (!allowed(context)) return
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel(CHANNEL, "Dagelijkse herinnering", NotificationManager.IMPORTANCE_DEFAULT))
        val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Even oefenen?")
            .setContentText("Vijf kaartjes houden je reeks vast.")
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        manager.notify(1, notification)
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val hour = context.getSharedPreferences("nedfa", Context.MODE_PRIVATE).getInt("reminderHour", -1)
            Reminder.schedule(context, hour.takeIf { it >= 0 })
        } else {
            Reminder.show(context)
        }
    }
}
