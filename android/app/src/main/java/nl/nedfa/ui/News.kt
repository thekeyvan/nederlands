package nl.nedfa.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Tv
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import nl.nedfa.data.NewsShow
import nl.nedfa.data.NewsState
import nl.nedfa.data.Preferences
import nl.nedfa.service.Analytics

/**
 * Vandaag: one short news video on YouTube, matched to the learner's level. The learner ticks it off,
 * because the app can't see what happens in YouTube.
 */
@Composable
fun NewsCard(level: String?) {
    val context = LocalContext.current
    val show = NewsShow.forLevel(level)
    val state = Preferences.news
    // Opens the show in the YouTube or NPO app when it's installed, otherwise in the browser.
    fun open(item: NewsShow) {
        Analytics.event("nieuws", mapOf("journaal" to item.id))
        if (state != NewsState.DONE) Preferences.markNews(NewsState.ASKED)
        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(item.url))) }
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionTitle("Nieuws van vandaag")
        Column(Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(26.dp, 14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                val done = state == NewsState.DONE
                Box(Modifier.size(44.dp).background(if (done) C.mintSoft else C.navy, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                    Icon(if (done) Icons.Filled.Check else Icons.Filled.Tv, null, tint = if (done) C.success else C.butter, modifier = Modifier.size(22.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    val (title, detail) = when (state) {
                        NewsState.IDLE -> show.title to "${show.detail} · ${show.minutes} min"
                        NewsState.ASKED -> "Heb je het gekeken?" to "Vertel in 3 zinnen wat er gebeurde."
                        NewsState.DONE -> "Gekeken" to "Twee keer kijken helpt. Morgen is er weer nieuw nieuws."
                    }
                    T(title, style = game(16))
                    T(detail, size = 12.sp, color = C.secondary)
                }
            }
            when (state) {
                NewsState.IDLE -> {
                    T(
                        NewsShow.TIP, Modifier.fillMaxWidth().background(C.butterSoft, RoundedCornerShape(12.dp)).padding(horizontal = 12.dp, vertical = 8.dp),
                        style = TextStyle(fontSize = 15.sp, textDirection = TextDirection.Rtl), color = C.goldInk, align = TextAlign.Right,
                    )
                    GameButton("Kijk het nieuws", { open(show) }, icon = Icons.AutoMirrored.Filled.OpenInNew, height = 50.dp)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                        T("Ook:", size = 12.sp, color = C.secondary)
                        NewsShow.all.filter { it != show }.forEachIndexed { index, other ->
                            if (index > 0) T(" · ", size = 12.sp, color = C.secondary)
                            T(other.short, Modifier.clickable { open(other) }.padding(horizontal = 4.dp, vertical = 6.dp), size = 12.sp, weight = FontWeight.SemiBold, color = C.secondary)
                        }
                    }
                }
                NewsState.ASKED -> Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    GameButton("Ja, gekeken", { Haptics.success(); Preferences.markNews(NewsState.DONE) }, Modifier.weight(1f), color = C.mint, edge = C.mintEdge, height = 50.dp)
                    Box(Modifier.weight(1f).heightIn(min = 50.dp).clickable { Preferences.markNews(NewsState.IDLE) }, contentAlignment = Alignment.Center) {
                        T("Nog niet", style = game(17, FontWeight.Bold), color = C.secondary)
                    }
                }
                // Watching again stays possible; the card stays ticked off.
                NewsState.DONE -> PressableTile({ open(show) }, Modifier.fillMaxWidth(), fill = C.surface2, edge = C.edge, radius = 20.dp) {
                    Row(Modifier.fillMaxWidth().heightIn(min = 46.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                        T("Nog een keer kijken", style = game(17, FontWeight.Bold))
                        Spacer(Modifier.width(8.dp))
                        Icon(Icons.AutoMirrored.Filled.OpenInNew, null, tint = C.text, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}
