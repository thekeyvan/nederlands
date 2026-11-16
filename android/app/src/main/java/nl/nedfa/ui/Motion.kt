package nl.nedfa.ui

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.cos
import kotlin.math.sin
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay

// Motion: the launch splash and the mascot's reactions, the same as ios-native/Nedfa/Views/Motion.swift.
// Only the mascot moves, and only once, at a moment that matters (a right or wrong answer, a combo, a finished round,
// the first visit, a hard question); the rest of the app stays still. With animations turned off in the phone's
// developer or accessibility settings only the pose changes.

/** One short reaction, played once when the mascot appears. */
enum class MascotMoment {
    /** Right answer: crouch, jump, land. */
    Hop,
    /** 3, 5, 10… in a row, and a finished round: two jumps, the second higher. */
    DoubleHop,
    /** Wrong answer: a short head shake. */
    Nope,
    /** First visit: a small hello bounce. */
    Greet,
    /** A card you got wrong before: tilts its head and keeps thinking. */
    Ponder;

    /** One frame: duration in seconds, then squash, stretch, height (as a share of the jump) and tilt. */
    data class Step(val seconds: Double, val scaleX: Float = 1f, val scaleY: Float = 1f, val y: Float = 0f, val angle: Float = 0f)

    /** `y` is in pixels for a jump of height `h`. */
    fun steps(h: Float): List<Step> = when (this) {
        Hop -> listOf(
            Step(0.1, 1.12f, 0.86f),
            Step(0.2, 0.93f, 1.1f, -h, -4f),
            Step(0.18, 1.1f, 0.9f, angle = 2f),
            Step(0.3),
        )
        DoubleHop -> listOf(
            Step(0.09, 1.1f, 0.88f),
            Step(0.16, 0.95f, 1.08f, -h * 0.6f),
            Step(0.15, 1.08f, 0.92f),
            Step(0.18, 0.92f, 1.1f, -h, -8f),
            Step(0.18, 1.12f, 0.88f, angle = 3f),
            Step(0.3),
        )
        Nope -> listOf(
            Step(0.08, y = 2f, angle = -7f),
            Step(0.11, y = 3f, angle = 6f),
            Step(0.11, y = 3f, angle = -4f),
            Step(0.11, y = 2f, angle = 2f),
            Step(0.22),
        )
        Greet -> listOf(
            Step(0.2, y = -h * 0.3f, angle = -3f),
            Step(0.2, 1.04f, 0.96f),
            Step(0.25),
        )
        Ponder -> listOf(
            Step(0.18, angle = -6f),
            Step(0.32, angle = -3f),
        )
    }
}

/** True when the phone has animations turned off (Remove animations, or animator duration 0). */
@Composable
fun reduceMotion(): Boolean {
    val context = LocalContext.current
    return remember {
        runCatching { Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f }.getOrDefault(false)
    }
}

/**
 * The cut-out mascot (only the character moves, never a picture frame), standing on a soft shadow.
 * `moment` plays once when it appears; without one it simply stands still.
 * Poses: idle, cheer, oops, think, wave.
 */
@Composable
fun MascotActor(
    pose: String,
    moment: MascotMoment? = null,
    size: Dp = 120.dp,
    stars: Boolean = false,
    shadow: Boolean = true,
    delayMillis: Long = 0,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val image = remember(pose) { Images.load(context, "illustrations/mascot-cut/$pose.png") }
    val sizePx = with(LocalDensity.current) { size.toPx() }
    val scaleX = remember { Animatable(1f) }
    val scaleY = remember { Animatable(1f) }
    val y = remember { Animatable(0f) }
    val angle = remember { Animatable(0f) }
    var burst by remember { mutableStateOf(false) }
    val still = reduceMotion()

    LaunchedEffect(pose, moment) {
        if (moment == null || still) return@LaunchedEffect
        if (delayMillis > 0) delay(delayMillis)
        val steps = moment.steps(sizePx * 0.3f)
        steps.forEachIndexed { index, step ->
            val last = index == steps.lastIndex
            val millis = (step.seconds * 1000).toInt()
            if (stars && moment == MascotMoment.DoubleHop && index == 3) burst = true
            coroutineScope {
                listOf(scaleX to step.scaleX, scaleY to step.scaleY, y to step.y, angle to step.angle).map { (value, target) ->
                    async {
                        if (last) value.animateTo(target, spring(dampingRatio = 0.55f, stiffness = Spring.StiffnessMediumLow))
                        else value.animateTo(target, tween(millis, easing = FastOutSlowInEasing))
                    }
                }.awaitAll()
            }
        }
    }

    // The shadow shrinks while the mascot is in the air.
    val lift = (-y.value / (sizePx * 0.3f)).coerceIn(0f, 1f)
    Box(modifier.size(size), contentAlignment = Alignment.BottomCenter) {
        if (shadow) {
            // A soft oval: dark in the middle, fading out to the edges.
            val alpha = (if (C.dark) 0.45f else 0.22f) * (1 - 0.5f * lift)
            Canvas(Modifier.offset(y = -size * 0.04f).size(size * 0.6f * (1 - 0.4f * lift), size * 0.1f)) {
                drawOval(
                    Brush.radialGradient(listOf(Color.Black.copy(alpha = alpha), Color.Transparent), center = center, radius = this.size.width / 2),
                    size = this.size,
                )
            }
        }
        if (image != null) {
            // The thinking pose was drawn a little smaller than the others.
            val think = pose == "think"
            Image(
                image, null,
                Modifier.size(size).graphicsLayer {
                    transformOrigin = TransformOrigin(0.5f, 0.92f)
                    this.scaleX = scaleX.value * (if (think) 1.14f else 1f)
                    this.scaleY = scaleY.value * (if (think) 1.14f else 1f)
                    rotationZ = angle.value
                    translationY = y.value + if (think) sizePx * 0.05f else 0f
                },
                contentScale = ContentScale.Fit,
            )
        }
        if (stars && burst) StarBurst(size * 0.6f, Modifier.align(Alignment.Center).offset(y = -size * 0.15f))
    }
}

/** Stars that fly out once and fade. */
@Composable
private fun StarBurst(radius: Dp, modifier: Modifier = Modifier) {
    val progress = remember { Animatable(0f) }
    LaunchedEffect(Unit) { progress.animateTo(1f, tween(850, easing = LinearOutSlowInEasing)) }
    val r = with(LocalDensity.current) { radius.toPx() }
    Box(modifier.requiredSize(radius * 2), contentAlignment = Alignment.Center) {
        repeat(9) { index ->
            val a = index / 9.0 * 2 * Math.PI - Math.PI / 2
            val p = progress.value
            Icon(
                if (index % 2 == 0) Icons.Filled.Star else Icons.Filled.AutoAwesome, null,
                tint = if (index % 3 == 0) C.mint else C.butter,
                modifier = Modifier.size(if (index % 2 == 0) 18.dp else 14.dp).graphicsLayer {
                    translationX = (cos(a) * r * p).toFloat()
                    translationY = (sin(a) * r * p).toFloat()
                    val s = 0.4f + 0.6f * p
                    scaleX = s; scaleY = s
                    alpha = 1f - p
                },
            )
        }
    }
}

/**
 * The launch splash, after the system splash: the cut-out mascot hops, then waves; the name fades in and the splash
 * fades into the app. Only the mascot moves.
 */
@Composable
fun SplashView(done: () -> Unit) {
    val still = reduceMotion()
    var waving by remember { mutableStateOf(false) }
    val name = remember { Animatable(0f) }
    val fade = remember { Animatable(1f) }
    LaunchedEffect(Unit) {
        if (still) {
            name.animateTo(1f, tween(250))
            delay(700)
        } else {
            delay(820)
            Haptics.tap()
            waving = true
            name.animateTo(1f, tween(350))
            delay(1000)
        }
        fade.animateTo(0f, tween(300, easing = FastOutLinearInEasing))
        done()
    }
    Box(Modifier.fillMaxSize().alpha(fade.value).background(if (C.dark) Color(0xFF111A28) else C.cream), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            if (waving) MascotActor("wave", MascotMoment.Greet, 200.dp)
            else MascotActor("idle", MascotMoment.Hop, 200.dp, shadow = false, delayMillis = 120)
            Column(Modifier.alpha(name.value), horizontalAlignment = Alignment.CenterHorizontally) {
                T("Nedfa", style = game(46, FontWeight.Black), color = C.brand)
                T("Nederlands van nul tot B1", size = 15.sp, weight = FontWeight.SemiBold, color = C.secondary)
            }
        }
    }
}
