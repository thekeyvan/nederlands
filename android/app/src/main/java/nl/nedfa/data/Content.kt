package nl.nedfa.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import nl.nedfa.service.ContentUpdater

// The lesson content, exported from the website's content files by scripts/native/export-content.mjs.
// The same file as the iPhone app (ios-native/Nedfa/Model/Content.swift).

@Serializable
data class Option(val label: String, val correct: Boolean = false)

@Serializable
data class OrderSpec(val first: String = "", val tiles: List<String> = emptyList(), val answer: List<String> = emptyList(), val ending: String = "")

@Serializable
data class Card(
    val id: String,
    val kind: String = "word", // word, phrase, grammar
    val themeId: String = "",
    val themeTitle: String? = null,
    val wordKind: String? = null,
    val nl: String? = null,
    val example: String? = null,
    val forms: List<String>? = null,
    val meaning: String? = null,
    val translation: String? = null,
    val level: String? = null,
    val title: String? = null,
    val pattern: String? = null,
    val prompt: String? = null,
    val answer: String? = null,
    val rule: String? = null,
    val note: String? = null,
    val hasAudio: Boolean = false,
    val exampleAudio: Boolean = false,
    val meaningOptions: List<Option>? = null,
    val dutchOptions: List<Option>? = null,
    // Set on exercises built for one grammar pattern: choose, reverse, listen, type, gap, flash, order, pick, form.
    val mode: String? = null,
    val order: OrderSpec? = null,
    val pick: List<Option>? = null,
    // Onregelmatig (mode "form").
    val set: String? = null,
    val chain: List<String>? = null,
    val labels: List<String>? = null,
    val ask: Int? = null,
    val accept: List<String>? = null,
    val choices: List<Option>? = null,
) {
    val label: String get() = nl ?: title ?: id
    val isWord get() = kind == "word"
    val isPhrase get() = kind == "phrase"
    val isGrammar get() = kind == "grammar"
}

@Serializable
data class Theme(
    val id: String,
    val title: String,
    val meaning: String = "",
    val intro: String = "",
    val group: String = "",
    val level: String? = null,
    val grammar: List<String>? = null,
    val irregular: String? = null,
) {
    val levelOrDefault get() = level ?: "A2"
}

@Serializable
data class PathSection(val id: String, val title: String, val fa: String = "", val level: String = "", val themeIds: List<String> = emptyList())

@Serializable
data class PlacementQuestion(val level: String, val kind: String, val prompt: String, val answer: String, val options: List<String>)

@Serializable
data class Placement(val passMark: Int = 4, val questions: List<PlacementQuestion> = emptyList())

@Serializable
data class ThemeGroup(val id: String, val title: String, val themeIds: List<String> = emptyList())

@Serializable
data class Example(val nl: String, val gap: String = "", val translation: String = "", val hasAudio: Boolean = false)

@Serializable
data class Pattern(val id: String, val examples: List<Example> = emptyList(), val drill: List<Card> = emptyList())

@Serializable
data class DialogueLine(val id: String, val speaker: String, val nl: String, val translation: String = "", val hasAudio: Boolean = false)

@Serializable
data class Dialogue(val id: String, val themeId: String, val lines: List<DialogueLine> = emptyList())

@Serializable
data class Lesson(
    val id: String, val title: String, val level: String = "", val grammarIds: List<String> = emptyList(),
    val themeIds: List<String> = emptyList(), val cardIds: List<String> = emptyList(), val goal: String = "", val task: String = "",
)

@Serializable
data class LevelInfo(val name: String, val xp: Int)

@Serializable
data class StampInfo(val id: String, val title: String, val description: String = "")

@Serializable
data class Resource(
    val id: String, val name: String, val categories: List<String> = emptyList(), val level: String = "", val cost: String = "",
    val description: String = "", val url: String = "", val steps: List<String> = emptyList(), val time: String? = null, val note: String? = null,
)

@Serializable
data class Voice(val id: String, val name: String)

@Serializable
data class AudioCatalog(val voices: List<Voice> = emptyList(), val clips: Map<String, String> = emptyMap())

@Serializable
data class GameArticle(val cardId: String, val article: String, val noun: String)

@Serializable
data class GameVerb(val cardId: String, val kind: String, val answer: String, val options: List<Option>)

@Serializable
data class GameCloze(val cardId: String, val before: String, val after: String, val answer: String, val options: List<Option>)

@Serializable
data class GameBuilder(val cardId: String, val first: String, val answer: List<String>, val tiles: List<String>, val ending: String = "", val sentence: String)

@Serializable
data class ConversationChoice(val lineId: String, val correct: Boolean = false)

@Serializable
data class ConversationStep(val lineId: String, val options: List<ConversationChoice>? = null)

@Serializable
data class Conversation(val dialogueId: String, val steps: List<ConversationStep> = emptyList())

@Serializable
data class GameData(
    val articles: List<GameArticle> = emptyList(),
    val verbs: List<GameVerb> = emptyList(),
    val cloze: List<GameCloze> = emptyList(),
    val dictation: List<String> = emptyList(),
    val builder: List<GameBuilder> = emptyList(),
    val conversations: List<Conversation> = emptyList(),
)

@Serializable
data class IrregularRow(val id: String, val cells: List<String>, val fa: String = "")

@Serializable
data class IrregularSet(
    val id: String, val kind: String, val group: String, val title: String, val pattern: String = "", val level: String = "",
    val rule: String = "", val cardIds: List<String> = emptyList(), val rows: List<IrregularRow> = emptyList(),
)

@Serializable
data class IrregularData(val intro: String = "", val sets: List<IrregularSet> = emptyList(), val cards: List<Card> = emptyList())

@Serializable
data class ContentFile(
    val version: String? = null,
    val themes: List<Theme> = emptyList(),
    val groups: List<ThemeGroup> = emptyList(),
    val cards: List<Card> = emptyList(),
    val patterns: List<Pattern> = emptyList(),
    val dialogues: List<Dialogue> = emptyList(),
    val lessons: List<Lesson> = emptyList(),
    val levels: List<LevelInfo> = emptyList(),
    val placement: Placement? = null,
    val stamps: List<StampInfo> = emptyList(),
    val resources: List<Resource> = emptyList(),
    val audio: AudioCatalog = AudioCatalog(),
    val games: GameData = GameData(),
    val irregular: IrregularData? = null,
    val path: List<PathSection>? = null,
)

val json = Json { ignoreUnknownKeys = true; coerceInputValues = true; explicitNulls = false }

/** All content, loaded once at launch: the newest copy from nedfa.nl if one was downloaded, else the bundled one. */
object Content {
    lateinit var file: ContentFile
        private set
    private var byId: Map<String, Card> = emptyMap()
    private var themeById: Map<String, Theme> = emptyMap()
    private var cardsByTheme: Map<String, List<Card>> = emptyMap()
    private var patternById: Map<String, Pattern> = emptyMap()
    private var lineById: Map<String, DialogueLine> = emptyMap()
    lateinit var irregular: IrregularData
        private set
    lateinit var placement: Placement
        private set
    lateinit var path: List<PathSection>
        private set

    val loaded get() = ::file.isInitialized

    fun load(context: Context) {
        if (loaded) return
        val bundled by lazy { json.decodeFromString<ContentFile>(context.assets.open("content.json").bufferedReader().use { it.readText() }) }
        // A copy downloaded before this build's content format (no path yet) is older than the bundled one.
        val downloaded = ContentUpdater.downloaded(context)?.takeIf { it.path != null && it.cards.isNotEmpty() }
        val chosen = downloaded ?: bundled
        file = chosen
        irregular = chosen.irregular ?: bundled.irregular ?: IrregularData()
        placement = chosen.placement?.takeIf { it.questions.isNotEmpty() } ?: bundled.placement ?: Placement()
        path = chosen.path ?: bundled.path ?: emptyList()
        val map = LinkedHashMap<String, Card>()
        (chosen.cards + irregular.cards).forEach { if (!map.containsKey(it.id)) map[it.id] = it }
        byId = map
        themeById = chosen.themes.associateBy { it.id }
        cardsByTheme = chosen.cards.groupBy { it.themeId }
        patternById = chosen.patterns.associateBy { it.id }
        lineById = chosen.dialogues.flatMap { it.lines }.associateBy { it.id }
        words = chosen.cards.filter { it.isWord }
        phrases = chosen.cards.filter { it.isPhrase }
        grammar = chosen.cards.filter { it.isGrammar }
        allIds = byId.keys + chosen.themes.map { "gesprek:${it.id}" }
    }

    val version get() = file.version
    val themes get() = file.themes
    val cards get() = file.cards
    val dialogues get() = file.dialogues
    val lessons get() = file.lessons
    val levels get() = file.levels
    val stamps get() = file.stamps
    val resources get() = file.resources
    val audio get() = file.audio
    val games get() = file.games

    var words: List<Card> = emptyList(); private set
    var phrases: List<Card> = emptyList(); private set
    var grammar: List<Card> = emptyList(); private set
    /** Every id progress can be saved for: lesson cards, irregular forms and conversations. */
    var allIds: Set<String> = emptySet(); private set

    fun card(id: String) = byId[id]
    fun theme(id: String) = themeById[id]
    fun cards(theme: String) = cardsByTheme[theme] ?: emptyList()
    fun words(theme: String) = cards(theme).filter { it.isWord }
    fun phrases(theme: String) = cards(theme).filter { it.isPhrase }
    fun pattern(id: String) = patternById[id]
    fun line(id: String) = lineById[id]
    fun dialogue(theme: String) = dialogues.firstOrNull { it.themeId == theme }
    fun irregularSet(id: String) = irregular.sets.firstOrNull { it.id == id }
    fun irregularCards(set: IrregularSet) = set.cardIds.mapNotNull { byId[it] }
}
