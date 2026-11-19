package nl.nedfa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowCircleRight
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.NumberFormat
import java.util.Locale
import nl.nedfa.Nav
import nl.nedfa.Session
import nl.nedfa.TrackScreen
import nl.nedfa.data.Content
import nl.nedfa.data.LearningPath
import nl.nedfa.data.Learner
import nl.nedfa.data.LevelPlan
import nl.nedfa.data.Planner
import nl.nedfa.data.Preferences
import nl.nedfa.data.Stats
import nl.nedfa.service.Cloud

fun formatNumber(value: Int): String = NumberFormat.getIntegerInstance(Locale("nl", "NL")).format(value)

/** Vandaag: your next step on the path as the one big button, what to repeat, and today's missions. */
@Composable
fun VandaagScreen() {
    TrackScreen("Vandaag")
    val reviews = Learner.reviews
    val events = Learner.events
    val level = Preferences.level
    val stats = remember(reviews, events) { Stats(reviews, events) }
    val current = remember(reviews, events, level) { LearningPath.current(reviews, events, level) }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 30.dp), verticalArrangement = Arrangement.spacedBy(26.dp)) {
        Row(Modifier.padding(horizontal = 20.dp).padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            LevelRing(stats.level.number, stats.level.progress)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Eyebrow("Niveau ${stats.level.number}")
                T(stats.level.name, style = game(17, FontWeight.Black))
            }
            StatChip(Icons.Filled.LocalFireDepartment, "${stats.streak.count}", C.brand)
            Spacer(Modifier.width(8.dp))
            StatChip(Icons.Filled.Star, formatNumber(stats.xp), C.goldInk)
        }
        NextStepCard(current, stats.today, Preferences.goal, Modifier.padding(horizontal = 20.dp))
        RepeatRows(stats)

        if (Cloud.user == null && Cloud.status != Cloud.Status.STARTING) {
            Row(
                Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(22.dp, 12.dp).clickable { Nav.signIn = true },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Mascot(Mood.think, 44.dp)
                Spacer(Modifier.width(12.dp))
                T("Log in en ga ook op de website verder.", Modifier.weight(1f), size = 15.sp, weight = FontWeight.Medium)
                T("Inloggen", size = 15.sp, weight = FontWeight.Bold, color = C.brand)
            }
        }

        if (level == null) {
            PressableTile({ Nav.levelTest = true }, Modifier.padding(horizontal = 20.dp).fillMaxWidth(), fill = C.butterSoft, edge = C.goldEdge.copy(alpha = 0.5f)) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Mascot(Mood.think, 48.dp)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        T("Hoe goed ken je Nederlands al?", style = game(16))
                        T("Doe de niveautest (± 3 min). Dan begint je pad op jouw niveau.", size = 15.sp, color = C.secondary)
                    }
                    Icon(Icons.Filled.ArrowCircleRight, null, tint = C.brand, modifier = Modifier.size(30.dp))
                }
            }
        }
        Missions(stats, current)
        NewsCard(level)
    }
}

/** Vandaag's main card: the next step on your path, one button. */
@Composable
fun NextStepCard(themeId: String, today: Int, goal: Int, modifier: Modifier = Modifier) {
    val theme = Content.theme(themeId) ?: return
    val steps = LearningPath.steps(themeId, Learner.reviews)
    val step = LearningPath.next(steps) ?: steps.lastOrNull()
    Column(modifier.fillMaxWidth().background(C.navy, RoundedCornerShape(28.dp)).padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Eyebrow("Volgende stap", C.butter, Modifier.weight(1f))
            T("Dagdoel ${minOf(today, goal)}/$goal", size = 12.sp, weight = FontWeight.Bold, color = Color.White.copy(alpha = 0.8f))
        }
        Row(Modifier.clickable { Nav.open(theme) }, verticalAlignment = Alignment.CenterVertically) {
            Art("themes/${theme.id}", 72.dp, 18.dp)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                T(theme.title, style = game(22, FontWeight.Black), color = Color.White, maxLines = 2)
                if (step != null) T("Stap ${step.number} van ${steps.size} · ${step.title}", size = 15.sp, weight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.8f))
                StepDots(steps, active = true)
            }
            Icon(Icons.Filled.ChevronRight, null, tint = Color.White.copy(alpha = 0.6f))
        }
        GameButton(if (steps.any { it.done > 0 }) "Ga verder" else "Begin", { step?.let { Session.start(it.id, theme) } }, icon = Icons.AutoMirrored.Filled.ArrowForward)
    }
}

/** Five short bars: done, the next one, still to come. */
@Composable
fun StepDots(steps: List<LearningPath.Step>, active: Boolean = false) {
    val next = if (active || steps.any { it.done > 0 }) LearningPath.next(steps)?.id else null
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        steps.forEach { step ->
            Box(Modifier.width(16.dp).height(6.dp).background(if (step.complete) C.mint else if (step.id == next) C.brand else C.track, RoundedCornerShape(3.dp)))
        }
    }
}

/** What to repeat (due cards from every situation) and your recent mistakes; hidden when there is nothing. */
@Composable
private fun RepeatRows(stats: Stats) {
    val reviews = Learner.reviews
    val mistakes = remember(reviews) {
        Content.cards.filter { c -> reviews[c.id]?.let { it.grade < 3 } ?: false }.sortedByDescending { reviews[it.id]!!.lastReviewed }.take(20)
    }
    if (stats.due == 0 && mistakes.isEmpty()) return
    Column(Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(24.dp, 14.dp)) {
        if (stats.due > 0) RepeatRow("Herhalen", "Wat je bijna vergeet, uit alle situaties", "oefenen/fouten", stats.due) {
            Session.start(Planner.mission("herhaal", Learner.reviews, Learner.events, limit = 20), "Herhalen")
        }
        if (stats.due > 0 && mistakes.isNotEmpty()) Divider(Modifier.padding(start = 56.dp))
        if (mistakes.isNotEmpty()) RepeatRow("Mijn fouten", "Wat je de laatste keer fout had", "oefenen/woorden", mistakes.size) {
            Session.start(mistakes, "Mijn fouten")
        }
    }
}

@Composable
private fun RepeatRow(title: String, detail: String, picture: String, count: Int, start: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = start).padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Art(picture, 44.dp, 12.dp)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            T(title, style = game(16))
            T(detail, size = 12.sp, color = C.secondary)
        }
        T("$count", style = game(17, FontWeight.Black), color = C.brand)
        Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
    }
}

/** Each mission is a button that starts the round that completes it. */
@Composable
private fun Missions(stats: Stats, theme: String) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionTitle("Missies van vandaag")
        Column(Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(26.dp, 14.dp)) {
            stats.missions.forEachIndexed { index, mission ->
                val waiting = mission.id == "herhaal" && Planner.oldCards(Learner.reviews, Learner.events).isEmpty()
                Row(
                    Modifier.fillMaxWidth().alpha(if (waiting) 0.6f else 1f)
                        .clickable(enabled = !waiting) { Session.start(Planner.mission(mission.id, Learner.reviews, Learner.events, theme), mission.title) }
                        .padding(vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Art(mission.picture, 44.dp, 12.dp)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        T(mission.title, size = 15.sp, weight = FontWeight.SemiBold)
                        ThickProgress(mission.count.toDouble() / maxOf(1, mission.target), if (mission.done) C.mint else C.brand, 8.dp)
                    }
                    Spacer(Modifier.width(10.dp))
                    when {
                        mission.done -> Icon(Icons.Filled.CheckCircle, null, tint = C.mint)
                        waiting -> T("vanaf morgen", size = 12.sp, color = C.secondary)
                        else -> T("${minOf(mission.count, mission.target)}/${mission.target}", style = game(15), color = C.secondary)
                    }
                    Spacer(Modifier.width(6.dp))
                    Icon(Icons.Filled.PlayArrow, null, tint = if (mission.done) C.tertiary else C.brand, modifier = Modifier.size(18.dp))
                }
                if (index < stats.missions.lastIndex) Divider()
            }
        }
    }
}

/** Themes for the learner's level (shown after the niveautest). */
@Composable
fun SuggestedThemes(level: String, stats: Stats) {
    Column(Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(24.dp, 14.dp)) {
        LevelPlan.suggested(level, stats).forEachIndexed { index, theme ->
            if (index > 0) Divider()
            Row(Modifier.fillMaxWidth().clickable { Nav.open(theme) }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Art("themes/${theme.id}", 48.dp, 12.dp)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    T(theme.title, style = game(16))
                    T(theme.intro, size = 12.sp, color = C.secondary, maxLines = 1)
                }
                Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
            }
        }
    }
}
