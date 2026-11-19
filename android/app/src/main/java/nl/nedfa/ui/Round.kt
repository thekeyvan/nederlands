package nl.nedfa.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.ceil
import kotlinx.coroutines.delay
import nl.nedfa.RoundData
import nl.nedfa.Session
import nl.nedfa.TrackScreen
import nl.nedfa.data.Answer
import nl.nedfa.data.Card
import nl.nedfa.data.Content
import nl.nedfa.data.Irregular
import nl.nedfa.data.Learner
import nl.nedfa.data.Option
import nl.nedfa.data.DiffPart
import nl.nedfa.data.Why
import nl.nedfa.data.ruleWhy
import nl.nedfa.data.spellingDiff
import nl.nedfa.data.spellingWhy
import nl.nedfa.data.whyFor
import nl.nedfa.data.Planner
import nl.nedfa.data.SRS
import nl.nedfa.data.Stats
import nl.nedfa.data.XP
import nl.nedfa.service.Analytics
import nl.nedfa.service.Audio

/** An answer: its grade, whether it counts as right, and the reason to show ("Waarom?"), if there is one. */
data class Outcome(val grade: Int, val correct: Boolean, val result: Answer.Result, val hint: String? = null, val why: Why? = null)

private data class Result(val cardId: String, val grade: Int, val correct: Boolean)

/** A practice round: one card at a time in the best exercise for it, feedback, then a summary. */
@Composable
fun RoundScreen(round: RoundData) {
    TrackScreen("Rondje: ${round.label}")
    key(round.id) {
        var index by remember { mutableIntStateOf(0) }
        var outcome by remember { mutableStateOf<Outcome?>(null) }
        val results = remember { mutableStateListOf<Result>() }
        var combo by remember { mutableIntStateOf(0) }
        var bestCombo by remember { mutableIntStateOf(0) }
        var confirmQuit by remember { mutableStateOf(false) }
        val before = remember { Stats(Learner.reviews, Learner.events) }
        val close = { Audio.stop(); Session.round = null }

        BackHandler { if (index < round.cards.size && results.isNotEmpty()) confirmQuit = true else close() }

        fun answer(result: Outcome) {
            if (outcome != null || results.size != index) return
            val card = round.cards[index]
            // A pattern round asks about one pattern several times; only its first answer goes into the schedule.
            if (!round.drill || results.none { it.cardId == card.id }) Learner.review(card.id, result.grade)
            results.add(Result(card.id, result.grade, result.correct))
            combo = if (result.correct) combo + 1 else 0
            bestCombo = maxOf(bestCombo, combo)
            if (result.correct) Haptics.success() else Haptics.error()
            if (card.mode == null && result.correct && !card.isGrammar) card.nl?.let { Audio.play(it) }
            outcome = result
        }

        Box(Modifier.fillMaxSize().background(C.ground)) {
            if (index < round.cards.size) {
                val card = round.cards[index]
                Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding()) {
                    Row(Modifier.padding(horizontal = 20.dp).padding(top = 8.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                        PressableTile({ if (results.isEmpty()) close() else confirmQuit = true }, Modifier.size(40.dp, 45.dp), radius = 20.dp) {
                            Icon(Icons.Filled.Close, "Stoppen met oefenen", tint = C.secondary, modifier = Modifier.align(Alignment.Center).size(20.dp))
                        }
                        Spacer(Modifier.width(14.dp))
                        ThickProgress(results.size.toDouble() / maxOf(1, round.cards.size), C.mint, 16.dp, Modifier.weight(1f))
                        Spacer(Modifier.width(14.dp))
                        // Right answers in a row: a bolt, so it is not mistaken for the daily streak (the flame).
                        val comboColor = if (combo >= 2) C.brand else C.secondary.copy(alpha = 0.5f)
                        Icon(Icons.Filled.Bolt, null, tint = comboColor, modifier = Modifier.size(20.dp))
                        T("$combo", style = game(17, FontWeight.Black), color = comboColor)
                    }
                    key(index) {
                        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(top = 12.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                            CardRunner(card, index, outcome) { answer(it) }
                        }
                    }
                    outcome?.let { FeedbackPanel(card, it, combo) { outcome = null; index += 1 } }
                }
            } else {
                RoundSummary(round, results, bestCombo, before, again = {
                    val next = round.irregular?.let { Irregular.round(it, Learner.reviews) } ?: if (round.drill) round.cards else Planner.plan(Learner.reviews)
                    Session.round = RoundData(cards = next.ifEmpty { round.cards }, label = round.label, drill = round.drill, irregular = round.irregular)
                }, done = close)
            }
            if (confirmQuit) Confirm(
                "Stoppen met dit rondje?", "Wat je al hebt beantwoord, is bewaard. De andere kaartjes komen later terug.",
                "Stoppen", close, { confirmQuit = false }, destructive = true, cancel = "Doorgaan",
            )
        }
    }
}

/** Picks the exercise for a card and shows it. */
@Composable
private fun CardRunner(card: Card, position: Int, outcome: Outcome?, answer: (Outcome) -> Unit) {
    val mode = remember(card.id, position) { Planner.mode(card, Learner.reviews[card.id], position) }
    when (mode) {
        "choose" -> ChooseCard(card, false, outcome, answer)
        "reverse" -> ChooseCard(card, true, outcome, answer)
        "listen" -> ListenCard(card, outcome, answer)
        "type" -> TypeCard(card, outcome, answer)
        "gap" -> GapCard(card, outcome, answer)
        "order" -> OrderCard(card, outcome, answer)
        "pick" -> {
            T("Welke zin is goed?", style = game(17, FontWeight.Bold), color = C.secondary)
            card.translation?.let { Persian(it, 19, C.text) }
            OptionList(card.pick ?: emptyList(), outcome = outcome) { answer(choice(it, card.pick ?: emptyList())) }
        }
        "form" -> FormCard(card, outcome, answer)
        else -> FlashCard(card, answer)
    }
}

private fun choice(option: Option, options: List<Option>) =
    Outcome(if (option.correct) 4 else 1, option.correct, if (option.correct) Answer.Result.CORRECT else Answer.Result.WRONG, why = whyFor(options, option))

/** Answer buttons; after a pick the right one turns green. */
@Composable
fun OptionList(options: List<Option>, persian: Boolean = false, outcome: Outcome?, pick: (Option) -> Unit) {
    var chosen by remember(options) { mutableStateOf<String?>(null) }
    val grid = options.size == 4 && options.all { it.label.length <= 20 }
    val rows = if (grid) options.chunked(2) else options.map { listOf(it) }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        rows.forEach { row ->
            Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                row.forEach { option ->
                    val right = outcome != null && option.correct
                    val wrong = outcome != null && option.label == chosen && !option.correct
                    PressableTile(
                        { if (outcome == null) { chosen = option.label; Haptics.tap(); pick(option) } },
                        Modifier.weight(1f).fillMaxHeight().alpha(if (outcome != null && !right && !wrong) 0.45f else 1f),
                        fill = if (right) C.mintSoft else if (wrong) C.dangerSoft else C.surface,
                        edge = if (right) C.mintEdge else if (wrong) C.dangerEdge else C.edge,
                        border = if (right) C.mint else if (wrong) C.danger else null,
                        enabled = outcome == null,
                    ) {
                        Box(Modifier.fillMaxWidth().heightIn(min = if (grid) 84.dp else 58.dp).padding(horizontal = 16.dp, vertical = 10.dp), contentAlignment = if (grid || persian) Alignment.Center else Alignment.CenterStart) {
                            Text(
                                option.label,
                                color = if (right) C.success else if (wrong) C.danger else C.text,
                                style = if (persian) TextStyle(fontSize = if (grid) 20.sp else 18.sp, fontWeight = FontWeight.SemiBold, textDirection = TextDirection.Rtl, textAlign = TextAlign.Center)
                                else game(if (grid) 19 else 17, FontWeight.Bold).copy(textAlign = if (grid) TextAlign.Center else TextAlign.Start),
                            )
                        }
                    }
                }
            }
        }
    }
}

/** The mascot asks from just above the bubble; the word or sentence gets the full width. */
@Composable
private fun PromptBubble(hard: Boolean = false, content: @Composable () -> Unit) {
    Column {
        // A card the learner got wrong last time: the mascot tilts its head and thinks.
        MascotActor("think", if (hard) MascotMoment.Ponder else null, 60.dp, shadow = false, delayMillis = 250, modifier = Modifier.padding(start = 10.dp).offset(y = 6.dp))
        Box(Modifier.fillMaxWidth().tile(22.dp).padding(16.dp)) { content() }
    }
}

@Composable
private fun ChooseCard(card: Card, dutch: Boolean, outcome: Outcome?, answer: (Outcome) -> Unit) {
    Eyebrow(if (dutch) "Hoe zeg je dit in het Nederlands?" else "Wat betekent dit?")
    PromptBubble(hard = (Learner.reviews[card.id]?.grade ?: 5) < 3) {
        if (dutch) Persian(card.meaning ?: "", 26, C.text, FontWeight.Bold)
        else Row(verticalAlignment = Alignment.CenterVertically) {
            T(card.nl ?: "", Modifier.weight(1f), style = game(28, FontWeight.Black), maxLines = 2)
            ListenButton(card.nl ?: "", 18)
        }
    }
    val options = (if (dutch) card.dutchOptions else card.meaningOptions) ?: emptyList()
    OptionList(options, persian = !dutch, outcome = outcome) { answer(choice(it, options)) }
}

@Composable
private fun SpeakerButtons(text: String) {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        PressableTile({ Audio.play(text) }, Modifier.size(120.dp, 125.dp), fill = C.navy, edge = Color(0xFF16294A), radius = 28.dp) {
            Icon(Icons.AutoMirrored.Filled.VolumeUp, "Luister", tint = Color.White, modifier = Modifier.align(Alignment.Center).size(48.dp))
        }
        T("🐢 Langzamer", Modifier.clickable { Audio.play(text, 0.75f) }.padding(8.dp), size = 15.sp, color = C.brand, weight = FontWeight.SemiBold)
    }
}

@Composable
private fun ListenCard(card: Card, outcome: Outcome?, answer: (Outcome) -> Unit) {
    T("Wat hoor je?", Modifier.fillMaxWidth(), style = game(17, FontWeight.Bold), color = C.secondary, align = TextAlign.Center)
    SpeakerButtons(card.nl ?: "")
    LaunchedEffect(card.id) { delay(300); Audio.play(card.nl ?: "") }
    OptionList(card.dutchOptions ?: emptyList(), outcome = outcome) { answer(choice(it, card.dutchOptions ?: emptyList())) }
}

@Composable
fun AnswerField(value: String, onChange: (String) -> Unit, placeholder: String, outcome: Outcome?, expected: String? = null, submit: () -> Unit) {
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { runCatching { focus.requestFocus() } }
    val border = when (outcome?.result) { Answer.Result.WRONG -> C.danger; Answer.Result.CLOSE -> C.butter; Answer.Result.CORRECT -> C.success; null -> Color.Transparent }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(14.dp)).border(2.dp, border, RoundedCornerShape(14.dp)).padding(14.dp)) {
            if (value.isEmpty()) T(placeholder, size = 20.sp, color = C.tertiary)
            // After a wrong or nearly right answer: what was typed, with the letters that differ struck through.
            val diff = if (expected != null && outcome != null && outcome.result != Answer.Result.CORRECT && value.isNotBlank()) typedDiff(value, expected) else null
            if (diff != null) Text(diffText(diff, C.danger, C.danger.copy(alpha = 0.16f)), style = TextStyle(fontSize = 20.sp, color = C.text))
            else BasicTextField(
                value, { if (outcome == null) onChange(it) }, Modifier.fillMaxWidth().focusRequester(focus), enabled = outcome == null, singleLine = true,
                textStyle = TextStyle(fontSize = 20.sp, color = C.text), cursorBrush = SolidColor(C.brand),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.None, autoCorrectEnabled = false, keyboardType = KeyboardType.Text, imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { if (value.isNotBlank()) submit() }),
            )
        }
        if (outcome == null) GameButton("Controleer", submit, enabled = value.isNotBlank())
    }
}

@Composable
private fun TypeCard(card: Card, outcome: Outcome?, answer: (Outcome) -> Unit) {
    var value by remember { mutableStateOf("") }
    var hinted by remember { mutableStateOf(false) }
    fun check() {
        val (result, why) = Answer.check(value, card.nl ?: "")
        val reason = if (result != Answer.Result.CORRECT) spellingWhy(value, card.nl ?: "") else null
        answer(Outcome(Answer.grade(result, hinted), result != Answer.Result.WRONG, result, why, reason))
    }
    T("Typ het Nederlandse woord", style = game(17, FontWeight.Bold), color = C.secondary)
    Persian(card.meaning ?: "", 30, C.text, FontWeight.Bold)
    AnswerField(value, { value = it }, "Typ hier…", outcome, card.nl, ::check)
    if (outcome == null) Row(verticalAlignment = Alignment.CenterVertically) {
        if (hinted) T("Begint met ${hint(card.nl ?: "")}", Modifier.weight(1f), size = 15.sp, color = C.secondary)
        else Row(Modifier.weight(1f).clickable { hinted = true }, verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Filled.Lightbulb, null, tint = C.brand); T("Hint", size = 15.sp, color = C.brand) }
        T("Ik weet het niet", Modifier.clickable { answer(Outcome(1, false, Answer.Result.WRONG)) }, size = 15.sp, color = C.secondary)
    }
}

private fun hint(text: String) = text.split(" ").joinToString(" ") { word ->
    if (word.lowercase() in listOf("de", "het", "een")) word else word.take(maxOf(1, ceil(word.length / 3.0).toInt())) + "…"
}

@Composable
private fun Gap(parts: List<String>, shown: String, color: Color) {
    Text(buildAnnotatedString {
        append(parts.firstOrNull() ?: "")
        withStyle(SpanStyle(color = color, textDecoration = TextDecoration.Underline)) { append(if (shown.isEmpty()) " … " else " $shown ") }
        append(parts.getOrNull(1) ?: "")
    }, style = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, color = C.text, lineHeight = 30.sp))
}

@Composable
private fun GapCard(card: Card, outcome: Outcome?, answer: (Outcome) -> Unit) {
    var value by remember { mutableStateOf("") }
    var hinted by remember { mutableStateOf(false) }
    fun check() {
        val (result, why) = Answer.check(value, card.answer ?: "")
        answer(Outcome(Answer.grade(result, hinted), result != Answer.Result.WRONG, result, why, ruleWhy(card)))
    }
    T("Vul het ontbrekende woord in.", style = game(17, FontWeight.Bold), color = C.secondary)
    Column(Modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(18.dp)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        T((card.title ?: "").uppercase(), size = 12.sp, weight = FontWeight.SemiBold, color = C.secondary)
        Gap((card.prompt ?: "").split("___"), value, outcome?.let { if (it.result == Answer.Result.WRONG) C.danger else C.success } ?: C.brand)
    }
    AnswerField(value, { value = it }, "Het ontbrekende woord", outcome, submit = ::check)
    if (outcome == null) {
        if (hinted && card.rule != null) Persian(card.rule)
        else Row(Modifier.clickable { hinted = true }, verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Filled.Lightbulb, null, tint = C.brand); T("Toon de regel", size = 15.sp, color = C.brand) }
    }
}

/** Onregelmatig: one cell of a row, or a present-tense form in a sentence. Chosen first, typed after two good answers. */
@Composable
private fun FormCard(card: Card, outcome: Outcome?, answer: (Outcome) -> Unit) {
    val review = remember(card.id) { Learner.reviews[card.id] }
    val typed = remember(card.id) { Irregular.typed(review) }
    var value by remember { mutableStateOf("") }
    var chosen by remember { mutableStateOf<String?>(null) }
    var hinted by remember { mutableStateOf(false) }
    val shown = if (typed) value else chosen ?: ""
    val gapColor = outcome?.let { if (it.result == Answer.Result.WRONG) C.danger else C.success } ?: C.brand
    // Typed, there is no option to explain: the reason of the right choice, else the set's rule.
    val typedWhy = (card.choices?.firstOrNull { it.correct }?.why) ?: ruleWhy(card)

    Eyebrow(if (typed) "Typ de goede vorm" else "Kies de goede vorm")
    Row(verticalAlignment = Alignment.CenterVertically) {
        MascotActor("think", if ((review?.grade ?: 5) < 3) MascotMoment.Ponder else null, 84.dp, delayMillis = 250)
        Spacer(Modifier.width(12.dp))
        Column {
            T(card.title ?: "", style = game(30, FontWeight.Black), maxLines = 1)
            T(card.meaning ?: "", size = 15.sp, color = C.secondary)
        }
    }
    val chain = card.chain
    if (chain != null) {
        Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            chain.forEachIndexed { index, text ->
                val asked = index == card.ask
                val later = index > (card.ask ?: 0)
                val label = (card.labels?.getOrNull(index) ?: "") + if (index > 0 && Irregular.isVerb(card)) " · hij" else ""
                val fill = if (asked) outcome?.let { if (it.result == Answer.Result.WRONG) C.dangerSoft else C.mintSoft } ?: C.surface else C.surface
                val stroke = if (asked) outcome?.let { if (it.result == Answer.Result.WRONG) C.danger else C.mint } ?: C.brand else C.edge
                Column(
                    Modifier.weight(1f).fillMaxHeight().heightIn(min = 92.dp).alpha(if (later) 0.5f else 1f)
                        .background(fill, RoundedCornerShape(16.dp)).border(2.dp, stroke, RoundedCornerShape(16.dp)).padding(10.dp),
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    T(label, size = 11.sp, weight = FontWeight.Bold, color = C.secondary, maxLines = 2)
                    T(if (asked) shown.ifEmpty { "?" } else if (later) "…" else text, style = game(18, FontWeight.Black), color = if (asked && outcome == null) C.brand else C.text, maxLines = 2)
                }
            }
        }
    } else {
        Box(Modifier.fillMaxWidth().tile(22.dp).padding(18.dp)) { Gap((card.prompt ?: "").split("___"), shown, gapColor) }
    }
    if (typed) {
        AnswerField(value, { value = it }, if (card.ask == 2 && Irregular.isVerb(card)) "heeft of is + deelwoord" else "Typ hier…", outcome) {
            val (result, why) = Irregular.check(value, card)
            answer(Outcome(Answer.grade(result, hinted), result != Answer.Result.WRONG, result, why, typedWhy))
        }
        if (outcome == null) Row(verticalAlignment = Alignment.CenterVertically) {
            if (hinted && card.rule != null) Box(Modifier.weight(1f)) { Persian(card.rule) }
            else Row(Modifier.weight(1f).clickable { hinted = true }, verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Filled.Lightbulb, null, tint = C.brand); T("Toon de regel", size = 15.sp, color = C.brand) }
            T("Ik weet het niet", Modifier.clickable { answer(Outcome(1, false, Answer.Result.WRONG, why = typedWhy)) }, size = 15.sp, color = C.secondary)
        }
    } else {
        OptionList(card.choices ?: emptyList(), outcome = outcome) { chosen = it.label; answer(choice(it, card.choices ?: emptyList())) }
    }
}

@Composable
private fun FlashCard(card: Card, answer: (Outcome) -> Unit) {
    var revealed by remember { mutableStateOf(false) }
    val grammar = card.isGrammar
    T(if (grammar) "Maak de zin af" else "Weet je het nog?", style = game(17, FontWeight.Bold), color = C.secondary)
    Column(Modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(24.dp)).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        T(if (grammar) card.prompt ?: "" else card.nl ?: "", size = 22.sp, weight = FontWeight.Bold, align = TextAlign.Center)
        if (revealed) {
            Divider()
            if (grammar) {
                T(card.answer ?: "", size = 20.sp, weight = FontWeight.Bold, color = C.brand)
                T(card.example ?: "", align = TextAlign.Center)
                card.translation?.let { Persian(it, centered = true) }
            } else {
                Persian(card.meaning ?: "", 20, C.text, centered = true)
                card.example?.let { T(it, color = C.secondary, align = TextAlign.Center) }
                ListenButton(card.example ?: card.nl ?: "")
            }
        }
    }
    if (!revealed) GameButton("Bekijk het antwoord", { revealed = true })
    else Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SRS.ratings.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                row.forEach { (grade, label) ->
                    Column(
                        Modifier.weight(1f).heightIn(min = 60.dp).background(C.surface, RoundedCornerShape(14.dp))
                            .clickable { answer(Outcome(grade, grade >= 3, if (grade >= 3) Answer.Result.CORRECT else Answer.Result.WRONG)) }.padding(8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
                    ) {
                        T(label, weight = FontWeight.SemiBold)
                        T("over ${SRS.schedule(Learner.reviews[card.id], grade).interval} dag(en)", size = 12.sp, color = C.secondary)
                    }
                }
            }
        }
    }
}

/** The answer panel at the bottom: the mascot reacts, the right answer, the example, and Verder. */
@Composable
private fun FeedbackPanel(card: Card, outcome: Outcome, combo: Int, next: () -> Unit) {
    val good = outcome.result == Answer.Result.CORRECT
    val close = outcome.result == Answer.Result.CLOSE
    val ink = if (good) C.success else if (close) C.goldInk else C.danger
    val form = card.mode == "form"
    val whole = card.mode != null && !form
    val answerText = if (form) card.note else if (whole) card.example else if (card.isGrammar) card.answer else card.nl
    var explained by remember { mutableStateOf(false) }
    Column(
        Modifier.fillMaxWidth().background(if (good) C.mintSoft else if (close) C.butterSoft else C.dangerSoft, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
            .verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Right answers in a row, including this one; 3, 5, 10… get a double jump.
            MascotActor(
                if (good || close) "cheer" else "oops",
                if (!good && !close) MascotMoment.Nope else if (combo in listOf(3, 5, 10, 15, 20, 30)) MascotMoment.DoubleHop else MascotMoment.Hop,
                64.dp,
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                T(
                    if (good) "Top!" else if (close) when (outcome.hint) { "article" -> "Bijna! Let op de of het."; "aux" -> "Bijna! Met hebben of zijn:"; else -> "Bijna! Kleine typfout." } else "Nog niet. Dit is het:",
                    style = game(22, FontWeight.Black), color = ink,
                )
                answerText?.let { T(it, weight = FontWeight.SemiBold) }
            }
            T("+${XP.forGrade(outcome.grade)} XP", style = game(16, FontWeight.Black), color = C.goldInk)
        }
        if (form) {
            if (card.chain != null) card.meaning?.let { Persian(it, 13) }
            if (outcome.result != Answer.Result.CORRECT) card.rule?.takeIf { it != outcome.why?.fa }?.let { Persian(it, 13) }
        } else if (!card.isGrammar) {
            card.meaning?.let { Persian(it, 15, C.text) }
        }
        if (!form && !card.isGrammar && card.example != null) Row(verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                T(card.example, size = 15.sp)
                card.translation?.let { Persian(it, 13) }
            }
            ListenButton(card.example, 13)
        }
        if (card.isGrammar) (if (whole) card.translation else card.rule)?.takeIf { it != outcome.why?.fa }?.let { Persian(it, 13) }
        // Waarom?: after a mistake straight away; after a right answer behind a button, so the round keeps its pace.
        outcome.why?.let { why ->
            if (!good) WhyCard(why, if (close) Tone.close else Tone.wrong)
            else if (explained) WhyCard(why, Tone.success)
            else WhyButton({ explained = true })
        }
        GameButton("Verder", next, icon = Icons.AutoMirrored.Filled.ArrowForward,
            color = if (good) C.mint else if (close) C.brand else C.danger, edge = if (good) C.mintEdge else if (close) C.brandEdge else C.dangerEdge)
    }
}

/** The end of a round: stars, XP, right answers, streak, new stamps. */
@Composable
private fun RoundSummary(round: RoundData, results: List<Result>, bestCombo: Int, before: Stats, again: () -> Unit, done: () -> Unit) {
    val stats = remember { Stats(Learner.reviews, Learner.events) }
    val right = results.count { it.correct }
    val xp = results.sumOf { XP.forGrade(it.grade) }
    val newStamps = Content.stamps.filter { it.id in stats.earned && it.id !in before.earned }
    LaunchedEffect(Unit) {
        if (results.isNotEmpty()) {
            Haptics.success()
            Analytics.event("ronde klaar", mapOf("soort" to if (round.drill) "patroon" else "mix", "kaartjes" to results.size, "goed" to right))
        }
    }
    val share = if (results.isEmpty()) 0.0 else right.toDouble() / results.size
    val starCount = if (results.isEmpty()) 0 else if (share >= 0.9) 3 else if (share >= 0.6) 2 else 1
    Column(
        Modifier.fillMaxSize().background(C.navy).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        if (results.isNotEmpty()) Row(Modifier.padding(top = 30.dp), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(3) { star ->
                Icon(Icons.Filled.Star, null, tint = if (star < starCount) C.butter else Color.White.copy(alpha = 0.18f),
                    modifier = Modifier.size(if (star == 1) 64.dp else 46.dp).rotate(if (star == 0) -12f else if (star == 2) 12f else 0f))
            }
        }
        if (results.isEmpty()) Mascot(Mood.sleep, 170.dp) else MascotActor("cheer", MascotMoment.DoubleHop, 190.dp, stars = true, delayMillis = 200)
        T(if (results.isEmpty()) "Je bent weer bij." else "Rondje klaar!", style = game(34, FontWeight.Black), color = Color.White)
        if (results.isNotEmpty()) {
            T(
                if (right == results.size) "Alles goed. Wat knap!" else if (right * 2 >= results.size) "Lekker bezig. De moeilijke komen snel terug." else "Goed geoefend. Morgen gaat het al makkelijker.",
                color = Color.White.copy(alpha = 0.75f), align = TextAlign.Center,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SummaryTile("XP", "+$xp", C.goldInk, C.goldEdge, Modifier.weight(1f))
                SummaryTile("Goed", "$right/${results.size}", C.success, C.mintEdge, Modifier.weight(1f))
                SummaryTile("Reeks", "${stats.streak.count}", C.brand, C.brandEdge, Modifier.weight(1f))
            }
            if (bestCombo >= 3) Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Bolt, null, tint = Color.White); T("Beste combo: $bestCombo goed op rij", size = 15.sp, weight = FontWeight.SemiBold, color = Color.White)
            }
            if (stats.level.number > before.level.number) Row(Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(22.dp)).padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                LevelRing(stats.level.number, stats.level.progress)
                Spacer(Modifier.width(12.dp))
                Column { Eyebrow("Nieuw niveau", C.butter); T(stats.level.name, style = game(18, FontWeight.Black), color = Color.White) }
            }
            newStamps.forEach { stamp ->
                Row(Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(22.dp)).padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Art("stamps/${stamp.id}", 58.dp)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Eyebrow("Nieuwe stempel", C.butter)
                        T(stamp.title, style = game(18, FontWeight.Black), color = Color.White)
                        T(stamp.description, size = 13.sp, color = Color.White.copy(alpha = 0.7f))
                    }
                }
            }
        }
        GameButton("Verder", done, Modifier.padding(top = 8.dp))
        T("Nog een rondje", Modifier.clickable(onClick = again).padding(12.dp), weight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.85f))
    }
}

@Composable
private fun SummaryTile(label: String, value: String, ink: Color, edge: Color, modifier: Modifier) {
    Column(modifier.tile(20.dp, Color.White, edge, 5.dp).padding(vertical = 12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        T(label.uppercase(), style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 0.6.sp), color = ink)
        T(value, style = game(24, FontWeight.Black), color = Color(0xFF141B2B))
    }
}

/** What was typed against the answer; a full stop or question mark the learner left off does not count as a difference. */
fun typedDiff(typed: String, answer: String): List<DiffPart> {
    val given = typed.trim()
    val target = if (given.lastOrNull()?.let { it in ".!?…" } == true) answer.trim() else answer.trim().trimEnd('.', '!', '?', '…')
    return spellingDiff(given, target)
}
