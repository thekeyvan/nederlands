package nl.nedfa.ui

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import nl.nedfa.service.Audio

// Colours: Apple-clean ground and white cards; orange = play, navy = calm, mint = right, gold = XP and stars.
// The same palette as the iPhone app (ios-native/Nedfa/Views/Components.swift).

object C {
    var dark by mutableStateOf(false)
    private fun pick(light: Long, dark: Long) = Color(if (this.dark) dark else light)

    val brand get() = pick(0xFFF07A2A, 0xFFF5893F)
    val brandEdge get() = pick(0xFFC2560F, 0xFF9C440B)
    val navy = Color(0xFF24416A)
    val cream = Color(0xFFFCFAF6)
    val mint get() = pick(0xFF3CC48B, 0xFF34B27D)
    val mintEdge get() = pick(0xFF23935F, 0xFF1D7A4F)
    val butter get() = pick(0xFFFFC53D, 0xFFF5B92E)
    val goldEdge get() = pick(0xFFD9A21E, 0xFFB4841A)
    val goldInk get() = pick(0xFFA06E00, 0xFFFFCF5C)
    val sky get() = pick(0xFF4B8BE0, 0xFF6CA3F0)
    val success get() = pick(0xFF23935F, 0xFF4CD69B)
    val danger get() = pick(0xFFE5624F, 0xFFF07A68)
    val dangerEdge get() = pick(0xFFC24A3D, 0xFF9E3A2F)
    val mintSoft get() = pick(0xFFE4F6EE, 0xFF173528)
    val dangerSoft get() = pick(0xFFFCE9E6, 0xFF3B1F1C)
    val butterSoft get() = pick(0xFFFFF5DC, 0xFF3A3016)
    val ground get() = pick(0xFFEEF0F4, 0xFF0D121C)
    val surface get() = pick(0xFFFFFFFF, 0xFF1B2333)
    val surface2 get() = pick(0xFFF2F3F7, 0xFF242D40)
    val edge get() = pick(0xFFDCE0E8, 0xFF080C14)
    val track get() = pick(0xFFE3E7EE, 0xFF2A3346)
    val text get() = pick(0xFF141B2B, 0xFFF3F5F9)
    val secondary get() = pick(0xFF6B7385, 0xFF9AA3B5)
    val tertiary get() = pick(0xFFB0B6C3, 0xFF5A6377)
}

// Type: heavy, rounded-feeling weights for titles and numbers (the game voice), regular for reading.
fun game(size: Int, weight: FontWeight = FontWeight.ExtraBold) = TextStyle(fontSize = size.sp, fontWeight = weight, lineHeight = (size * 1.2).sp)

object Haptics {
    var view: View? = null
    fun tap() { view?.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK) }
    fun success() { view?.performHapticFeedback(HapticFeedbackConstants.CONFIRM) }
    fun error() { view?.performHapticFeedback(HapticFeedbackConstants.REJECT) }
}

@Composable
fun T(
    text: String, modifier: Modifier = Modifier, style: TextStyle = TextStyle(fontSize = 16.sp), color: Color = C.text,
    weight: FontWeight? = null, size: TextUnit = TextUnit.Unspecified, align: TextAlign? = null, maxLines: Int = Int.MAX_VALUE,
) {
    Text(
        text, modifier, color = color, style = style, fontWeight = weight, fontSize = size, textAlign = align,
        maxLines = maxLines, overflow = if (maxLines == Int.MAX_VALUE) TextOverflow.Clip else TextOverflow.Ellipsis,
    )
}

/** Small caps label above a title, e.g. "DAGRONDJE". */
@Composable
fun Eyebrow(text: String, color: Color = C.secondary, modifier: Modifier = Modifier) {
    T(text.uppercase(), modifier, style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Black, letterSpacing = 0.6.sp), color = color)
}

/** A white card with a soft shadow. */
fun Modifier.card(radius: Dp = 26.dp, padding: Dp = 16.dp) =
    this.shadow(10.dp, RoundedCornerShape(radius), ambientColor = Color.Black.copy(alpha = 0.08f), spotColor = Color.Black.copy(alpha = 0.08f))
        .background(C.surface, RoundedCornerShape(radius))
        .padding(padding)

/** A tactile tile: a surface with a darker rim underneath, like a key. */
fun Modifier.tile(radius: Dp = 22.dp, fill: Color? = null, edge: Color? = null, depth: Dp = 4.dp): Modifier {
    val f = fill ?: C.surface
    val e = edge ?: C.edge
    return this.padding(bottom = depth).drawBehind {
        val r = CornerRadius(radius.toPx())
        drawRoundRect(e, topLeft = Offset(0f, depth.toPx()), size = size, cornerRadius = r)
        drawRoundRect(f, size = size, cornerRadius = r)
    }
}

/** A tile that sinks into its rim when pressed. */
@Composable
fun PressableTile(
    onClick: () -> Unit, modifier: Modifier = Modifier, fill: Color? = null, edge: Color? = null, radius: Dp = 22.dp,
    enabled: Boolean = true, border: Color? = null, content: @Composable BoxScope.() -> Unit,
) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val depth = if (pressed) 1.dp else 5.dp
    val f = fill ?: C.surface
    val e = edge ?: C.edge
    Box(
        modifier
            .padding(bottom = 5.dp)
            .drawBehind {
                val r = CornerRadius(radius.toPx())
                drawRoundRect(e, topLeft = Offset(0f, 5.dp.toPx()), size = size, cornerRadius = r)
                drawRoundRect(f, topLeft = Offset(0f, 5.dp.toPx() - depth.toPx()), size = size, cornerRadius = r)
            }
            .offset(y = 5.dp - depth)
            .then(if (border != null) Modifier.border(2.5.dp, border, RoundedCornerShape(radius)) else Modifier)
            .clip(RoundedCornerShape(radius))
            .clickable(interactionSource = source, indication = null, enabled = enabled) { onClick() },
        content = content,
    )
}

/** The big pressable 3D button used to start rounds and games. */
@Composable
fun GameButton(
    text: String, onClick: () -> Unit, modifier: Modifier = Modifier, icon: ImageVector? = null, color: Color? = null,
    edge: Color? = null, enabled: Boolean = true, height: Dp = 56.dp, trailingIcon: Boolean = true,
) {
    val c = color ?: C.brand
    val e = edge ?: C.brandEdge
    PressableTile(
        { Haptics.tap(); onClick() }, modifier.fillMaxWidth().then(if (enabled) Modifier else Modifier.alphaLow()),
        fill = c, edge = e, radius = 20.dp, enabled = enabled,
    ) {
        Row(Modifier.fillMaxWidth().heightIn(min = height).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
            if (icon != null && !trailingIcon) { Icon(icon, null, tint = Color.White, modifier = Modifier.size(20.dp)); Spacer(Modifier.width(8.dp)) }
            T(text, style = game(19, FontWeight.Black), color = Color.White, align = TextAlign.Center)
            if (icon != null && trailingIcon) { Spacer(Modifier.width(8.dp)); Icon(icon, null, tint = Color.White, modifier = Modifier.size(20.dp)) }
        }
    }
}

fun Modifier.alphaLow() = this.alpha(0.5f)

/** A rounded chip with an icon and a number: the streak flame or XP star. */
@Composable
fun StatChip(icon: ImageVector, value: String, color: Color) {
    Row(
        Modifier.shadow(6.dp, CircleShape, ambientColor = Color.Black.copy(0.1f), spotColor = Color.Black.copy(0.1f)).background(C.surface, CircleShape)
            .height(36.dp).padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = color, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(5.dp))
        T(value, style = game(16), color = color)
    }
}

/** A thick progress bar. */
@Composable
fun ThickProgress(value: Double, color: Color = C.mint, height: Dp = 14.dp, modifier: Modifier = Modifier) {
    val track = C.track
    Canvas(modifier.fillMaxWidth().height(height)) {
        val r = CornerRadius(size.height / 2)
        drawRoundRect(track, cornerRadius = r)
        if (value > 0) {
            val w = maxOf(size.height, size.width * value.coerceIn(0.0, 1.0).toFloat())
            drawRoundRect(color, size = Size(w, size.height), cornerRadius = r)
            drawRoundRect(Color.White.copy(alpha = 0.3f), topLeft = Offset(size.height / 2, size.height * 0.18f), size = Size(maxOf(0f, w - size.height), size.height * 0.3f), cornerRadius = r)
        }
    }
}

/** The level number on a gold coin, with a thin ring that fills towards the next level. */
@Composable
fun LevelRing(number: Int, progress: Double, size: Dp = 46.dp) {
    val butter = C.butter
    Box(Modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(size)) {
            val stroke = 3.5.dp.toPx()
            drawCircle(butter, radius = this.size.minDimension / 2 - 7.dp.toPx())
            drawCircle(butter.copy(alpha = 0.22f), style = Stroke(stroke), radius = this.size.minDimension / 2 - stroke / 2)
            drawArc(butter, -90f, (360 * progress.coerceIn(0.001, 1.0)).toFloat(), false, style = Stroke(stroke, cap = StrokeCap.Round),
                topLeft = Offset(stroke / 2, stroke / 2), size = Size(this.size.width - stroke, this.size.height - stroke))
        }
        T("$number", style = game((size.value * 0.4).toInt(), FontWeight.Black), color = C.navy)
    }
}

@Composable
fun SegmentBar(done: Int, total: Int, on: Color = C.mint, off: Color = Color.White.copy(alpha = 0.18f), modifier: Modifier = Modifier) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        repeat(maxOf(1, total)) { i -> Box(Modifier.weight(1f).height(8.dp).background(if (i < done) on else off, CircleShape)) }
    }
}

// Pictures

object Images {
    private val cache = HashMap<String, ImageBitmap?>()
    fun load(context: android.content.Context, path: String): ImageBitmap? = cache.getOrPut(path) {
        runCatching { context.assets.open(path).use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.ARGB_8888 }) }?.asImageBitmap() }.getOrNull()
    }
}

/** A 3D picture from the bundled illustrations, e.g. "themes/werk", "mascot/cheer", "games/lidwoord". */
@Composable
fun Art(name: String, size: Dp = 48.dp, corner: Dp? = null, grey: Boolean = false, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val image = remember(name) { Images.load(context, "illustrations/$name.jpg") }
    val shape = RoundedCornerShape(corner ?: (size * 0.26f))
    Box(modifier.size(size).clip(shape).background(C.cream), contentAlignment = Alignment.Center) {
        if (image != null) {
            Image(image, null, Modifier.size(size), contentScale = ContentScale.Crop,
                colorFilter = if (grey) ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(0f) }) else null)
        }
    }
}

enum class Mood { wave, cheer, think, sleep }

@Composable
fun Mascot(mood: Mood = Mood.wave, size: Dp = 64.dp) = Art("mascot/${mood.name}", size)


// Text and small controls

/** Persian text: right to left, a little larger and calmer. */
@Composable
fun Persian(text: String, size: Int = 15, color: Color = C.secondary, weight: FontWeight = FontWeight.Normal, centered: Boolean = false, modifier: Modifier = Modifier) {
    Text(
        text, modifier.fillMaxWidth(), color = color,
        style = TextStyle(fontSize = size.sp, fontWeight = weight, textDirection = TextDirection.Rtl, textAlign = if (centered) TextAlign.Center else TextAlign.Right, lineHeight = (size * 1.6).sp),
    )
}

@Composable
fun ListenButton(text: String, size: Int = 18) {
    if (!Audio.has(text)) return
    val playing = Audio.playing == text
    Box(
        Modifier.size((size * 2.3).dp).clip(CircleShape).background(C.sky.copy(alpha = if (playing) 0.26f else 0.14f))
            .clickable { Haptics.tap(); Audio.play(text) },
        contentAlignment = Alignment.Center,
    ) { Icon(Icons.AutoMirrored.Filled.VolumeUp, "Luister", tint = C.sky, modifier = Modifier.size(size.dp)) }
}

@Composable
fun StarsView(count: Int, size: Dp = 12.dp) {
    Row { repeat(3) { i -> Icon(Icons.Filled.Star, null, tint = if (i < count) C.butter else C.track, modifier = Modifier.size(size)) } }
}

@Composable
fun Pill(text: String, color: Color = C.brand, background: Color = color.copy(alpha = 0.15f)) {
    T(text, Modifier.background(background, CircleShape).padding(horizontal = 8.dp, vertical = 3.dp), style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold), color = color)
}

@Composable
fun SectionTitle(title: String, modifier: Modifier = Modifier, trailing: @Composable RowScope.() -> Unit = {}) {
    Row(modifier.fillMaxWidth().padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
        T(title, Modifier.weight(1f), style = game(22, FontWeight.Black))
        trailing()
    }
}

@Composable
fun ScreenTitle(title: String, eyebrow: String, trailing: @Composable RowScope.() -> Unit = {}) {
    Column {
        Eyebrow(eyebrow)
        Row(verticalAlignment = Alignment.CenterVertically) {
            T(title, Modifier.weight(1f), style = game(34, FontWeight.Black))
            trailing()
        }
    }
}

@Composable
fun PictureRow(picture: String, title: String, detail: String? = null, size: Dp = 48.dp, modifier: Modifier = Modifier) {
    Row(modifier.padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
        Art(picture, size)
        Spacer(Modifier.width(14.dp))
        Column {
            T(title, weight = FontWeight.SemiBold, maxLines = 1)
            if (detail != null) T(detail, size = 13.sp, color = C.secondary, maxLines = 1)
        }
    }
}

@Composable
fun SearchField(prompt: String, value: String, onChange: (String) -> Unit, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth().height(44.dp).background(C.surface, RoundedCornerShape(14.dp)).padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Filled.Search, null, tint = C.secondary, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Box(Modifier.weight(1f)) {
            if (value.isEmpty()) T(prompt, color = C.tertiary)
            BasicTextField(value, onChange, singleLine = true, textStyle = TextStyle(fontSize = 16.sp, color = C.text), cursorBrush = SolidColor(C.brand), modifier = Modifier.fillMaxWidth())
        }
        if (value.isNotEmpty()) Icon(Icons.Filled.Cancel, "Wissen", tint = C.tertiary, modifier = Modifier.size(20.dp).clickable { onChange("") })
    }
}

/** A list row inside a card: a divider between rows is drawn by the caller. */
@Composable
fun Divider(modifier: Modifier = Modifier) = Box(modifier.fillMaxWidth().height(1.dp).background(C.track))

/** A grouped list section, like iOS Settings: header, white rounded card, rows. */
@Composable
fun Group(header: String? = null, footer: String? = null, content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
        if (header != null) T(header.uppercase(), Modifier.padding(start = 16.dp, bottom = 6.dp, top = 6.dp), style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.4.sp), color = C.secondary)
        Column(Modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(16.dp)).padding(horizontal = 16.dp, vertical = 4.dp), content = content)
        if (footer != null) T(footer, Modifier.padding(start = 16.dp, top = 6.dp, end = 16.dp), size = 13.sp, color = C.secondary)
    }
}

/** Asks before a big step: a short question, what will happen, and two buttons. The same wording as on the website. */
@Composable
fun Confirm(title: String, message: String, action: String, onConfirm: () -> Unit, onDismiss: () -> Unit, destructive: Boolean = false, cancel: String = "Annuleren") {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = { TextButton({ onDismiss(); onConfirm() }) { Text(action, color = if (destructive) C.danger else C.brand, fontWeight = FontWeight.Bold) } },
        dismissButton = { TextButton(onDismiss) { Text(cancel, color = C.secondary) } },
        containerColor = C.surface, titleContentColor = C.text, textContentColor = C.secondary,
    )
}
