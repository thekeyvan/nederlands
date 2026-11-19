package nl.nedfa.ui

import android.os.SystemClock
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import nl.nedfa.data.DiffPart
import nl.nedfa.data.Why

// "Waarom?": why an answer is right or wrong, the same as src/components/why.tsx on the website.

/** The colour of the panel a reason is shown in. */
enum class Tone { success, close, wrong }

private val boldPart = Regex("\\*\\*(.+?)\\*\\*")

/** Persian with the Dutch in **bold**: only the ** markers go; the isolates keep the Dutch left to right. */
fun whyText(text: String): AnnotatedString = buildAnnotatedString {
    var last = 0
    boldPart.findAll(text).forEach { match ->
        append(text.substring(last, match.range.first))
        withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append(match.groupValues[1]) }
        last = match.range.last + 1
    }
    append(text.substring(last))
}

/** A reason's Persian sentence, in the style of [Persian]. */
@Composable
fun WhyText(text: String, size: Int = 15, color: Color = C.text, modifier: Modifier = Modifier) {
    Text(
        whyText(text), modifier.fillMaxWidth(), color = color,
        style = TextStyle(fontSize = size.sp, textDirection = TextDirection.Rtl, textAlign = TextAlign.Right, lineHeight = (size * 1.6).sp),
    )
}

/** The rule's short Dutch name in a small orange pill. */
@Composable
fun TagPill(tag: String, modifier: Modifier = Modifier) {
    Text(
        tag, modifier.background(C.brand.copy(alpha = 0.15f), CircleShape).padding(horizontal = 8.dp, vertical = 3.dp),
        color = C.brand, style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis,
    )
}

/** "Waarom?" with the rule's name and one or two sentences: a white card inside a feedback panel. */
@Composable
fun WhyCard(why: Why, tone: Tone = Tone.wrong, modifier: Modifier = Modifier) {
    val ink = when (tone) { Tone.success -> C.success; Tone.close -> C.goldInk; Tone.wrong -> C.brand }
    Column(modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(14.dp)).padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Info, null, tint = ink, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            T("Waarom?", size = 12.sp, weight = FontWeight.Bold, color = ink)
            Box(Modifier.weight(1f).padding(start = 8.dp), contentAlignment = Alignment.CenterEnd) {
                if (why.tag.isNotEmpty()) TagPill(why.tag)
            }
        }
        WhyText(why.fa)
    }
}

/** A "Waarom?" pill button; the reason opens below it. */
@Composable
fun WhyButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier.height(44.dp).background(C.surface, CircleShape).border(2.dp, C.success, CircleShape)
            .clickable(role = Role.Button, onClickLabel = "Waarom?") { Haptics.tap(); onClick() }.padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.AutoMirrored.Filled.HelpOutline, null, tint = C.success, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(6.dp))
        T("Waarom?", size = 15.sp, weight = FontWeight.Bold, color = C.success)
    }
}

/**
 * After a right answer that has a reason: "Goed!", a Waarom? button and a thin line that empties in `millis`;
 * then the game goes on by itself. Opening the reason stops the clock; Verder goes on.
 */
@Composable
fun CorrectBar(why: Why, onNext: () -> Unit, millis: Long = 1500) {
    var open by remember { mutableStateOf(false) }
    var done by remember { mutableStateOf(false) }
    val left = remember { mutableFloatStateOf(1f) }
    val next by rememberUpdatedState(onNext)
    fun go() { if (!done) { done = true; next() } }
    // A plain clock rather than an animation, so it also runs when the phone has animations turned off.
    LaunchedEffect(open) {
        if (open) return@LaunchedEffect
        val start = SystemClock.uptimeMillis()
        while (true) {
            val passed = SystemClock.uptimeMillis() - start
            left.floatValue = (1f - passed.toFloat() / millis).coerceIn(0f, 1f)
            if (passed >= millis) break
            delay(16)
        }
        go()
    }
    val green = C.success
    Column(
        Modifier.fillMaxWidth().background(C.mintSoft, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)).padding(horizontal = 20.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            T("Goed!", Modifier.weight(1f), style = game(22, FontWeight.Black), color = green)
            if (!open) WhyButton({ open = true })
        }
        if (!open) {
            Canvas(Modifier.fillMaxWidth().height(4.dp)) {
                val r = CornerRadius(size.height / 2)
                drawRoundRect(green.copy(alpha = 0.2f), cornerRadius = r)
                drawRoundRect(green, size = Size(size.width * left.floatValue, size.height), cornerRadius = r)
            }
        } else {
            WhyCard(why, Tone.success)
            GameButton("Verder", ::go, icon = Icons.AutoMirrored.Filled.ArrowForward, color = C.mint, edge = C.mintEdge)
        }
    }
}

/**
 * What comes after an answer in a game: after a right answer with a reason the bar that goes on by itself;
 * after a mistake with a reason that reason above Verder; otherwise Verder, as before.
 */
@Composable
fun AnswerFooter(tone: Tone, why: Why?, next: () -> Unit) {
    when {
        why != null && tone == Tone.success -> CorrectBar(why, next)
        why != null -> Column(
            Modifier.fillMaxWidth().background(if (tone == Tone.close) C.butterSoft else C.dangerSoft, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            WhyCard(why, tone)
            GameButton("Verder", next, icon = Icons.AutoMirrored.Filled.ArrowForward,
                color = if (tone == Tone.close) C.brand else C.danger, edge = if (tone == Tone.close) C.brandEdge else C.dangerEdge)
        }
        else -> Box(Modifier.padding(16.dp)) { GameButton("Verder", next) }
    }
}

/** What was typed, with the letters that differ from the answer struck through on light red. */
fun diffText(parts: List<DiffPart>, wrongInk: Color, wrongFill: Color): AnnotatedString = buildAnnotatedString {
    parts.forEach { part ->
        if (part.wrong) withStyle(SpanStyle(color = wrongInk, background = wrongFill, textDecoration = TextDecoration.LineThrough)) { append(part.text) }
        else append(part.text)
    }
}

/** The panel colour for an answer. */
val Outcome.tone: Tone get() = when (result) {
    nl.nedfa.data.Answer.Result.CORRECT -> Tone.success
    nl.nedfa.data.Answer.Result.CLOSE -> Tone.close
    nl.nedfa.data.Answer.Result.WRONG -> Tone.wrong
}
