package nl.nedfa.data

import java.text.Normalizer
import java.util.Locale

// "Waarom?": the reasons that are not in content.json. The same rules as src/core/why.js (keep the three the same).

private val dutch: Locale = Locale.forLanguageTag("nl")

// The same as normalizeAnswer in why.js: lower case, no accents, no punctuation, single spaces.
private val accents = Regex("[\\u0300-\\u036f]")
private val punctuation = Regex("[.,!?;:\"“”'’()]")
private val spaces = Regex("[\\t\\n\\u000B\\f\\r \\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+")

private fun normalizeAnswer(text: String): String =
    Normalizer.normalize(text.lowercase(dutch), Normalizer.Form.NFD).replace(accents, "").replace(punctuation, "").replace(spaces, " ").trim()

/** Dutch inside Persian text: bold, and isolated so the right-to-left text keeps it in one piece. */
private fun nl(text: String) = "**⁦$text⁩**"

private val doubleConsonant = Regex("([bcdfgklmnprstvz])\\1")
private val endsInDT = Regex("[dt]$")

/** The first word that differs between what was typed and the answer, with the rule when we recognise it. */
fun spellingWhy(input: String, answer: String): Why? {
    val given = normalizeAnswer(input).split(" ")
    val expected = normalizeAnswer(answer).split(" ")
    val articles = listOf("de", "het", "een")
    if (expected[0] in articles && given[0] != expected[0]) {
        if (given[0] !in articles) return Why("lidwoord", "حرف تعریف را جا نینداز: ${nl("${expected[0]} ${expected.getOrNull(1) ?: ""}".trim())}.")
        return Why("lidwoord", "${nl(expected.getOrNull(1) ?: "")} با ${nl(expected[0])} می‌آید، نه ${nl(given[0])}.")
    }
    val index = expected.indices.firstOrNull { expected[it] != given.getOrNull(it) } ?: return null
    val right = expected[index]
    val wrong = given.getOrNull(index) ?: ""
    if (wrong.isEmpty()) return null
    for (vowel in "aeiou") {
        val double = "$vowel$vowel"
        if (wrong.replaceFirst(double, "$vowel") == right && wrong.contains(double)) {
            return Why("open lettergreep", "در ${nl(right)} هجا با حرف صدادار تمام می‌شود، پس یک ${nl("$vowel")} کافی است؛ ${nl(double)} فقط در هجای بسته می‌آید.")
        }
        if (right.replaceFirst(double, "$vowel") == wrong && right.contains(double)) {
            return Why("gesloten lettergreep", "در ${nl(right)} هجا بسته است (بعدش صامت می‌آید)، پس صدای بلند را با ${nl(double)} می‌نویسی.")
        }
    }
    if (wrong.replace("ei", "ij") == right || wrong.replace("ij", "ei") == right) {
        return Why("ei of ij", "${nl(right)} با ${nl(if (right.contains("ij")) "ij" else "ei")} نوشته می‌شود. ei و ij یک صدا دارند؛ باید املای هر کلمه را حفظ کنی.")
    }
    if (wrong.replace("au", "ou") == right || wrong.replace("ou", "au") == right) {
        return Why("au of ou", "${nl(right)} با ${nl(if (right.contains("ou")) "ou" else "au")} نوشته می‌شود. au و ou یک صدا دارند.")
    }
    val doubled = doubleConsonant.find(right)
    if (doubled != null && wrong == right.replaceFirst(doubled.value, doubled.groupValues[1])) {
        return Why("dubbele medeklinker", "بعد از صدای کوتاه، صامت دوبار نوشته می‌شود: ${nl(right)}.")
    }
    if (doubleConsonant.replaceFirst(wrong, "$1") == right && wrong != right) {
        return Why("één medeklinker", "بعد از صدای بلند یک صامت کافی است: ${nl(right)}.")
    }
    if (wrong.dropLast(1) == right.dropLast(1) && endsInDT.containsMatchIn(right) && endsInDT.containsMatchIn(wrong)) {
        return Why("d of t", "${nl(right)} با ${nl(right.takeLast(1))} نوشته می‌شود، هرچند آخر کلمه صدای t می‌دهد.")
    }
    return Why("spelling", "اینجا ${nl(right)} نوشته می‌شود، نه ${nl(wrong)}.")
}

/** A piece of what was typed, for highlighting: `wrong` is the part that differs from the answer. */
data class DiffPart(val text: String, val wrong: Boolean)

/** The letters of `typed` that differ from `answer`: the same start and end are kept, the middle is wrong. */
fun spellingDiff(typed: String, answer: String): List<DiffPart> {
    val a = typed
    val b = answer
    var start = 0
    while (start < a.length && start < b.length && a[start].lowercaseChar() == b[start].lowercaseChar()) start++
    var end = 0
    while (end < a.length - start && end < b.length - start && a[a.length - 1 - end].lowercaseChar() == b[b.length - 1 - end].lowercaseChar()) end++
    return listOf(DiffPart(a.substring(0, start), false), DiffPart(a.substring(start, a.length - end), true), DiffPart(a.substring(a.length - end), false))
        .filter { it.text.isNotEmpty() }
}

/** The rule of a grammar pattern or an irregular set, which the content already has in Persian. */
fun ruleWhy(card: Card?): Why? {
    val rule = card?.rule ?: return null
    val tag = if (card.title != null && !card.id.startsWith("onr:")) card.title else card.themeTitle ?: card.title ?: "regel"
    return Why(tag, rule)
}

/** The reason to show for a pick: the picked option's own, else the right option's. */
fun whyFor(options: List<Option>, picked: Option?): Why? =
    if (picked == null) null else picked.why ?: options.firstOrNull { it.correct }?.why

fun whyFor(options: List<ConversationChoice>, picked: ConversationChoice?): Why? =
    if (picked == null) null else picked.why ?: options.firstOrNull { it.correct }?.why
