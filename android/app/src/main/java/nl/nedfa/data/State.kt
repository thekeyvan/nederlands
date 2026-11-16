package nl.nedfa.data

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.io.File
import java.util.UUID
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString

/** Your reviews and review history, saved on this device per account (or as a guest) and synced by Cloud. */
object Learner {
    var reviews by mutableStateOf<Map<String, Review>>(emptyMap())
        private set
    var events by mutableStateOf<List<ReviewEvent>>(emptyList())
        private set
    var identity = "guest"
        private set
    /** Called after every review, so Cloud can save it online. */
    var onChange: (() -> Unit)? = null
    private lateinit var folder: File

    @Serializable
    private data class Saved(val reviews: Map<String, Review> = emptyMap(), val events: List<ReviewEvent> = emptyList())

    fun init(context: Context) {
        folder = File(context.filesDir, "progress").apply { mkdirs() }
        load("guest")
    }

    private fun file(id: String) = File(folder, "${id.replace(Regex("[^A-Za-z0-9_-]"), "_")}.json")

    private fun load(id: String) {
        identity = id
        val valid = Content.allIds
        val saved = runCatching { json.decodeFromString<Saved>(file(id).readText()) }.getOrNull()
        if (saved == null) { reviews = emptyMap(); events = emptyList(); return }
        reviews = saved.reviews.filterKeys { it in valid }
        events = saved.events.filter { it.cardId in valid }.takeLast(2000)
    }

    private fun save() {
        runCatching {
            val target = file(identity)
            val temp = File(folder, "${target.name}.tmp")
            temp.writeText(json.encodeToString(Saved(reviews, events)))
            temp.renameTo(target)
        }
    }

    fun review(cardId: String, grade: Int) {
        val now = now()
        reviews = reviews + (cardId to SRS.schedule(reviews[cardId], grade, now))
        events = (events + ReviewEvent(UUID.randomUUID().toString().lowercase(), cardId, grade, now)).takeLast(2000)
        save()
        onChange?.invoke()
    }

    /** Signing in: switch to the account's progress and bring along what was practised as a guest. */
    fun switchUser(id: String?) {
        val next = id ?: "guest"
        if (next == identity) return
        val guest = if (identity == "guest") reviews to events else null
        load(next)
        if (id != null && guest != null) merge(guest.first, guest.second) else save()
    }

    fun merge(remote: Map<String, Review>, remoteEvents: List<ReviewEvent>) {
        val valid = Content.allIds
        val merged = reviews.toMutableMap()
        for ((id, review) in remote) {
            if (id !in valid) continue
            val local = merged[id]
            if (local != null && local.lastReviewed >= review.lastReviewed) continue
            merged[id] = review
        }
        reviews = merged
        val byId = LinkedHashMap<String, ReviewEvent>()
        events.forEach { byId.putIfAbsent(it.id, it) }
        remoteEvents.filter { it.cardId in valid }.forEach { byId[it.id] = it }
        events = byId.values.sortedBy { it.at }.takeLast(2000)
        save()
    }

    fun clearGuest() { file("guest").delete() }

    /** Removes everything on this device. */
    fun forgetDevice() {
        folder.listFiles()?.forEach { it.delete() }
        identity = "guest"; reviews = emptyMap(); events = emptyList()
    }
}

/** Settings that follow you between devices (daily goal, level) and ones that stay on this phone (voice, look). */
object Preferences {
    val goals = listOf(5, 10, 20)
    val levels = LevelPlan.levels
    private lateinit var store: SharedPreferences

    var goal by mutableStateOf(5); private set
    var voice by mutableStateOf("ronnie"); private set
    var speed by mutableStateOf(1f); private set
    var appearance by mutableStateOf("system"); private set
    var reminderHour by mutableStateOf<Int?>(null); private set
    var welcomeDone by mutableStateOf(false); private set
    var level by mutableStateOf<String?>(null); private set
    var records by mutableStateOf<Map<String, Int>>(emptyMap()); private set
    var updatedAt by mutableStateOf<Long?>(null); private set

    fun init(context: Context) {
        store = context.getSharedPreferences("nedfa", Context.MODE_PRIVATE)
        goal = store.getInt("goal", 5).takeIf { it in goals } ?: 5
        voice = store.getString("voice", "ronnie") ?: "ronnie"
        speed = store.getFloat("speed", 1f)
        appearance = store.getString("appearance", "system") ?: "system"
        reminderHour = store.getInt("reminderHour", -1).takeIf { it >= 0 }
        welcomeDone = store.getBoolean("welcomeDone", false)
        level = store.getString("level", null)?.takeIf { it in levels }
        records = runCatching { json.decodeFromString<Map<String, Int>>(store.getString("records", "{}")!!) }.getOrDefault(emptyMap())
        updatedAt = store.getLong("preferencesUpdated", -1).takeIf { it > 0 }
    }

    private fun touch(at: Long? = now()) { updatedAt = at; store.edit().putLong("preferencesUpdated", at ?: -1).apply() }

    fun setGoal(value: Int, sync: Boolean = true) { goal = value; store.edit().putInt("goal", value).apply(); if (sync) touch() }
    fun setLevel(value: String?, sync: Boolean = true) {
        val changed = value != level
        level = value; store.edit().putString("level", value).apply()
        if (sync && changed) touch()
    }
    fun setRemoteUpdated(at: Long?) = touch(at)
    fun changeVoice(value: String) { voice = value; store.edit().putString("voice", value).apply() }
    fun changeSpeed(value: Float) { speed = value; store.edit().putFloat("speed", value).apply() }
    fun changeAppearance(value: String) { appearance = value; store.edit().putString("appearance", value).apply() }
    fun changeReminderHour(value: Int?) { reminderHour = value; store.edit().putInt("reminderHour", value ?: -1).apply() }
    fun changeWelcomeDone(value: Boolean) { welcomeDone = value; store.edit().putBoolean("welcomeDone", value).apply() }

    /** Saves a game score; returns the previous best. */
    fun record(game: String, score: Int): Int {
        val previous = records[game] ?: 0
        records = records + (game to maxOf(previous, score))
        store.edit().putString("records", json.encodeToString(records)).apply()
        return previous
    }

    fun reset() {
        store.edit().clear().apply()
        goal = 5; voice = "ronnie"; speed = 1f; appearance = "system"; reminderHour = null; welcomeDone = false
        records = emptyMap(); level = null; updatedAt = null
    }
}
