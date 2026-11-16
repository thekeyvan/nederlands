package nl.nedfa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.material3.Text
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import nl.nedfa.Nav
import nl.nedfa.Screen
import nl.nedfa.Session
import nl.nedfa.TrackScreen
import nl.nedfa.data.Card
import nl.nedfa.data.Content
import nl.nedfa.data.Dialogue
import nl.nedfa.data.Irregular
import nl.nedfa.data.IrregularSet
import nl.nedfa.data.LearningPath
import nl.nedfa.data.Learner
import nl.nedfa.data.Planner
import nl.nedfa.data.Preferences
import nl.nedfa.data.Review
import nl.nedfa.data.SRS
import nl.nedfa.data.Stats
import nl.nedfa.data.Status
import nl.nedfa.data.Theme
import nl.nedfa.data.now

/** A pushed page: a back arrow, the title, and the content. */
@Composable
fun Page(title: String, bottom: (@Composable () -> Unit)? = null, content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().height(52.dp).padding(horizontal = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(48.dp).clip(CircleShape).clickable { Nav.stacks.getValue(Nav.tab).removeLastOrNull() }, contentAlignment = Alignment.Center) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Terug", tint = C.brand)
            }
            T(title, Modifier.weight(1f), style = game(18), maxLines = 1)
            Spacer(Modifier.width(48.dp))
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(16.dp), content = content)
        if (bottom != null) Box(Modifier.fillMaxWidth().background(C.ground).padding(16.dp)) { bottom() }
    }
}



/** Leren: the path of situations (five steps each), and the grammar to look things up. */
@Composable
fun LerenScreen() {
    TrackScreen("Leren")
    var part by rememberSaveable { mutableStateOf(0) }
    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 20.dp).padding(top = 8.dp, bottom = 10.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ScreenTitle("Leren", "${Content.themes.size} situaties · ${Content.grammar.size} regels")
            Segmented(listOf("Pad", "Grammatica"), part) { part = it }
        }
        if (part == 0) PathList() else PatternList()
    }
}

@Composable
fun Segmented(options: List<String>, selected: Int, onSelect: (Int) -> Unit) {
    Row(Modifier.fillMaxWidth().background(C.track, RoundedCornerShape(10.dp)).padding(2.dp)) {
        options.forEachIndexed { index, label ->
            Box(
                Modifier.weight(1f).height(32.dp).background(if (index == selected) C.surface else Color.Transparent, RoundedCornerShape(8.dp)).clickable { onSelect(index) },
                contentAlignment = Alignment.Center,
            ) { T(label, size = 14.sp, weight = if (index == selected) FontWeight.SemiBold else FontWeight.Normal) }
        }
    }
}

/** Leren › Pad: all situations in order, grouped, with where you are. */
@Composable
private fun PathList() {
    val reviews = Learner.reviews
    val events = Learner.events
    val current = remember(reviews, events, Preferences.level) { LearningPath.current(reviews, events, Preferences.level) }
    var query by rememberSaveable { mutableStateOf("") }
    val needle = query.trim().lowercase()
    val sections = remember { LearningPath.sections }
    val steps = remember(reviews) { LearningPath.themes.associate { it.id to LearningPath.steps(it.id, reviews) } }
    val listState = rememberLazyListState()
    val rows = sections.flatMap { (section, themes) ->
        val shown = themes.filter { needle.isEmpty() || "${it.title} ${it.meaning} ${it.intro}".lowercase().contains(needle) }
        if (shown.isEmpty()) emptyList() else listOf<Any>(section) + shown
    }
    LaunchedEffect(Unit) {
        val index = rows.indexOfFirst { it is Theme && it.id == current }
        if (index > 2) listState.scrollToItem(index + 2 - 2)
    }
    LazyColumn(state = listState, modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                T("Elke situatie heeft vijf stappen: woorden, zinnen, de grammatica die je erbij nodig hebt, een gesprek en een eindspel.", size = 15.sp, color = C.secondary)
                SearchField("Zoek bijvoorbeeld huisarts", query, { query = it })
            }
        }
        items(rows, key = { if (it is Theme) it.id else (it as nl.nedfa.data.PathSection).id + ":s" }) { row ->
            if (row is nl.nedfa.data.PathSection) {
                Row(Modifier.padding(horizontal = 24.dp).padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Eyebrow(row.title, modifier = Modifier.weight(1f))
                    T(row.level, Modifier.border(1.dp, C.edge, CircleShape).padding(horizontal = 8.dp, vertical = 2.dp), size = 12.sp, weight = FontWeight.Bold, color = C.secondary)
                }
            } else if (row is Theme) {
                PathNode(row, steps[row.id] ?: emptyList(), row.id == current)
            }
        }
        item { Spacer(Modifier.height(20.dp)) }
    }
}

@Composable
private fun PathNode(theme: Theme, steps: List<LearningPath.Step>, current: Boolean) {
    val complete = steps.isNotEmpty() && steps.all { it.complete }
    val started = steps.any { it.done > 0 }
    PressableTile({ Nav.open(theme) }, Modifier.padding(horizontal = 20.dp).fillMaxWidth(), edge = if (current) C.brandEdge else C.edge, border = if (current) C.brand else null) {
        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Box {
                Art("themes/${theme.id}", 52.dp, 14.dp, modifier = Modifier.alpha(if (started || current) 1f else 0.75f))
                if (complete) Icon(Icons.Filled.CheckCircle, null, tint = C.mint, modifier = Modifier.align(Alignment.BottomEnd).size(20.dp).background(Color.White, CircleShape))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                T(theme.title, style = game(16), maxLines = 1)
                T(theme.meaning, size = 12.sp, color = C.secondary, maxLines = 1)
                StepDots(steps, current)
            }
            when {
                current -> Pill("Hier ben je")
                complete -> T("Klaar", size = 12.sp, weight = FontWeight.Bold, color = C.success)
                started -> LearningPath.next(steps)?.let { T("Stap ${it.number}", size = 12.sp, color = C.secondary) }
            }
            Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
        }
    }
}

private fun stepIcon(id: LearningPath.StepId): ImageVector = when (id) {
    LearningPath.StepId.WOORDEN -> Icons.Filled.Layers
    LearningPath.StepId.ZINNEN -> Icons.AutoMirrored.Filled.Chat
    LearningPath.StepId.GRAMMATICA -> Icons.Filled.Extension
    LearningPath.StepId.GESPREK -> Icons.Filled.Forum
    LearningPath.StepId.EINDSPEL -> Icons.Filled.EmojiEvents
}

/** A situation: its five steps, and everything to read and listen to. */
@Composable
fun ThemeDetailScreen(theme: Theme) {
    TrackScreen("Thema: ${theme.title}")
    val reviews = Learner.reviews
    val stats = remember(reviews) { Stats(reviews, Learner.events).progress(theme.id) }
    var part by rememberSaveable { mutableStateOf(0) }
    var word by remember { mutableStateOf<Card?>(null) }
    var showMeaning by rememberSaveable { mutableStateOf(false) }
    var games by remember { mutableStateOf(false) }
    val steps = LearningPath.steps(theme.id, reviews)
    val next = LearningPath.next(steps)?.id

    Page(theme.title) {
        Row(Modifier.padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
            Art("themes/${theme.id}", 96.dp)
            Spacer(Modifier.width(16.dp))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Persian(theme.meaning, 17, C.text)
                if (stats != null) Row(verticalAlignment = Alignment.CenterVertically) {
                    StarsView(stats.stars, 14.dp); Spacer(Modifier.width(6.dp)); T("${stats.done}/${stats.total}", size = 13.sp, color = C.secondary)
                }
            }
        }
        Group("Vijf stappen") {
            steps.forEachIndexed { index, step ->
                if (index > 0) Divider()
                val active = step.id == next
                Row(Modifier.fillMaxWidth().clickable { Session.start(step.id, theme) }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(44.dp).background(if (step.complete) C.mint else if (active) C.brand else C.surface2, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center,
                    ) { Icon(if (step.complete) Icons.Filled.Check else stepIcon(step.id), null, tint = if (step.complete || active) Color.White else C.secondary) }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            T("${step.number}", size = 12.sp, weight = FontWeight.Bold, color = C.secondary)
                            Spacer(Modifier.width(6.dp))
                            T(step.title, style = game(16))
                            if (active) { Spacer(Modifier.width(6.dp)); Pill("Volgende") }
                        }
                        T(step.detail, size = 12.sp, color = C.secondary, maxLines = 1)
                        if (step.total > 1 && !step.complete && step.done > 0) ThickProgress(step.done.toDouble() / step.total, C.brand, 6.dp)
                    }
                    Icon(Icons.Filled.PlayArrow, null, tint = if (active) C.brand else C.tertiary, modifier = Modifier.size(18.dp))
                }
                if (step.id == LearningPath.StepId.GRAMMATICA && (step.rules.isNotEmpty() || step.irregular != null)) {
                    Row(Modifier.horizontalScroll(rememberScrollState()).padding(start = 56.dp, bottom = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        step.rules.forEach { rule -> Chip(rule.title ?: "") { Nav.push(Screen.PatternDetail(rule.id)) } }
                        step.irregular?.let { set -> Chip("Onregelmatig: ${set.title}", gold = true) { Nav.push(Screen.IrregularSet(set.id)) } }
                    }
                }
            }
            Divider()
            Row(Modifier.fillMaxWidth().clickable { games = true }.padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.SportsEsports, null, tint = C.brand); Spacer(Modifier.width(10.dp))
                T("Meer spellen met deze situatie", size = 15.sp, weight = FontWeight.SemiBold, color = C.brand)
            }
        }
        Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            T("ALLES OM TE LEZEN EN TE LUISTEREN", size = 12.sp, weight = FontWeight.SemiBold, color = C.secondary)
            Segmented(listOf("Woorden", "Zinnen", "Gesprek"), part) { part = it }
        }
        when (part) {
            0 -> {
                val words = Content.words(theme.id)
                Group("${words.size} woorden") {
                    words.forEachIndexed { index, card ->
                        if (index > 0) Divider()
                        Row(Modifier.fillMaxWidth().clickable { word = card }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                            val status = SRS.status(reviews[card.id])
                            Box(Modifier.size(9.dp).background(if (status == Status.KNOWN) C.success else if (status == Status.LEARNING) C.butter else C.track, CircleShape))
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                T(card.nl ?: "", weight = FontWeight.SemiBold)
                                if (card.wordKind == "werkwoord" || card.wordKind == "uitdrukking") T(if (card.wordKind == "werkwoord") "Werkwoord" else "Uitdrukking", size = 12.sp, color = C.secondary)
                            }
                            card.meaning?.let { Box(Modifier.weight(1f)) { Persian(it, 14, C.secondary) } }
                            Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
                        }
                    }
                }
            }
            1 -> Group {
                Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                    T("Toon vertalingen", Modifier.weight(1f))
                    Switch(showMeaning, { showMeaning = it }, colors = SwitchDefaults.colors(checkedTrackColor = C.brand))
                }
                Divider()
                T("Oefen deze zinnen", Modifier.fillMaxWidth().clickable { Session.start(theme.id, Planner.Kind.PRAKTISCH, "${theme.title} · zinnen") }.padding(vertical = 12.dp), color = C.brand, weight = FontWeight.SemiBold)
                Content.phrases(theme.id).forEach { card ->
                    Divider()
                    Column(Modifier.padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(verticalAlignment = Alignment.Top) {
                            T(card.nl ?: "", Modifier.weight(1f), weight = FontWeight.Medium)
                            ListenButton(card.nl ?: "", 14)
                        }
                        if (showMeaning) card.meaning?.let { Persian(it) }
                    }
                }
            }
            else -> Content.dialogue(theme.id)?.let { DialogueView(it) }
        }
    }
    word?.let { WordSheet(it) { word = null } }
    if (games) ThemeGamesSheet(theme) { games = false }
}

@Composable
private fun Chip(text: String, gold: Boolean = false, onClick: () -> Unit) {
    T(
        text, Modifier.background(if (gold) C.butterSoft else C.surface2, CircleShape).clickable(onClick = onClick).padding(horizontal = 10.dp, vertical = 6.dp),
        size = 12.sp, weight = FontWeight.SemiBold, color = if (gold) C.goldInk else C.text, maxLines = 1,
    )
}

@Composable
fun DialogueView(dialogue: Dialogue) {
    var hideMine by rememberSaveable { mutableStateOf(false) }
    var translations by rememberSaveable { mutableStateOf(false) }
    var revealed by remember { mutableStateOf(setOf<String>()) }
    Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) { T("Vertaling", Modifier.weight(1f)); Switch(translations, { translations = it }, colors = SwitchDefaults.colors(checkedTrackColor = C.brand)) }
        Row(verticalAlignment = Alignment.CenterVertically) { T("Verberg mijn zinnen", Modifier.weight(1f)); Switch(hideMine, { hideMine = it }, colors = SwitchDefaults.colors(checkedTrackColor = C.brand)) }
        dialogue.lines.forEach { line ->
            val mine = line.speaker == "Jij"
            Column(Modifier.fillMaxWidth(), horizontalAlignment = if (mine) Alignment.End else Alignment.Start, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                T(line.speaker, size = 12.sp, weight = FontWeight.SemiBold, color = C.secondary)
                if (mine && hideMine && line.id !in revealed) {
                    T("Wat zeg jij? Toon jouw zin", Modifier.border(1.dp, C.brand, RoundedCornerShape(12.dp)).clickable { revealed = revealed + line.id }.padding(horizontal = 12.dp, vertical = 8.dp), color = C.brand, size = 14.sp)
                } else {
                    Row(Modifier.fillMaxWidth(0.88f).background(if (mine) C.brand.copy(alpha = 0.14f) else C.surface, RoundedCornerShape(18.dp)).padding(12.dp)) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            T(line.nl, weight = FontWeight.Medium)
                            if (translations && line.translation.isNotEmpty()) Persian(line.translation)
                        }
                        ListenButton(line.nl, 13)
                    }
                }
            }
        }
    }
}

/** Leren › Grammatica: Onregelmatig, then every sentence pattern. */
@Composable
private fun PatternList() {
    var query by rememberSaveable { mutableStateOf("") }
    val reviews = Learner.reviews
    val needle = query.lowercase()
    val cards = Content.grammar.filter { needle.isEmpty() || "${it.title ?: ""} ${it.pattern ?: ""} ${it.example ?: ""}".lowercase().contains(needle) }
    LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { IrregularBanner() }
        item { SearchField("Zoek bijvoorbeeld omdat", query, { query = it }, Modifier.padding(horizontal = 20.dp)) }
        item {
            Group {
                Row(Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Art("themes/zinsbouw", 72.dp)
                    Spacer(Modifier.width(14.dp))
                    Column {
                        T("Zo valt alles op z’n plek", weight = FontWeight.SemiBold)
                        T("${Content.grammar.size} patronen, elk met zes oefeningen", size = 13.sp, color = C.secondary)
                    }
                }
                Divider()
                Row(Modifier.fillMaxWidth().clickable { Session.start("zinsbouw", Planner.Kind.ZINNEN, "Zinsbouw") }.padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Shuffle, null, tint = C.brand); Spacer(Modifier.width(10.dp)); T("Mix van alle patronen", color = C.brand, weight = FontWeight.SemiBold)
                }
            }
        }
        item {
            Group {
                cards.forEachIndexed { index, card ->
                    if (index > 0) Divider()
                    Row(Modifier.fillMaxWidth().clickable { Nav.push(Screen.PatternDetail(card.id)) }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                        LevelBadge(card.level ?: "")
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            T(card.title ?: "", weight = FontWeight.SemiBold)
                            T(card.pattern ?: "", size = 12.sp, color = C.secondary, maxLines = 1)
                        }
                        if (SRS.status(reviews[card.id]) == Status.KNOWN) Icon(Icons.Filled.Check, null, tint = C.success)
                        Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
                    }
                }
            }
        }
        item { Spacer(Modifier.height(20.dp)) }
    }
}

@Composable
fun LevelBadge(level: String) {
    Box(Modifier.width(34.dp).height(24.dp).background(C.surface2, RoundedCornerShape(6.dp)), contentAlignment = Alignment.Center) { T(level, size = 12.sp, weight = FontWeight.Bold) }
}

@Composable
fun PatternDetailScreen(cardId: String) {
    val card = Content.card(cardId) ?: return
    val pattern = Content.pattern(cardId) ?: return
    TrackScreen("Patroon: ${card.title ?: ""}")
    Page(card.title ?: "", bottom = {
        GameButton("Oefen dit patroon · ${pattern.drill.size}", { Session.start(pattern.drill, card.title ?: "Zinsbouw", drill = true) }, icon = Icons.Filled.Bolt, trailingIcon = false)
    }) {
        Group {
            Row(Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Art("themes/zinsbouw", 64.dp)
                Spacer(Modifier.width(14.dp))
                Column {
                    T(card.level ?: "", size = 12.sp, weight = FontWeight.Bold, color = C.secondary)
                    T(card.title ?: "", style = game(20))
                }
            }
            T(card.pattern ?: "", Modifier.fillMaxWidth().padding(bottom = 10.dp).background(C.surface2, RoundedCornerShape(10.dp)).padding(10.dp),
                style = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = C.text))
        }
        Group("Voorbeelden") {
            pattern.examples.forEachIndexed { index, example ->
                if (index > 0) Divider()
                Column(Modifier.padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.Top) {
                        Text(highlighted(example.nl, example.gap), Modifier.weight(1f), color = C.text, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                        if (example.hasAudio) ListenButton(example.nl, 14)
                    }
                    if (example.translation.isNotEmpty()) Persian(example.translation)
                }
            }
        }
        card.rule?.let { Group("Uitleg") { Box(Modifier.padding(vertical = 8.dp)) { Persian(it, 16, C.text) } } }
        card.note?.let { Group("Let op") { Box(Modifier.padding(vertical = 8.dp)) { Persian(it) } } }
        NeededIn(LearningPath.themesForRule(card.id))
    }
}

private fun highlighted(sentence: String, word: String) = buildAnnotatedString {
    val match = if (word.isEmpty()) null else Regex("\\b${Regex.escape(word)}\\b").find(sentence)
    if (match == null) { append(sentence); return@buildAnnotatedString }
    append(sentence.substring(0, match.range.first))
    withStyle(SpanStyle(color = C.brand, fontWeight = FontWeight.Bold)) { append(match.value) }
    append(sentence.substring(match.range.last + 1))
}

/** "Nodig bij": the situations a grammar rule or Onregelmatig set belongs to. */
@Composable
fun NeededIn(themes: List<Theme>) {
    if (themes.isEmpty()) return
    Group("Nodig bij") {
        themes.forEachIndexed { index, theme ->
            if (index > 0) Divider()
            Row(Modifier.fillMaxWidth().clickable { Nav.open(theme) }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Art("themes/${theme.id}", 36.dp, 10.dp); Spacer(Modifier.width(12.dp)); T(theme.title, Modifier.weight(1f), weight = FontWeight.SemiBold)
                Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
            }
        }
    }
}

// Onregelmatig

@Composable
private fun IrregularBanner() {
    val irregular = Content.irregular
    val reviews = Learner.reviews
    val known = irregular.cards.count { Irregular.known(reviews[it.id]) }
    Row(
        Modifier.padding(horizontal = 20.dp).padding(top = 4.dp).fillMaxWidth().tile(22.dp, C.butterSoft, C.butter).clickable { Nav.push(Screen.IrregularOverview) }.padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        MascotActor("think", size = 72.dp)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            T("Onregelmatig", style = game(20, FontWeight.Black), color = C.goldInk)
            T("Sterke werkwoorden, meervouden en meer: leer ze als rijtje.", size = 15.sp, weight = FontWeight.Medium, color = C.text.copy(alpha = 0.8f))
            T(if (known > 0) "$known van ${irregular.cards.size} vormen gekend" else "${irregular.sets.size} sets · ${irregular.cards.size} vormen", size = 12.sp, weight = FontWeight.Bold, color = C.secondary)
        }
        Icon(Icons.Filled.ChevronRight, null, tint = C.goldInk)
    }
}

@Composable
fun IrregularOverviewScreen() {
    TrackScreen("Onregelmatig")
    val irregular = Content.irregular
    val reviews = Learner.reviews
    val known = irregular.cards.count { Irregular.known(reviews[it.id]) }
    val due = irregular.cards.count { reviews[it.id]?.let { r -> r.due <= now() } ?: false }
    val practised = irregular.cards.any { reviews[it.id] != null }
    val next = irregular.sets.firstOrNull { Irregular.progress(it, reviews).stars < 2 } ?: irregular.sets.firstOrNull()
    Page("Onregelmatig", bottom = {
        if (due > 0) GameButton("Herhaal · ${minOf(due, 10)}", { Session.startIrregular("all", "Onregelmatig") }, icon = Icons.Filled.Replay, trailingIcon = false)
        else if (next != null) GameButton("${if (practised) "Ga verder" else "Begin"}: ${next.title}", { Session.startIrregular(next.id, next.title) }, icon = Icons.Filled.Bolt, trailingIcon = false)
    }) {
        Group {
            Row(Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                MascotActor("think", size = 84.dp)
                Spacer(Modifier.width(14.dp))
                Column {
                    T("Onregelmatig", style = game(26, FontWeight.Black))
                    T("Wat je uit je hoofd leert. Eerst kies je, daarna typ je. Wat je fout had, komt terug.", size = 13.sp, color = C.secondary)
                }
            }
            Divider()
            Column(Modifier.padding(vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row { T("Gekend", Modifier.weight(1f), weight = FontWeight.SemiBold); T("$known / ${irregular.cards.size}", size = 15.sp, color = C.secondary) }
                ThickProgress(known.toDouble() / maxOf(1, irregular.cards.size), C.butter, 12.dp)
                Persian(irregular.intro, 13)
            }
        }
        Group("Sterke werkwoorden") { IrregularRows(irregular.sets.filter { it.group == "werkwoorden" }, reviews) }
        Group("Ook onregelmatig") { IrregularRows(irregular.sets.filter { it.group != "werkwoorden" }, reviews) }
    }
}

@Composable
private fun IrregularRows(sets: List<IrregularSet>, reviews: Map<String, Review>) {
    sets.forEachIndexed { index, set ->
        if (index > 0) Divider()
        val item = Irregular.progress(set, reviews)
        Row(Modifier.fillMaxWidth().clickable { Nav.push(Screen.IrregularSet(set.id)) }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            LevelBadge(set.level)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                T(set.title, weight = FontWeight.SemiBold, maxLines = 1)
                T(set.pattern, size = 12.sp, color = C.secondary, maxLines = 1)
            }
            if (item.done > 0) Column(horizontalAlignment = Alignment.End) {
                StarsView(item.stars)
                T(if (item.due > 0) "${item.due} te herhalen" else "${item.known}/${item.total}", size = 11.sp, color = C.secondary)
            } else T("${item.total} vormen", size = 12.sp, color = C.secondary)
            Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
        }
    }
}

@Composable
fun IrregularSetScreen(setId: String) {
    val set = Content.irregularSet(setId) ?: return
    TrackScreen("Onregelmatig: ${set.title}")
    val reviews = Learner.reviews
    val item = Irregular.progress(set, reviews)
    val cards = Content.irregularCards(set)
    Page(set.title, bottom = {
        GameButton("${if (item.due > 0) "Herhaal" else if (item.done < item.total) "Oefen" else "Nog een keer"} · ${minOf(10, item.total)}", { Session.startIrregular(set.id, set.title) }, icon = Icons.Filled.Bolt, trailingIcon = false)
    }) {
        Group {
            Column(Modifier.padding(vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                T(set.level, size = 12.sp, weight = FontWeight.Bold, color = C.secondary)
                T(set.title, style = game(26, FontWeight.Black))
                T(set.pattern, Modifier.fillMaxWidth().background(C.surface2, RoundedCornerShape(10.dp)).padding(10.dp),
                    style = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = C.text))
                Persian(set.rule, 16, C.text)
            }
            Divider()
            Row(Modifier.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                StarsView(item.stars, 16.dp); Spacer(Modifier.width(8.dp))
                T("${item.known} van ${item.total} gekend", Modifier.weight(1f), size = 15.sp, weight = FontWeight.SemiBold)
                if (item.due > 0) Pill("${item.due} te herhalen", C.goldInk, C.butterSoft)
            }
        }
        Group(when (set.kind) { "verb" -> "Werkwoord · verleden tijd · voltooid (met hij)"; "compare" -> "Woord · meer · meest"; "plural" -> "Eén · meer"; else -> "Zo zeg je het" }) {
            set.rows.forEachIndexed { index, row ->
                if (index > 0) Divider()
                val rowCards = cards.filter { it.title == row.cells[0] && (set.kind != "present" || (it.prompt ?: "").replace("___", it.answer ?: "") == row.cells.getOrNull(1)) }
                val all = rowCards.isNotEmpty() && rowCards.all { Irregular.known(reviews[it.id]) }
                Row(Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.Top) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        T(row.cells.joinToString(" · "), weight = FontWeight.SemiBold)
                        Persian(row.fa, 13)
                    }
                    if (all) Icon(Icons.Filled.Check, "Gekend", tint = C.success)
                }
            }
        }
        NeededIn(LearningPath.themesForIrregular(set.id))
    }
}
