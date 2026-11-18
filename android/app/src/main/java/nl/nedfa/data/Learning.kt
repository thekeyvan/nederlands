package nl.nedfa.data

import java.text.Normalizer
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlinx.serialization.Serializable

// The learning rules, the same as the website (src/core) and the iPhone app (ios-native/Nedfa/Model).

/** One card's place in the SM-2 schedule. Times are epoch milliseconds. */
@Serializable
data class Review(
    val ease: Double,
    val interval: Int,
    val repetitions: Int,
    val due: Long,
    val lastReviewed: Long,
    val grade: Int,
    val reviews: Int,
)

@Serializable
data class ReviewEvent(val id: String, val cardId: String, val grade: Int, val at: Long)

enum class Status { NEW, LEARNING, KNOWN }

private val zone: ZoneId get() = ZoneId.systemDefault()
fun day(millis: Long): LocalDate = Instant.ofEpochMilli(millis).atZone(zone).toLocalDate()
fun now() = System.currentTimeMillis()

/** SM-2, exactly as on the website: right first time = 4, right with a hint or small slip = 3, wrong = 1. */
object SRS {
    val ratings = listOf(1 to "Nog niet", 3 to "Moeilijk", 4 to "Goed", 5 to "Makkelijk")

    fun schedule(previous: Review?, grade: Int, now: Long = now()): Review {
        val ease = previous?.ease ?: 2.5
        var repetitions = previous?.repetitions ?: 0
        var interval: Int
        if (grade < 3) {
            repetitions = 0
            interval = 1
        } else {
            interval = when (repetitions) {
                0 -> 1
                1 -> 6
                else -> ceil((previous?.interval ?: 1) * ease).toInt()
            }
            repetitions += 1
        }
        interval = min(36500, interval)
        val g = (5 - grade).toDouble()
        val nextEase = min(10.0, max(1.3, ease + 0.1 - g * (0.08 + g * 0.02)))
        val due = Instant.ofEpochMilli(now).atZone(zone).plusDays(interval.toLong()).toInstant().toEpochMilli()
        return Review((nextEase * 100).roundToInt() / 100.0, interval, repetitions, due, now, grade, (previous?.reviews ?: 0) + 1)
    }

    fun status(review: Review?): Status {
        if (review == null) return Status.NEW
        if (review.grade < 3) return Status.LEARNING
        return if (review.repetitions >= 3) Status.KNOWN else Status.LEARNING
    }

    /** Cards that are due first (oldest first), then up to `newLimit` new ones. */
    fun queue(cards: List<Card>, reviews: Map<String, Review>, limit: Int = 20, newLimit: Int = 5, now: Long = now()): List<Card> {
        val due = cards.filter { reviews[it.id]?.let { r -> r.due <= now } ?: false }.sortedBy { reviews[it.id]!!.due }
        val fresh = cards.filter { reviews[it.id] == null }.take(newLimit)
        return (due + fresh).take(limit)
    }
}

/** Which cards a round asks: the same choices as Oefenen on the website. */
object Planner {
    enum class Kind { ALL, WOORDEN, PRAKTISCH, ZINNEN }

    fun plan(reviews: Map<String, Review>, theme: String = "all", kind: Kind = Kind.ALL, limit: Int = 20, cardIds: List<String>? = null): List<Card> {
        var pool = when (kind) {
            Kind.WOORDEN -> Content.words
            Kind.PRAKTISCH -> Content.phrases
            Kind.ZINNEN -> Content.grammar
            Kind.ALL -> Content.cards
        }
        if (theme != "all") pool = pool.filter { it.themeId == theme }
        if (cardIds != null) { val set = cardIds.toSet(); pool = pool.filter { it.id in set } }
        if (kind == Kind.ALL) {
            // Alternate words and practical sentences, like the website.
            val words = pool.filter { !it.isPhrase }
            val practical = pool.filter { it.isPhrase }
            val mixed = ArrayList<Card>()
            for (i in 0 until max(words.size, practical.size)) {
                if (i < words.size) mixed.add(words[i])
                if (i < practical.size) mixed.add(practical[i])
            }
            pool = mixed
        }
        return SRS.queue(pool, reviews, limit)
    }

    /** Cards first practised before today: due ones first, then the ones practised longest ago. */
    fun oldCards(reviews: Map<String, Review>, events: List<ReviewEvent>, now: Long = now()): List<Card> {
        val first = HashMap<String, Long>()
        for (event in events) if (!first.containsKey(event.cardId)) first[event.cardId] = event.at
        val today = day(now)
        val old = Content.cards.filter { card ->
            val review = reviews[card.id] ?: return@filter false
            day(first[card.id] ?: review.lastReviewed) != today
        }
        val due = old.filter { reviews[it.id]!!.due <= now }.sortedBy { reviews[it.id]!!.due }
        val dueIds = due.map { it.id }.toSet()
        val rest = old.filter { it.id !in dueIds }.sortedBy { reviews[it.id]!!.lastReviewed }
        return due + rest
    }

    fun mission(id: String, reviews: Map<String, Review>, events: List<ReviewEvent> = emptyList(), theme: String = "all", limit: Int = 5): List<Card> {
        fun oldest(list: List<Card>) = list.mapNotNull { c -> reviews[c.id]?.let { c to it.lastReviewed } }.sortedBy { it.second }.map { it.first }
        return when (id) {
            "zinnen" -> plan(reviews, kind = Kind.PRAKTISCH, limit = limit).ifEmpty { oldest(Content.phrases).take(limit) }
            "nieuw" -> {
                val fresh = Content.cards.filter { reviews[it.id] == null }
                (fresh.filter { it.themeId == theme } + fresh.filter { it.themeId != theme }).take(limit)
            }
            else -> oldCards(reviews, events).take(limit)
        }
    }

    /** New cards get recognition modes; cards you know well get recall (typing). */
    fun mode(card: Card, review: Review?, position: Int): String {
        card.mode?.let { return it }
        val repetitions = review?.repetitions ?: 0
        return when {
            card.isGrammar -> if ((card.prompt?.contains("___") == true) && card.answer != null) "gap" else "flash"
            card.isPhrase -> if (repetitions >= 2) "flash" else if (card.hasAudio) "listen" else "flash"
            card.meaning == null -> "flash"
            review == null -> "choose"
            repetitions < 2 -> if (position % 2 == 0 && card.hasAudio) "listen" else "reverse"
            else -> "type"
        }
    }
}

object Answer {
    enum class Result { CORRECT, CLOSE, WRONG }

    private val punctuation = ".,!?;:\"“”'’()".toSet()

    fun normalize(text: String): String {
        val lowered = text.lowercase(Locale("nl"))
        val folded = Normalizer.normalize(lowered, Normalizer.Form.NFD).replace(Regex("\\p{Mn}+"), "")
        val stripped = folded.filter { it !in punctuation }
        return stripped.split(Regex("\\s+")).filter { it.isNotEmpty() }.joinToString(" ")
    }

    fun distance(a: String, b: String): Int {
        if (a.isEmpty()) return b.length
        if (b.isEmpty()) return a.length
        val row = IntArray(b.length + 1) { it }
        for (i in 1..a.length) {
            var previous = row[0]
            row[0] = i
            for (j in 1..b.length) {
                val current = row[j]
                row[j] = minOf(row[j] + 1, row[j - 1] + 1, previous + if (a[i - 1] == b[j - 1]) 0 else 1)
                previous = current
            }
        }
        return row[b.length]
    }

    private val article = Regex("^(de|het|een) ")

    /** CLOSE covers a missing article or a small typo: right idea, worth a second look. */
    fun check(input: String, expected: String): Pair<Result, String?> {
        val given = normalize(input)
        val want = normalize(expected)
        if (given.isEmpty()) return Result.WRONG to null
        if (given == want) return Result.CORRECT to null
        if (article.containsMatchIn(want)) {
            val bareWant = want.replace(article, "")
            if (given == bareWant || given.replace(article, "") == bareWant) return Result.CLOSE to "article"
        }
        val allowed = if (want.length >= 10) 2 else if (want.length >= 5) 1 else 0
        if (allowed > 0 && distance(given, want) <= allowed) return Result.CLOSE to "typo"
        return Result.WRONG to null
    }

    fun grade(result: Result, hinted: Boolean = false) = when (result) {
        Result.CORRECT -> if (hinted) 3 else 4
        Result.CLOSE -> 3
        Result.WRONG -> 1
    }
}

/** XP: 10 for a right answer, 5 for an attempt. */
object XP {
    fun forGrade(grade: Int) = if (grade >= 3) 10 else 5
}

/** Onregelmatig: the same rules as src/core/irregular.js. Every form is a review card with the normal schedule. */
object Irregular {
    data class Progress(val total: Int, val done: Int, val known: Int, val due: Int, val stars: Int)

    fun known(review: Review?) = (review?.repetitions ?: 0) >= 3 && (review?.grade ?: 0) >= 3

    fun progress(set: IrregularSet, reviews: Map<String, Review>, now: Long = now()): Progress {
        val ids = set.cardIds
        val total = ids.size
        val done = ids.count { reviews[it] != null }
        val known = ids.count { known(reviews[it]) }
        val due = ids.count { reviews[it]?.let { r -> r.due <= now } ?: false }
        return Progress(total, done, known, due, Stats.stars(total, done, known))
    }

    /** A round of ten: forms that are due, then new ones in order, then the ones practised longest ago. */
    fun round(setId: String, reviews: Map<String, Review>, now: Long = now(), limit: Int = 10): List<Card> {
        val pool = if (setId == "all") Content.irregular.cards else Content.irregularSet(setId)?.let { Content.irregularCards(it) } ?: emptyList()
        val practised = pool.mapNotNull { c -> reviews[c.id]?.let { c to it } }
        val due = practised.filter { it.second.due <= now }.sortedBy { it.second.due }.map { it.first }
        val rest = practised.filter { it.second.due > now }.sortedBy { it.second.lastReviewed }.map { it.first }
        val fresh = if (setId == "all") emptyList() else pool.filter { reviews[it.id] == null }
        val queue = (due + fresh + rest).take(limit)
        if (queue.isNotEmpty() || setId != "all") return queue
        return Content.irregular.sets.firstOrNull()?.let { Content.irregularCards(it).take(limit) } ?: emptyList()
    }

    /** New forms are chosen; after two good answers you type them. */
    fun typed(review: Review?) = (review?.repetitions ?: 0) >= 2
    fun isVerb(card: Card) = card.labels?.firstOrNull() == "werkwoord"

    fun check(input: String, card: Card): Pair<Answer.Result, String?> {
        val given = Answer.normalize(input)
        if (given.isEmpty()) return Answer.Result.WRONG to null
        val accepted = card.accept ?: listOf(card.answer ?: "")
        if (accepted.any { Answer.normalize(it) == given }) return Answer.Result.CORRECT to null
        if (card.ask == 2 && isVerb(card) && accepted.any { Answer.normalize(it.split(" ").drop(1).joinToString(" ")) == given }) return Answer.Result.CLOSE to "aux"
        return Answer.Result.WRONG to null
    }
}

/** The game layer, computed from real reviews like on the website: XP, level, streak, stars, stamps, missions. */
class Stats(reviews: Map<String, Review>, events: List<ReviewEvent>, now: Long = now()) {
    data class Level(val number: Int, val name: String, val next: LevelInfo?, val toNext: Int, val progress: Double)
    data class Streak(val count: Int, val today: Boolean)
    data class ThemeProgress(val theme: Theme, val total: Int, val done: Int, val known: Int, val stars: Int)
    data class Mission(val id: String, val title: String, val picture: String, val count: Int, val target: Int) { val done get() = count >= target }
    data class Day(val date: LocalDate, val label: String, val count: Int)

    val xp: Int
    val level: Level
    val streak: Streak
    val bestStreak: Int
    val practised: Int
    val known: Int
    val due: Int
    val themes: List<ThemeProgress>
    val earned: Set<String>
    val today: Int
    val week: List<Day>
    val missions: List<Mission>
    private val byTheme: Map<String, ThemeProgress>

    init {
        val attempts = reviews.values.sumOf { it.reviews }
        val misses = events.count { it.grade < 3 }
        xp = max(0, attempts * 10 - misses * 5)
        val levels = Content.levels.ifEmpty { listOf(LevelInfo("Starter", 0)) }
        var index = 0
        levels.forEachIndexed { i, l -> if (xp >= l.xp) index = i }
        val current = levels[index]
        val next = levels.getOrNull(index + 1)
        level = if (next != null) Level(index + 1, current.name, next, next.xp - xp, min(1.0, (xp - current.xp).toDouble() / (next.xp - current.xp)))
        else Level(index + 1, current.name, null, 0, 1.0)

        val days = events.map { day(it.at) }.toHashSet()
        val todayDate = day(now)
        var cursor = todayDate
        val practisedToday = days.contains(cursor)
        if (!practisedToday) cursor = cursor.minusDays(1)
        var count = 0
        while (days.contains(cursor)) { count++; cursor = cursor.minusDays(1) }
        streak = Streak(count, practisedToday)
        var best = 0
        for (d in days) if (!days.contains(d.minusDays(1))) {
            var run = 0; var step = d
            while (days.contains(step)) { run++; step = step.plusDays(1) }
            best = max(best, run)
        }
        bestStreak = best

        val valid = Content.cards.map { it.id }.toHashSet()
        practised = reviews.keys.count { it in valid }
        known = reviews.values.count { SRS.status(it) == Status.KNOWN }
        due = reviews.values.count { it.due <= now }
        themes = Content.themes.map { theme ->
            val list = Content.cards(theme.id)
            val done = list.count { reviews[it.id] != null }
            val k = list.count { SRS.status(reviews[it.id]) == Status.KNOWN }
            ThemeProgress(theme, list.size, done, k, stars(list.size, done, k))
        }
        byTheme = themes.associateBy { it.theme.id }

        val starred = themes.count { it.stars > 0 }
        val lessonsDone = Content.lessons.all { lesson -> lesson.cardIds.all { reviews[it] != null } }
        earned = buildSet {
            if (attempts >= 10) add("fiets")
            if (starred >= 1) add("tulp")
            if (best >= 7) add("vuur")
            if (practised >= 100) add("molen")
            if (known >= 50) add("stroopwafel")
            if (lessonsDone && Content.lessons.isNotEmpty()) add("kroon")
        }

        val todays = events.filter { day(it.at) == todayDate }
        today = todays.size
        val dutch = Locale("nl", "NL")
        // This calendar week, Monday on the left; days still to come stay empty.
        val monday = todayDate.minusDays((todayDate.dayOfWeek.value - 1).toLong())
        week = (0..6).map { offset ->
            val date = monday.plusDays(offset.toLong())
            Day(date, date.dayOfWeek.getDisplayName(TextStyle.SHORT, dutch).take(2), events.count { day(it.at) == date })
        }

        val first = HashMap<String, LocalDate>()
        for (event in events) if (!first.containsKey(event.cardId)) first[event.cardId] = day(event.at)
        val old = todays.filter { first[it.cardId] != todayDate }.map { it.cardId }.toSet().size
        val fresh = todays.filter { first[it.cardId] == todayDate }.map { it.cardId }.toSet().size
        val practical = todays.count { it.cardId.startsWith("phrase:") }
        missions = listOf(
            Mission("herhaal", "Herhaal 3 oude kaartjes", "oefenen/fouten", min(old, 3), 3),
            Mission("nieuw", "Leer 3 nieuwe kaartjes", "oefenen/woorden", min(fresh, 3), 3),
            Mission("zinnen", "Oefen 3 handige zinnen", "oefenen/zinnen", min(practical, 3), 3),
        )
    }

    fun progress(theme: String) = byTheme[theme]

    companion object {
        /** 1 star: half practised. 2 stars: everything practised. 3 stars: 80% well remembered. */
        fun stars(total: Int, done: Int, known: Int): Int {
            if (total <= 0) return 0
            if (known.toDouble() / total >= 0.8) return 3
            if (done >= total) return 2
            if (done.toDouble() / total >= 0.5) return 1
            return 0
        }
    }
}

/** What the level (from the niveautest) changes: which themes come first. Same rules as src/core/level.js. */
object LevelPlan {
    val levels = listOf("A0", "A1", "A2", "B1")
    val info = mapOf(
        "A0" to ("Beginnen" to "Je begint bij het begin: groeten, getallen en de eerste zinnen."),
        "A1" to ("Basis" to "Je kent de basis. Nu bouw je eenvoudige zinnen over je dag en je omgeving."),
        "A2" to ("Op weg" to "Je redt je in het dagelijks leven. Nu oefen je werk, wonen, zorg en de gemeente."),
        "B1" to ("Zelfstandig" to "Je spreekt al goed. Nu werk je aan lange zinnen, meningen en het inburgeringsexamen."),
    )

    private fun order(level: String?) = when (level) {
        "A0", "A1" -> listOf("A0", "A1", "A2", "B1")
        "A2" -> listOf("A2", "A1", "B1", "A0")
        "B1" -> listOf("B1", "A2", "A1", "A0")
        else -> null
    }

    fun sorted(themes: List<Theme>, level: String?): List<Theme> {
        val order = order(level) ?: return themes
        return themes.withIndex().sortedWith(compareBy({ order.indexOf(it.value.levelOrDefault).let { i -> if (i < 0) 9 else i } }, { it.index })).map { it.value }
    }

    fun suggested(level: String?, stats: Stats, count: Int = 3) =
        sorted(Content.themes, level).filter { theme -> stats.progress(theme.id)?.let { it.done < it.total } ?: true }.take(count)

    fun result(right: Map<String, Int>, passMark: Int) = levels.firstOrNull { (right[it] ?: 0) < passMark } ?: "B1"
}

/** The path: every situation in order, each with five steps. The same rules as src/core/path.js. */
object LearningPath {
    enum class StepId { WOORDEN, ZINNEN, GRAMMATICA, GESPREK, EINDSPEL }

    data class Step(
        val id: StepId, val number: Int, val title: String, val detail: String, val done: Int, val total: Int,
        val rules: List<Card> = emptyList(), val irregular: IrregularSet? = null,
    ) { val complete get() = total > 0 && done >= total }

    sealed class Launch {
        data class Round(val cards: List<Card>, val drill: Boolean) : Launch()
        data class IrregularRound(val set: String) : Launch()
        data object Game : Launch()
    }

    fun conversationId(themeId: String) = "gesprek:$themeId"

    val sections: List<Pair<PathSection, List<Theme>>> get() = Content.path.map { s -> s to s.themeIds.mapNotNull { Content.theme(it) } }
    val themes: List<Theme> get() = sections.flatMap { it.second }

    fun themesForRule(id: String) = themes.filter { it.grammar?.contains(id) == true }
    fun themesForIrregular(id: String) = themes.filter { it.irregular == id }

    private fun rules(theme: Theme) = (theme.grammar ?: emptyList()).mapNotNull { Content.card(it) }
    private fun practised(cards: List<Card>, reviews: Map<String, Review>) = cards.count { reviews[it.id] != null }

    fun steps(themeId: String, reviews: Map<String, Review>): List<Step> {
        val theme = Content.theme(themeId) ?: return emptyList()
        val words = Content.words(themeId)
        val sentences = Content.phrases(themeId)
        val rules = rules(theme)
        val irregular = theme.irregular?.let { Content.irregularSet(it) }
        val irregularCards = irregular?.let { Content.irregularCards(it) } ?: emptyList()
        val irregularDone = irregular == null || practised(irregularCards, reviews) >= min(10, irregularCards.size)
        val all = words + sentences
        val known = all.count { SRS.status(reviews[it.id]) == Status.KNOWN }
        val target = ceil(all.size * 0.8).toInt()
        return listOf(
            Step(StepId.WOORDEN, 1, "Woorden", "${words.size} woorden", practised(words, reviews), words.size),
            Step(StepId.ZINNEN, 2, "Handige zinnen", "${sentences.size} zinnen", practised(sentences, reviews), sentences.size),
            Step(
                StepId.GRAMMATICA, 3, "Grammatica",
                "${rules.size} ${if (rules.size == 1) "regel" else "regels"}${if (irregular != null) " + onregelmatige vormen" else ""} voor deze situatie",
                practised(rules, reviews) + if (irregular != null && irregularDone) 1 else 0,
                rules.size + if (irregular != null) 1 else 0, rules, irregular,
            ),
            Step(StepId.GESPREK, 4, "Gesprek", "Kies wat jij zegt", if (reviews[conversationId(themeId)] != null) 1 else 0, 1),
            Step(StepId.EINDSPEL, 5, "Eindspel", "Alles door elkaar, tot je het kent", min(known, target), target),
        )
    }

    fun next(steps: List<Step>) = steps.firstOrNull { !it.complete }
    fun complete(themeId: String, reviews: Map<String, Review>) = next(steps(themeId, reviews)) == null

    /** The situation you are on: the last practised if unfinished, else the next unfinished one from your level. */
    fun current(reviews: Map<String, Review>, events: List<ReviewEvent>, level: String?): String {
        val list = themes
        val first = list.firstOrNull() ?: return "huisarts"
        for (event in events.asReversed()) {
            val card = Content.card(event.cardId) ?: continue
            if (list.any { it.id == card.themeId }) {
                if (!complete(card.themeId, reviews)) return card.themeId
                break
            }
        }
        var start = 0
        if (level != null && level != "A0") {
            start = max(0, list.indexOfFirst { if (level == "B1") it.level == "B1" else it.levelOrDefault != "A0" })
        }
        val ordered = list.drop(start) + list.take(start)
        return (ordered.firstOrNull { !complete(it.id, reviews) } ?: first).id
    }

    fun launch(themeId: String, step: StepId, reviews: Map<String, Review>): Launch? {
        val theme = Content.theme(themeId) ?: return null
        fun planOrRepeat(list: List<Card>, kind: Planner.Kind): List<Card> {
            val queue = Planner.plan(reviews, themeId, kind, 10)
            if (queue.isNotEmpty()) return queue
            return list.mapNotNull { c -> reviews[c.id]?.let { c to it.lastReviewed } }.sortedBy { it.second }.map { it.first }.take(10)
        }
        return when (step) {
            StepId.WOORDEN -> Launch.Round(planOrRepeat(Content.words(themeId), Planner.Kind.WOORDEN), false)
            StepId.ZINNEN -> Launch.Round(planOrRepeat(Content.phrases(themeId), Planner.Kind.PRAKTISCH), false)
            StepId.GRAMMATICA -> {
                val rules = rules(theme)
                val fresh = rules.firstOrNull { reviews[it.id] == null }
                val pattern = fresh?.let { Content.pattern(it.id) }
                if (pattern != null) return Launch.Round(pattern.drill, true)
                val set = theme.irregular?.let { Content.irregularSet(it) }
                if (set != null) {
                    val cards = Content.irregularCards(set)
                    if (practised(cards, reviews) < min(10, cards.size)) return Launch.IrregularRound(set.id)
                }
                Launch.Round(rules.mapNotNull { Content.pattern(it.id) }.flatMap { it.drill.take(3) }.take(10), true)
            }
            StepId.GESPREK -> Launch.Game
            StepId.EINDSPEL -> {
                val pool = Content.words(themeId) + Content.phrases(themeId) + rules(theme)
                fun score(card: Card): Int {
                    val review = reviews[card.id] ?: return -1
                    return if (SRS.status(review) == Status.KNOWN) 10 + review.repetitions else review.grade + review.repetitions
                }
                Launch.Round(pool.sortedBy { score(it) }.take(12), false)
            }
        }
    }
}

/** The theme you practised most recently, or the first one for your level. */
fun resumeTheme(events: List<ReviewEvent>, level: String?): String {
    for (event in events.asReversed()) {
        val card = Content.card(event.cardId) ?: continue
        if (Content.theme(card.themeId) != null) return card.themeId
    }
    if (events.isEmpty() && level != null) return LevelPlan.sorted(Content.themes, level).firstOrNull()?.id ?: "huisarts"
    return if (events.isEmpty()) "huisarts" else "werk"
}
