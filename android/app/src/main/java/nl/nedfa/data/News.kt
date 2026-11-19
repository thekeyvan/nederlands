package nl.nedfa.data

import java.util.Calendar

/**
 * Het nieuws van vandaag: one short Dutch news video a day, opened outside the app (YouTube, or NPO Start for Makkelijke Taal).
 * The same list as the website (src/core/news.js) and the iPhone app (ios-native/Nedfa/Model/News.swift).
 */
data class NewsShow(val id: String, val title: String, val short: String, val detail: String, val minutes: Int, val url: String) {
    companion object {
        val all = listOf(
            NewsShow("makkelijk", "NOS Journaal in Makkelijke Taal", "Makkelijke Taal", "Het nieuws, rustig verteld", 10, "https://npo.nl/start/serie/nos-journaal-in-makkelijke-taal/afleveringen"),
            NewsShow("jeugd", "Jeugdjournaal", "Jeugdjournaal", "Nieuws met veel beeld", 10, "https://www.youtube.com/@jeugdjournaal/videos"),
            NewsShow("nos", "NOS Journaal", "NOS Journaal", "Het gewone journaal, in gewoon tempo", 20, "https://www.youtube.com/@NOS/videos"),
        )

        /** Persian tip on the card: turn on Dutch subtitles and watch twice. */
        const val TIP = "زیرنویس هلندی را روشن کن و دو بار ببین."

        /** Makkelijke Taal up to A2 (and before the niveautest), Jeugdjournaal from B1. */
        fun forLevel(level: String?) = all.first { it.id == if (level == "B1") "jeugd" else "makkelijk" }

        /** Today on this phone, to keep the card's state for one day only. */
        fun today(): String = Calendar.getInstance().let { "${it.get(Calendar.YEAR)}-${it.get(Calendar.MONTH) + 1}-${it.get(Calendar.DAY_OF_MONTH)}" }
    }
}

/** Where today's news card is: not opened, opened (did you watch it?) or watched. */
enum class NewsState { IDLE, ASKED, DONE }
