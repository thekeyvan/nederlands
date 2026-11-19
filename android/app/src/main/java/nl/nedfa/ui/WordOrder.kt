package nl.nedfa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.awaitTouchSlopOrCancellation
import androidx.compose.foundation.gestures.drag
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import kotlin.math.roundToInt
import nl.nedfa.data.Answer
import nl.nedfa.data.Card

// Zinnen bouwen and the "order" exercise: tap a word to add it (or to take it back), or drag it to any place in the
// sentence, within the sentence, or back to the words below. The same on the website and the iPhone.

/** A word being dragged: which tile, where it came from, and where the finger is (in the card's coordinates). */
private class TileDrag(val tile: Int, val fromSentence: Boolean, val grab: Offset, val size: IntSize) {
    var pointer by mutableStateOf(Offset.Zero)
    /** The place in the sentence (without the dragged word) where it would land, or null when not over the sentence. */
    var insertAt by mutableStateOf<Int?>(null)
    var overBank by mutableStateOf(false)
    val center get() = pointer - grab + Offset(size.width / 2f, size.height / 2f)
}

/** Where the sentence, the word bank and every tile are; read only while a finger is down. */
private class Places {
    var root: LayoutCoordinates? = null
    var sentence: LayoutCoordinates? = null
    var bank: LayoutCoordinates? = null
    val sentenceTiles = HashMap<Int, LayoutCoordinates>()
    val bankTiles = HashMap<Int, LayoutCoordinates>()

    fun bounds(of: LayoutCoordinates?): Rect? {
        val root = root ?: return null
        if (of == null || !of.isAttached || !root.isAttached) return null
        return root.localBoundingBoxOf(of, clipBounds = false)
    }

    /** The tile under a finger: in the sentence first, then in the bank. */
    fun hit(at: Offset, chosen: List<Int>, count: Int): Triple<Int, Boolean, Rect>? {
        chosen.forEach { i -> bounds(sentenceTiles[i])?.takeIf { it.contains(at) }?.let { return Triple(i, true, it) } }
        (0 until count).filter { it !in chosen }.forEach { i -> bounds(bankTiles[i])?.takeIf { it.contains(at) }?.let { return Triple(i, false, it) } }
        return null
    }

    /**
     * Before the first word that comes after `point` in reading order. Words before the slot never move when it
     * shifts, so the place stays put while the finger rests.
     */
    fun insertIndex(point: Offset, others: List<Int>): Int {
        val index = others.indexOfFirst { i ->
            val r = bounds(sentenceTiles[i]) ?: return@indexOfFirst false
            point.y < r.top || (point.y <= r.bottom && point.x < r.center.x)
        }
        return if (index < 0) others.size else index
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OrderCard(card: Card, outcome: Outcome?, answer: (Outcome) -> Unit) {
    val order = card.order ?: return
    val chosen = remember(card.id, order) { mutableStateListOf<Int>() }
    val places = remember(card.id, order) { Places() }
    var dragging by remember(card.id, order) { mutableStateOf<TileDrag?>(null) }
    val open by rememberUpdatedState(outcome == null)
    val density = LocalDensity.current
    val slack = with(density) { 20.dp.toPx() }

    fun update(drag: TileDrag, position: Offset) {
        drag.pointer = position
        val center = drag.center
        val sentence = places.bounds(places.sentence)
        val overSentence = sentence?.inflate(slack)?.contains(center) == true
        drag.insertAt = if (overSentence) places.insertIndex(center, chosen.filter { it != drag.tile }) else null
        // Anywhere below the sentence counts as the word bank.
        drag.overBank = !overSentence && (places.bounds(places.bank)?.inflate(slack)?.contains(center) == true || (sentence != null && center.y > sentence.bottom))
    }

    fun drop(drag: TileDrag) {
        val at = drag.insertAt
        if (at != null) {
            val list = chosen.filter { it != drag.tile }.toMutableList()
            list.add(at.coerceIn(0, list.size), drag.tile)
            chosen.clear(); chosen.addAll(list)
        } else if (drag.overBank && drag.fromSentence) {
            chosen.remove(drag.tile)
        }
        // Dropped anywhere else, the word goes back to where it was.
        Haptics.tap()
    }

    T("Zet de woorden in de goede volgorde", style = game(17, FontWeight.Bold), color = C.secondary)
    card.translation?.let { Persian(it, 19, C.text) }
    val lifting = dragging
    Box(
        Modifier.fillMaxWidth().zIndex(if (lifting != null) 1f else 0f)
            .onGloballyPositioned { places.root = it }
            .pointerInput(places) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    if (!open) return@awaitEachGesture
                    val (tile, fromSentence, rect) = places.hit(down.position, chosen.toList(), order.tiles.size) ?: return@awaitEachGesture
                    // A tap stays a tap (the tiles handle it); only a real drag lifts the word.
                    val start = awaitTouchSlopOrCancellation(down.id) { change, _ -> change.consume() } ?: return@awaitEachGesture
                    val lifted = TileDrag(tile, fromSentence, down.position - rect.topLeft, IntSize(rect.width.roundToInt(), rect.height.roundToInt()))
                    try {
                        update(lifted, start.position)
                        dragging = lifted
                        Haptics.tap()
                        val ended = drag(start.id) { change -> update(lifted, change.position); change.consume() }
                        if (ended) drop(lifted)
                    } finally {
                        dragging = null
                    }
                }
            },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
            FlowRow(
                Modifier.fillMaxWidth().heightIn(min = 80.dp).onGloballyPositioned { places.sentence = it }
                    .border(2.dp, outcome?.let { if (it.correct) C.success else C.danger } ?: C.tertiary, RoundedCornerShape(16.dp)).padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                T(order.first, Modifier.background(C.navy, RoundedCornerShape(10.dp)).padding(horizontal = 12.dp, vertical = 8.dp), weight = FontWeight.SemiBold, color = Color.White)
                val shown = chosen.filter { it != lifting?.tile }
                shown.forEachIndexed { position, i ->
                    if (lifting?.insertAt == position) Slot(lifting.size)
                    key(i) {
                        SentenceTile(
                            order.tiles[i],
                            Modifier.onGloballyPositioned { places.sentenceTiles[i] = it }
                                .clickable(enabled = outcome == null, onClickLabel = "Terug naar de woorden") { chosen.remove(i) },
                        )
                    }
                }
                if (lifting != null && lifting.insertAt == shown.size) Slot(lifting.size)
                if (order.ending.isNotEmpty()) T(order.ending, size = 20.sp, weight = FontWeight.Bold, color = C.secondary)
            }
            // The bank keeps its place when it is empty (an empty FlowRow has no size), so a word can go back.
            Box(Modifier.fillMaxWidth().heightIn(min = 48.dp).onGloballyPositioned { places.bank = it }) {
                FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    order.tiles.indices.filter { it !in chosen }.forEach { i ->
                        // The word being dragged out of the bank keeps its place, empty, so the other words stay still.
                        val away = lifting != null && !lifting.fromSentence && lifting.tile == i
                        key(i) {
                            BankTile(
                                order.tiles[i],
                                Modifier.onGloballyPositioned { places.bankTiles[i] = it }.alpha(if (away) 0f else 1f)
                                    .clickable(enabled = outcome == null && !away, onClickLabel = "In de zin zetten") { chosen.add(i) },
                            )
                        }
                    }
                }
            }
        }
        if (lifting != null) {
            val topLeft = lifting.pointer - lifting.grab
            val lift = Modifier.offset { IntOffset(topLeft.x.roundToInt(), topLeft.y.roundToInt()) }.graphicsLayer {
                scaleX = 1.08f; scaleY = 1.08f; rotationZ = -3f
                shadowElevation = 10.dp.toPx(); shape = RoundedCornerShape(12.dp); clip = false
            }
            if (lifting.fromSentence) SentenceTile(order.tiles[lifting.tile], lift, solid = true) else BankTile(order.tiles[lifting.tile], lift)
        }
    }
    if (outcome == null) Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        T("Terug", Modifier.alpha(if (chosen.isEmpty()) 0.4f else 1f).border(1.dp, C.tertiary, RoundedCornerShape(14.dp)).clickable(enabled = chosen.isNotEmpty()) { chosen.removeAt(chosen.lastIndex) }.padding(horizontal = 18.dp, vertical = 14.dp), weight = FontWeight.SemiBold)
        GameButton("Controleer", {
            val right = Answer.normalize(chosen.joinToString(" ") { order.tiles[it] }) == Answer.normalize(order.answer.joinToString(" "))
            answer(Outcome(if (right) 4 else 1, right, if (right) Answer.Result.CORRECT else Answer.Result.WRONG, why = order.why))
        }, Modifier.weight(1f), enabled = chosen.size == order.tiles.size)
    }
}

/** A word in the sentence; `solid` while it is lifted, so nothing shows through. */
@Composable
private fun SentenceTile(text: String, modifier: Modifier, solid: Boolean = false) {
    val fill = C.brand.copy(alpha = 0.15f).let { if (solid) it.compositeOver(C.surface) else it }
    Text(text, modifier.background(fill, RoundedCornerShape(10.dp)).padding(horizontal = 12.dp, vertical = 8.dp),
        color = C.text, style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold))
}

/** A word in the bank below the sentence. */
@Composable
private fun BankTile(text: String, modifier: Modifier) {
    Text(text, modifier.background(C.surface, RoundedCornerShape(12.dp)).padding(horizontal = 14.dp, vertical = 10.dp),
        color = C.text, style = TextStyle(fontSize = 19.sp, fontWeight = FontWeight.SemiBold))
}

/** The orange dashed place where a dragged word will land. */
@Composable
private fun Slot(size: IntSize) {
    val brand = C.brand
    val density = LocalDensity.current
    Box(
        Modifier.size(with(density) { size.width.toDp() }, with(density) { size.height.toDp() }).drawBehind {
            drawRoundRect(
                brand, cornerRadius = CornerRadius(10.dp.toPx()),
                style = Stroke(2.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(6.dp.toPx(), 4.dp.toPx()))),
            )
        },
    )
}
