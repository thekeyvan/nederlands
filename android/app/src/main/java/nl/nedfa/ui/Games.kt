package nl.nedfa.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.temporal.WeekFields
import java.util.Locale
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import nl.nedfa.GameLaunch
import nl.nedfa.Session
import nl.nedfa.TrackScreen
import nl.nedfa.data.Answer
import nl.nedfa.data.Card
import nl.nedfa.data.Content
import nl.nedfa.data.Conversation
import nl.nedfa.data.ConversationChoice
import nl.nedfa.data.DialogueLine
import nl.nedfa.data.GameArticle
import nl.nedfa.data.GameBuilder
import nl.nedfa.data.LearningPath
import nl.nedfa.data.Learner
import nl.nedfa.data.Option
import nl.nedfa.data.OrderSpec
import nl.nedfa.data.Preferences
import nl.nedfa.data.Theme
import nl.nedfa.data.Why
import nl.nedfa.data.spellingWhy
import nl.nedfa.data.whyFor
import nl.nedfa.service.Analytics
import nl.nedfa.service.Audio

@Suppress("EnumEntryName")
enum class GameId(val title: String, val length: String, val howTo: List<String>) {
    lidwoord("De of het?", "60 seconden", listOf("Je ziet een zelfstandig naamwoord.", "Tik op de of het, zo snel als je kunt.", "Je hebt 60 seconden. Elke goede keuze is een punt.")),
    tijdrace("Tijdrace", "60 seconden", listOf("Je ziet een Nederlands woord.", "Kies de goede vertaling.", "Zo veel mogelijk in 60 seconden.")),
    zinsbouwer("Zinnen bouwen", "8 zinnen", listOf("Je ziet de vertaling van een zin.", "Sleep of tik de woorden in de goede volgorde.", "Het eerste woord staat er al.")),
    aanvullen("Zinnen aanvullen", "10 zinnen", listOf("In elke zin mist één woord.", "Kies het woord dat past.", "Tien zinnen per ronde.")),
    werkwoorden("Werkwoorden", "10 vragen", listOf("Je ziet een werkwoord.", "Kies de goede verleden tijd of het voltooid deelwoord.", "Let op hebben of zijn, t of d.")),
    dictee("Luisterdictee", "8 opnames", listOf("Tik op de luidspreker en luister.", "Typ wat je hoort. Je mag vaker luisteren.", "Een kleine typfout telt ook als goed.")),
    gesprek("Gesprekken", "1 of 3 gesprekken", listOf("Lees of luister wat de ander zegt.", "Bij jouw beurt zie je wat je wilt zeggen. Kies de Nederlandse zin die dat zegt.", "Vanuit een situatie oefen je het gesprek van die situatie; in de Arcade drie gesprekken."));

    companion object {
        /** One game is the challenge of the week, so the Arcade looks different each week. */
        val weekly: GameId get() = entries[LocalDate.now().get(WeekFields.of(Locale("nl", "NL")).weekOfWeekBasedYear()) % entries.size]
    }
}

/** Arcade: the challenge of the week as a big card, then every game as a 3D tile. */
@Composable
fun SpellenScreen() {
    TrackScreen("Arcade")
    var theme by rememberSaveable { mutableStateOf("all") }
    var menu by remember { mutableStateOf(false) }
    val weekly = GameId.weekly
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 30.dp), verticalArrangement = Arrangement.spacedBy(22.dp)) {
        Box(Modifier.padding(horizontal = 20.dp).padding(top = 8.dp)) {
            ScreenTitle("Arcade", "${GameId.entries.size} spellen") {
                Box {
                    Row(Modifier.clickable { menu = true }.padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        T(Content.theme(theme)?.title ?: "Alle thema’s", size = 15.sp, weight = FontWeight.SemiBold, color = C.brand, maxLines = 1)
                        Icon(Icons.Filled.ExpandMore, null, tint = C.brand, modifier = Modifier.size(18.dp))
                    }
                    DropdownMenu(menu, { menu = false }, Modifier.heightIn(max = 420.dp)) {
                        DropdownMenuItem({ Text("Alle thema’s") }, { theme = "all"; menu = false })
                        Content.themes.forEach { t -> DropdownMenuItem({ Text(t.title) }, { theme = t.id; menu = false }) }
                    }
                }
            }
        }
        FeaturedGame(weekly, Preferences.records[weekly.name]) { Session.play(weekly, theme) }
        GameGrid(GameId.entries.filter { it != weekly }, theme, Modifier.padding(horizontal = 20.dp))
    }
}

@Composable
private fun FeaturedGame(game: GameId, record: Int?, play: () -> Unit) {
    PressableTile(play, Modifier.padding(horizontal = 20.dp).fillMaxWidth(), fill = C.brand, edge = C.brandEdge, radius = 30.dp) {
        Row(Modifier.fillMaxWidth().heightIn(min = 200.dp).padding(20.dp)) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                T("UITDAGING VAN DE WEEK", Modifier.background(Color.White.copy(alpha = 0.22f), CircleShape).padding(horizontal = 10.dp, vertical = 4.dp), size = 11.sp, weight = FontWeight.Black, color = Color.White, maxLines = 1)
                T(game.title, style = game(28, FontWeight.Black), color = Color.White, maxLines = 1)
                T(game.length, size = 15.sp, weight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.9f))
                Spacer(Modifier.height(8.dp))
                Row(Modifier.background(Color.White, RoundedCornerShape(16.dp)).height(44.dp).padding(horizontal = 18.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.PlayArrow, null, tint = C.brand)
                    Spacer(Modifier.width(6.dp))
                    T(record?.let { "Speel · record $it" } ?: "Speel", style = game(16, FontWeight.Black), color = C.brand)
                }
            }
            Art("games/${game.name}", 120.dp, 28.dp, modifier = Modifier.padding(top = 30.dp).rotate(4f))
        }
    }
}

@Composable
fun GameGrid(games: List<GameId>, theme: String, modifier: Modifier = Modifier, onPick: () -> Unit = {}) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        games.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                row.forEach { game ->
                    PressableTile({ onPick(); Session.play(game, theme) }, Modifier.weight(1f)) {
                        Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Art("games/${game.name}", 150.dp, 16.dp, modifier = Modifier.fillMaxWidth())
                            T(game.title, style = game(16, FontWeight.Black), maxLines = 1)
                            T(Preferences.records[game.name]?.let { "Record $it" } ?: game.length, size = 12.sp, weight = FontWeight.SemiBold, color = C.secondary)
                        }
                    }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ThemeGamesSheet(theme: Theme, dismiss: () -> Unit) {
    ModalBottomSheet(dismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = C.ground) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            T("Spelen · ${theme.title}", style = game(20))
            GameGrid(GameId.entries, theme.id, onPick = dismiss)
        }
    }
}

/** `reasons`: why each missed card was wrong (by card id), shown under it at the end. */
data class GameResult(val score: Int, val total: Int?, val misses: List<Card>, val reasons: Map<String, Why> = emptyMap())

/** Intro, the game itself, and the end screen, shown over the screen it was opened from. */
@Composable
fun GameFlow(launch: GameLaunch) {
    TrackScreen("Spel: ${launch.game.title}")
    key(launch.id) {
        var started by remember { mutableStateOf(false) }
        var round by remember { mutableIntStateOf(0) }
        var result by remember { mutableStateOf<GameResult?>(null) }
        var confirmQuit by remember { mutableStateOf(false) }
        val close = { Audio.stop(); Session.game = null }
        BackHandler { if (started && result == null) confirmQuit = true else close() }
        Column(Modifier.fillMaxSize().background(C.ground).statusBarsPadding().navigationBarsPadding().imePadding()) {
            Box(Modifier.size(52.dp).clickable { if (started && result == null) confirmQuit = true else close() }, contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Close, "Sluiten", tint = C.text)
            }
            Box(Modifier.weight(1f)) {
                val r = result
                when {
                    r != null -> GameOver(launch.game, launch.theme, r, again = { result = null; round += 1 }, done = close)
                    !started -> GameIntro(launch) { started = true }
                    else -> key(round) { GamePlay(launch.game, launch.theme) { result = it } }
                }
            }
        }
        if (confirmQuit) Confirm("Stoppen met dit spel?", "Je score van dit spel telt dan niet mee voor je record.", "Stoppen", close, { confirmQuit = false }, destructive = true, cancel = "Doorgaan")
    }
}

@Composable
private fun GameIntro(launch: GameLaunch, start: () -> Unit) {
    val game = launch.game
    val theme = Content.theme(launch.theme)
    Column(Modifier.fillMaxSize()) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Art("games/${game.name}", 220.dp) }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Timer, null, tint = C.secondary, modifier = Modifier.size(16.dp)); Spacer(Modifier.width(4.dp))
                T((if (game == GameId.gesprek && theme != null) "1 gesprek" else game.length) + (theme?.let { " · ${it.title}" } ?: ""), size = 15.sp, color = C.secondary)
            }
            T(game.title, style = game(34, FontWeight.Black))
            game.howTo.forEachIndexed { index, line ->
                Row(verticalAlignment = Alignment.Top) {
                    Box(Modifier.size(24.dp).background(C.brand, CircleShape), contentAlignment = Alignment.Center) { T("${index + 1}", size = 13.sp, weight = FontWeight.Bold, color = Color.White) }
                    Spacer(Modifier.width(12.dp))
                    T(line)
                }
            }
            Preferences.records[game.name]?.let { record ->
                Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Filled.EmojiEvents, null, tint = C.butter); Spacer(Modifier.width(6.dp)); T("Record $record", weight = FontWeight.SemiBold, color = C.goldInk) }
            }
        }
        Box(Modifier.padding(16.dp)) { GameButton("Start", start, icon = Icons.Filled.PlayArrow, trailingIcon = false) }
    }
}

@Composable
private fun GameOver(game: GameId, theme: String, result: GameResult, again: () -> Unit, done: () -> Unit) {
    val previousBest = remember {
        val previous = Preferences.record(game.name, result.score)
        if (result.score > previous) Haptics.success()
        Analytics.event("spel klaar", mapOf("spel" to game.name, "score" to result.score))
        // A situation's conversation with half or more right finishes step 4 of its path.
        if (game == GameId.gesprek && theme != "all" && result.total != null && result.total > 0 && result.score * 2 >= result.total) {
            Learner.review(LearningPath.conversationId(theme), 4)
        }
        previous
    }
    val isBest = result.score > previousBest && result.score > 0
    val good = isBest || (result.total?.let { result.score.toDouble() / it >= 0.7 } ?: (result.score >= 10))
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Mascot(if (good) Mood.cheer else Mood.think, 170.dp)
        Eyebrow(game.title, C.brand)
        T(result.total?.let { "${result.score} van de $it goed" } ?: "${result.score} goed!", style = game(30, FontWeight.Black), align = TextAlign.Center)
        T(if (isBest) (if (previousBest > 0) "Nieuw record! Je vorige record was $previousBest." else "Je eerste record staat erop.") else "Jouw record: ${maxOf(previousBest, result.score)}.", color = C.secondary, align = TextAlign.Center)
        if (result.misses.isNotEmpty()) Column(Modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(18.dp)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            T("Nog even oefenen", weight = FontWeight.SemiBold)
            result.misses.distinctBy { it.id }.take(8).forEach { card ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        T(card.label, weight = FontWeight.Medium)
                        card.meaning?.let { Persian(it, 13) }
                        result.reasons[card.id]?.let { WhyText(it.fa, 13, C.secondary, Modifier.padding(top = 2.dp)) }
                    }
                    ListenButton(card.nl ?: "", 13)
                }
                Divider()
            }
        }
        GameButton("Nog een keer", again)
        if (result.misses.isNotEmpty()) GameButton("Oefen deze kaartjes", { Session.start(result.misses.distinctBy { it.id }, "Fouten uit ${game.title}") }, color = C.navy, edge = Color(0xFF16294A))
        T("Klaar", Modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(16.dp)).clickable(onClick = done).padding(14.dp), weight = FontWeight.SemiBold, align = TextAlign.Center)
    }
}

/** Runs one round of a game and reports the score. */
@Composable
private fun GamePlay(game: GameId, theme: String, finish: (GameResult) -> Unit) {
    fun <T> themed(all: List<T>, minimum: Int, card: (T) -> Card?): List<T> {
        if (theme == "all") return all
        val list = all.filter { card(it)?.themeId == theme }
        return if (list.size >= minimum) list else all
    }
    when (game) {
        GameId.lidwoord -> {
            val items = remember { themed(Content.games.articles, 15) { Content.card(it.cardId) }.shuffled() }
            ArticleGame(items, finish)
        }
        GameId.tijdrace -> {
            val cards = remember { val words = Content.words.filter { it.meaningOptions != null }; themed(words, 12) { it }.shuffled() }
            RaceGame(cards, finish)
        }
        GameId.werkwoorden -> {
            val questions = remember {
                themed(Content.games.verbs, 6) { Content.card(it.cardId) }.shuffled().distinctBy { it.cardId }.mapNotNull { verb ->
                    Content.card(verb.cardId)?.let { Question(it, it.nl ?: "", if (verb.kind == "perfect") "Voltooid deelwoord (ik …)" else "Verleden tijd (ik …)", verb.options) }
                }.take(10)
            }
            QuestionGame(questions, finish)
        }
        GameId.aanvullen -> {
            val questions = remember {
                val phrases = themed(Content.games.cloze.filter { !it.cardId.startsWith("zin:") }, 5) { Content.card(it.cardId) }.shuffled().take(6)
                val grammar = Content.games.cloze.filter { it.cardId.startsWith("zin:") }.shuffled().take(10 - phrases.size)
                (phrases + grammar).shuffled().mapNotNull { item -> Content.card(item.cardId)?.let { Question(it, "${item.before}___${item.after}", "Welk woord past in het gat?", item.options) } }
            }
            QuestionGame(questions, finish)
        }
        GameId.zinsbouwer -> {
            val items = remember { themed(Content.games.builder, 5) { Content.card(it.cardId) }.filter { it.answer.size <= 8 }.shuffled().take(8) }
            BuilderGame(items, finish)
        }
        GameId.dictee -> {
            val cards = remember { themed(Content.games.dictation.mapNotNull { Content.card(it) }, 4) { it }.shuffled().take(8) }
            DictationGame(cards, finish)
        }
        GameId.gesprek -> {
            val conversations = remember {
                val all = Content.games.conversations.shuffled()
                // From a situation: only its own conversation. In the Arcade: three.
                val own = all.filter { c -> Content.dialogues.firstOrNull { it.id == c.dialogueId }?.themeId == theme }
                if (own.isEmpty()) all.take(3) else own.take(1)
            }
            ConversationGame(conversations, finish)
        }
    }
}

data class Question(val card: Card, val title: String, val subtitle: String, val options: List<Option>)

@Composable
private fun GameHeader(score: Int, seconds: Int? = null, progress: Double? = null) {
    Row(Modifier.padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.weight(1f)) {
            if (seconds != null) ThickProgress(seconds / 60.0, if (seconds <= 10) C.danger else C.brand, 10.dp)
            else if (progress != null) ThickProgress(progress, C.success, 10.dp)
        }
        if (seconds != null) { Spacer(Modifier.width(10.dp)); T("$seconds", weight = FontWeight.Bold, color = if (seconds <= 10) C.danger else C.text) }
        Spacer(Modifier.width(10.dp))
        Row(Modifier.background(C.butter.copy(alpha = 0.3f), CircleShape).padding(horizontal = 10.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.Check, null, tint = C.text, modifier = Modifier.size(16.dp)); T("$score", weight = FontWeight.Bold)
        }
    }
}

/** A one-minute countdown that ends the game. */
@Composable
private fun countdown(onEnd: () -> Unit): Int {
    var left by remember { mutableIntStateOf(60) }
    LaunchedEffect(Unit) {
        val start = System.currentTimeMillis()
        while (left > 0) { delay(250); left = maxOf(0, 60 - ((System.currentTimeMillis() - start) / 1000).toInt()) }
        onEnd()
    }
    return left
}

@Composable
private fun ArticleGame(items: List<GameArticle>, finish: (GameResult) -> Unit) {
    var index by remember { mutableIntStateOf(0) }
    var score by remember { mutableIntStateOf(0) }
    var picked by remember { mutableStateOf<String?>(null) }
    val misses = remember { mutableStateListOf<Card>() }
    val reasons = remember { mutableMapOf<String, Why>() }
    // The last mistake and its reason stay at the bottom while the clock runs on.
    var lastMiss by remember { mutableStateOf<GameArticle?>(null) }
    val scope = rememberCoroutineScope()
    val left = countdown { finish(GameResult(score, null, misses.toList(), reasons.toMap())) }
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(30.dp)) {
        GameHeader(score, seconds = left)
        Spacer(Modifier.weight(1f))
        if (items.isNotEmpty()) {
            val item = items[index % items.size]
            Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                T("De of het?", weight = FontWeight.SemiBold, color = C.secondary)
                T(if (picked == null) item.noun else "${item.article} ${item.noun}", style = game(if (item.noun.length > 13) 32 else 46, FontWeight.Black), align = TextAlign.Center,
                    color = if (picked == null) C.text else if (picked == item.article) C.success else C.danger)
                Content.card(item.cardId)?.meaning?.let { Persian(it, centered = true) }
            }
            Row(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                listOf("de", "het").forEach { article ->
                    GameButton(article, {
                        if (picked != null) return@GameButton
                        picked = article
                        if (article == item.article) { score += 1; Haptics.success() } else {
                            Haptics.error()
                            Content.card(item.cardId)?.let { misses.add(it); item.why?.let { why -> reasons[it.id] = why } }
                            if (item.why != null) lastMiss = item
                        }
                        scope.launch { delay(if (article == item.article) 350 else 900); picked = null; index += 1 }
                    }, Modifier.weight(1f), color = if (article == "de") C.brand else C.navy, edge = if (article == "de") C.brandEdge else Color(0xFF16294A), height = 110.dp)
                }
            }
        }
        Spacer(Modifier.weight(1f))
        lastMiss?.let { miss -> miss.why?.let { MissStrip("${miss.article} ${miss.noun}", it) } }
    }
}

/** De of het?: the last mistake, the rule and its sentence, small at the bottom so the game goes on. */
@Composable
private fun MissStrip(answer: String, why: Why) {
    Column(
        Modifier.padding(horizontal = 16.dp).padding(bottom = 12.dp).fillMaxWidth().background(C.surface, RoundedCornerShape(18.dp))
            .border(2.dp, C.danger.copy(alpha = 0.25f), RoundedCornerShape(18.dp)).padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            T(answer, weight = FontWeight.Bold, maxLines = 1)
            Box(Modifier.weight(1f).padding(start = 8.dp), contentAlignment = Alignment.CenterEnd) { TagPill(why.tag) }
        }
        WhyText(why.fa, 14)
    }
}

@Composable
private fun RaceGame(cards: List<Card>, finish: (GameResult) -> Unit) {
    var index by remember { mutableIntStateOf(0) }
    var score by remember { mutableIntStateOf(0) }
    var outcome by remember { mutableStateOf<Outcome?>(null) }
    val misses = remember { mutableStateListOf<Card>() }
    val reasons = remember { mutableMapOf<String, Why>() }
    val scope = rememberCoroutineScope()
    val left = countdown { finish(GameResult(score, null, misses.toList(), reasons.toMap())) }
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(24.dp)) {
        GameHeader(score, seconds = left)
        if (cards.isNotEmpty()) {
            val card = cards[index % cards.size]
            key(index) {
                Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                    T(card.nl ?: "", style = game(34, FontWeight.Black))
                    OptionList(card.meaningOptions ?: emptyList(), persian = true, outcome = outcome) { option ->
                        outcome = Outcome(4, option.correct, if (option.correct) Answer.Result.CORRECT else Answer.Result.WRONG)
                        // The clock runs on; the reason of the picked word waits for the end screen.
                        if (option.correct) { score += 1; Haptics.success() } else {
                            misses.add(card); whyFor(card.meaningOptions ?: emptyList(), option)?.let { reasons[card.id] = it }; Haptics.error()
                        }
                        scope.launch { delay(if (option.correct) 300 else 800); outcome = null; index += 1 }
                    }
                }
            }
        }
    }
}

/** A grammar card's translation belongs to its example; show it only when the question is that same sentence. */
private fun sameSentenceTranslation(question: Question): String? {
    val translation = question.card.translation ?: return null
    val example = question.card.example ?: return null
    val answer = question.options.firstOrNull { it.correct }?.label ?: return null
    val sentence = question.title.replace(Regex("\\s*\\([^)]*\\)\\s*$"), "").replace("___", answer)
    return if (Answer.normalize(sentence) == Answer.normalize(example)) translation else null
}

/** A game of questions with a Verder button after each answer. */
@Composable
private fun Stepped(
    total: Int, index: Int, score: Int, answered: Boolean, next: () -> Unit, tone: Tone = Tone.success, why: Why? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        GameHeader(score, progress = if (total == 0) 0.0 else index.toDouble() / total)
        key(index) {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(18.dp), content = content)
        }
        if (answered) key(index) { AnswerFooter(tone, why, next) }
    }
}

@Composable
private fun QuestionGame(questions: List<Question>, finish: (GameResult) -> Unit) {
    var index by remember { mutableIntStateOf(0) }
    var score by remember { mutableIntStateOf(0) }
    var outcome by remember { mutableStateOf<Outcome?>(null) }
    val misses = remember { mutableStateListOf<Card>() }
    val reasons = remember { mutableMapOf<String, Why>() }
    if (questions.isEmpty()) { LaunchedEffect(Unit) { finish(GameResult(0, 1, emptyList())) }; return }
    if (index >= questions.size) return
    val question = questions[index]
    Stepped(questions.size, index, score, outcome != null, {
        outcome = null; index += 1
        if (index >= questions.size) finish(GameResult(score, questions.size, misses.toList(), reasons.toMap()))
    }, outcome?.tone ?: Tone.success, outcome?.why) {
        T(question.subtitle, weight = FontWeight.SemiBold, color = C.secondary)
        T(question.title.replace("___", " ____ "), size = 26.sp, weight = FontWeight.Bold)
        (question.card.meaning ?: sameSentenceTranslation(question))?.let { Persian(it) }
        OptionList(question.options, outcome = outcome) { option ->
            val why = whyFor(question.options, option)
            outcome = Outcome(4, option.correct, if (option.correct) Answer.Result.CORRECT else Answer.Result.WRONG, why = why)
            if (option.correct) { score += 1; Haptics.success() } else { misses.add(question.card); why?.let { reasons[question.card.id] = it }; Haptics.error() }
        }
    }
}

@Composable
private fun BuilderGame(items: List<GameBuilder>, finish: (GameResult) -> Unit) {
    var index by remember { mutableIntStateOf(0) }
    var score by remember { mutableIntStateOf(0) }
    var outcome by remember { mutableStateOf<Outcome?>(null) }
    val misses = remember { mutableStateListOf<Card>() }
    val reasons = remember { mutableMapOf<String, Why>() }
    if (items.isEmpty()) { LaunchedEffect(Unit) { finish(GameResult(0, 1, emptyList())) }; return }
    if (index >= items.size) return
    val item = items[index]
    val card = Content.card(item.cardId)
    Stepped(items.size, index, score, outcome != null, {
        outcome = null; index += 1
        if (index >= items.size) finish(GameResult(score, items.size, misses.toList(), reasons.toMap()))
    }, outcome?.tone ?: Tone.success, outcome?.why) {
        if (card != null) {
            val exercise = card.copy(kind = "phrase", example = item.sentence, translation = card.meaning, mode = "order", order = OrderSpec(item.first, item.tiles, item.answer, item.ending, item.why))
            OrderCard(exercise, outcome) { result ->
                outcome = result
                Audio.play(item.sentence)
                if (result.correct) { score += 1; Haptics.success() } else { misses.add(card); item.why?.let { reasons[card.id] = it }; Haptics.error() }
            }
            if (outcome != null) T(item.sentence, weight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun DictationGame(cards: List<Card>, finish: (GameResult) -> Unit) {
    var index by remember { mutableIntStateOf(0) }
    var score by remember { mutableIntStateOf(0) }
    var value by remember { mutableStateOf("") }
    var outcome by remember { mutableStateOf<Outcome?>(null) }
    val misses = remember { mutableStateListOf<Card>() }
    val reasons = remember { mutableMapOf<String, Why>() }
    if (cards.isEmpty()) { LaunchedEffect(Unit) { finish(GameResult(0, 1, emptyList())) }; return }
    if (index >= cards.size) return
    val card = cards[index]
    LaunchedEffect(index) { delay(300); Audio.play(card.nl ?: "") }
    Stepped(cards.size, index, score, outcome != null, {
        outcome = null; value = ""; index += 1
        if (index >= cards.size) finish(GameResult(score, cards.size, misses.toList(), reasons.toMap()))
    }, outcome?.tone ?: Tone.success, outcome?.why) {
        T("Luister en typ wat je hoort", Modifier.fillMaxWidth(), weight = FontWeight.SemiBold, color = C.secondary, align = TextAlign.Center)
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            PressableTile({ Audio.play(card.nl ?: "") }, Modifier.size(110.dp, 115.dp), fill = C.navy, edge = Color(0xFF16294A), radius = 26.dp) {
                Icon(Icons.AutoMirrored.Filled.VolumeUp, "Luister", tint = Color.White, modifier = Modifier.align(Alignment.Center).size(44.dp))
            }
            T("🐢 Langzamer", Modifier.clickable { Audio.play(card.nl ?: "", 0.75f) }.padding(8.dp), size = 15.sp, color = C.brand, weight = FontWeight.SemiBold)
        }
        AnswerField(value, { value = it }, "Typ wat je hoort", outcome, card.nl) {
            val (result, _) = Answer.check(value, card.nl ?: "")
            val why = if (result != Answer.Result.CORRECT) spellingWhy(value, card.nl ?: "") else null
            outcome = Outcome(4, result != Answer.Result.WRONG, result, why = why)
            if (result != Answer.Result.WRONG) { score += 1; Haptics.success() } else { misses.add(card); why?.let { reasons[card.id] = it }; Haptics.error() }
        }
        if (outcome != null) { T(card.nl ?: "", weight = FontWeight.SemiBold); card.meaning?.let { Persian(it) } }
    }
}

@Composable
private fun ConversationGame(conversations: List<Conversation>, finish: (GameResult) -> Unit) {
    var conversation by remember { mutableIntStateOf(0) }
    var step by remember { mutableIntStateOf(0) }
    var score by remember { mutableIntStateOf(0) }
    var total by remember { mutableIntStateOf(0) }
    var chosen by remember { mutableStateOf<String?>(null) }
    if (conversations.isEmpty()) { LaunchedEffect(Unit) { finish(GameResult(0, 1, emptyList())) }; return }
    if (conversation >= conversations.size) return
    val current = conversations[conversation]
    val dialogue = Content.dialogues.firstOrNull { it.id == current.dialogueId }
    val scroll = rememberScrollState()
    LaunchedEffect(conversation, step) {
        val item = current.steps.getOrNull(step)
        if (item != null && item.options == null) Content.line(item.lineId)?.let { Audio.play(it.nl) }
        scroll.animateScrollTo(scroll.maxValue)
    }
    fun advance() {
        chosen = null
        if (step + 1 < current.steps.size) step += 1 else {
            step = 0; conversation += 1
            if (conversation >= conversations.size) finish(GameResult(score, maxOf(total, 1), emptyList()))
        }
    }
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        GameHeader(score, progress = conversation.toDouble() / conversations.size)
        Column(Modifier.weight(1f).verticalScroll(scroll).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            dialogue?.let { d -> Content.theme(d.themeId)?.let { theme ->
                PictureRow("themes/${theme.id}", theme.title, if (conversations.size > 1) "Gesprek ${conversation + 1} van ${conversations.size} · ${theme.intro}" else theme.intro)
            } }
            current.steps.take(step + 1).forEachIndexed { offset, item ->
                val line = Content.line(item.lineId) ?: return@forEachIndexed
                val options = item.options
                if (options == null || offset < step) Bubble(line)
                else {
                    T("Wat zeg jij?", weight = FontWeight.SemiBold, color = C.secondary)
                    // What you want to say, in Persian: so you know your goal and choose the Dutch sentence that says it.
                    if (line.translation.isNotEmpty()) {
                        Column(Modifier.fillMaxWidth().background(C.butterSoft, RoundedCornerShape(14.dp)).border(1.5.dp, C.butter.copy(alpha = 0.6f), RoundedCornerShape(14.dp)).padding(12.dp), horizontalAlignment = Alignment.End) {
                            T("Je wilt zeggen:", size = 12.sp, weight = FontWeight.Bold, color = C.goldInk)
                            Persian(line.translation, 16, C.text, FontWeight.SemiBold)
                        }
                        T("Kies de Nederlandse zin:", size = 15.sp, weight = FontWeight.SemiBold, color = C.secondary)
                    }
                    options.forEach { option -> ChoiceRow(option, chosen) {
                        chosen = option.lineId; total += 1
                        if (option.correct) { score += 1; Haptics.success() } else Haptics.error()
                        Audio.play(line.nl)
                    } }
                }
            }
        }
        val options = current.steps.getOrNull(step)?.options
        val needsChoice = options != null && chosen == null
        val picked = options?.firstOrNull { it.lineId == chosen }
        if (!needsChoice) key(conversation, step) {
            AnswerFooter(if (picked == null || picked.correct) Tone.success else Tone.wrong, options?.let { whyFor(it, picked) }, ::advance)
        }
    }
}

@Composable
private fun ChoiceRow(option: ConversationChoice, chosen: String?, pick: () -> Unit) {
    val text = Content.line(option.lineId) ?: return
    val fill = when {
        chosen == null -> C.surface
        option.correct -> C.success.copy(alpha = 0.2f)
        chosen == option.lineId -> C.danger.copy(alpha = 0.2f)
        else -> C.surface
    }
    Column(Modifier.fillMaxWidth().background(fill, RoundedCornerShape(14.dp)).clickable(enabled = chosen == null, onClick = pick).padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        T(text.nl)
        if (chosen != null && text.translation.isNotEmpty()) Persian(text.translation, 14)
    }
}

@Composable
private fun Bubble(line: DialogueLine) {
    val mine = line.speaker == "Jij"
    Column(Modifier.fillMaxWidth(), horizontalAlignment = if (mine) Alignment.End else Alignment.Start, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        T(line.speaker, size = 12.sp, weight = FontWeight.SemiBold, color = C.secondary)
        Row(Modifier.fillMaxWidth(0.88f).background(if (mine) C.brand.copy(alpha = 0.15f) else C.surface, RoundedCornerShape(16.dp)).padding(12.dp), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                T(line.nl)
                if (line.translation.isNotEmpty()) Persian(line.translation, 14)
            }
            if (line.hasAudio) ListenButton(line.nl, 13)
        }
    }
}
