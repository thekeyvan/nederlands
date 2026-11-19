import Foundation

/// "Waarom?": why an answer is right or wrong. `tag` names the rule in Dutch (a short label), `fa` is one or two
/// Persian sentences with the Dutch in **bold**, wrapped in Unicode isolates so it stays left to right.
/// The reasons come with the content (content.json); typed answers get theirs from `Why.spelling`.
struct Why: Codable, Hashable, Sendable {
    let tag: String
    let fa: String
}

// MARK: Typen en dictee
// The same rules as src/core/why.js (and the Android app): keep the three the same.

extension Why {
    /// Dutch inside Persian text: bold, and isolated so the right-to-left text keeps it in one piece.
    static func nl(_ text: String) -> String { "**\u{2066}\(text)\u{2069}**" }

    /// Same as normalizeAnswer in why.js: lower case, no accents, no punctuation, single spaces.
    static func normalize(_ text: String) -> String {
        let lowered = text.lowercased(with: Locale(identifier: "nl")).decomposedStringWithCanonicalMapping
        let marks = ".,!?;:\"“”'’()".unicodeScalars
        let kept = lowered.unicodeScalars.filter { !(0x300...0x36F).contains($0.value) && !marks.contains($0) }
        return String(String.UnicodeScalarView(kept)).split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    private static func replacingFirst(_ text: String, _ target: String, with replacement: String) -> String {
        guard let range = text.range(of: target) else { return text }
        return text.replacingCharacters(in: range, with: replacement)
    }

    /// The first doubled consonant (as in /([bcdfgklmnprstvz])\1/), e.g. "ll" in "bellen".
    private static func doubledConsonant(_ text: String) -> String? {
        let letters = Array(text)
        guard letters.count > 1 else { return nil }
        for index in 0..<(letters.count - 1) where "bcdfgklmnprstvz".contains(letters[index]) && letters[index + 1] == letters[index] {
            return String(repeating: letters[index], count: 2)
        }
        return nil
    }

    /// The first word that differs between what was typed and the answer, with the rule when we recognise it.
    static func spelling(_ input: String, _ answer: String) -> Why? {
        let given = normalize(input).components(separatedBy: " ")
        let expected = normalize(answer).components(separatedBy: " ")
        let articles = ["de", "het", "een"]
        let second = expected.count > 1 ? expected[1] : ""
        if articles.contains(expected[0]), given[0] != expected[0] {
            if !articles.contains(given[0]) {
                return Why(tag: "lidwoord", fa: "حرف تعریف را جا نینداز: \(nl("\(expected[0]) \(second)".trimmingCharacters(in: .whitespacesAndNewlines))).")
            }
            return Why(tag: "lidwoord", fa: "\(nl(second)) با \(nl(expected[0])) می‌آید، نه \(nl(given[0])).")
        }
        guard let index = expected.indices.first(where: { $0 >= given.count || expected[$0] != given[$0] }) else { return nil }
        let right = expected[index]
        let wrong = index < given.count ? given[index] : ""
        if wrong.isEmpty { return nil }
        for vowel in ["a", "e", "i", "o", "u"] {
            let double = vowel + vowel
            if replacingFirst(wrong, double, with: vowel) == right && wrong.contains(double) {
                return Why(tag: "open lettergreep", fa: "در \(nl(right)) هجا با حرف صدادار تمام می‌شود، پس یک \(nl(vowel)) کافی است؛ \(nl(double)) فقط در هجای بسته می‌آید.")
            }
            if replacingFirst(right, double, with: vowel) == wrong && right.contains(double) {
                return Why(tag: "gesloten lettergreep", fa: "در \(nl(right)) هجا بسته است (بعدش صامت می‌آید)، پس صدای بلند را با \(nl(double)) می‌نویسی.")
            }
        }
        if wrong.replacingOccurrences(of: "ei", with: "ij") == right || wrong.replacingOccurrences(of: "ij", with: "ei") == right {
            return Why(tag: "ei of ij", fa: "\(nl(right)) با \(nl(right.contains("ij") ? "ij" : "ei")) نوشته می‌شود. ei و ij یک صدا دارند؛ باید املای هر کلمه را حفظ کنی.")
        }
        if wrong.replacingOccurrences(of: "au", with: "ou") == right || wrong.replacingOccurrences(of: "ou", with: "au") == right {
            return Why(tag: "au of ou", fa: "\(nl(right)) با \(nl(right.contains("ou") ? "ou" : "au")) نوشته می‌شود. au و ou یک صدا دارند.")
        }
        if let doubled = doubledConsonant(right), wrong == replacingFirst(right, doubled, with: String(doubled.prefix(1))) {
            return Why(tag: "dubbele medeklinker", fa: "بعد از صدای کوتاه، صامت دوبار نوشته می‌شود: \(nl(right)).")
        }
        if let doubled = doubledConsonant(wrong), replacingFirst(wrong, doubled, with: String(doubled.prefix(1))) == right, wrong != right {
            return Why(tag: "één medeklinker", fa: "بعد از صدای بلند یک صامت کافی است: \(nl(right)).")
        }
        if let last = right.last, let wrongLast = wrong.last, String(wrong.dropLast()) == String(right.dropLast()), "dt".contains(last), "dt".contains(wrongLast) {
            return Why(tag: "d of t", fa: "\(nl(right)) با \(nl(String(last))) نوشته می‌شود، هرچند آخر کلمه صدای t می‌دهد.")
        }
        return Why(tag: "spelling", fa: "اینجا \(nl(right)) نوشته می‌شود، نه \(nl(wrong)).")
    }

    /// A piece of what was typed; `wrong` marks the letters that differ from the answer.
    struct DiffPart: Hashable, Sendable {
        let text: String
        let wrong: Bool
    }

    /// The letters of `typed` that differ from `answer`, for highlighting (spellingDiff in why.js).
    static func diff(_ typed: String, _ answer: String) -> [DiffPart] {
        let a = Array(typed), b = Array(answer)
        var start = 0
        while start < a.count, start < b.count, a[start].lowercased() == b[start].lowercased() { start += 1 }
        var end = 0
        while end < a.count - start, end < b.count - start, a[a.count - 1 - end].lowercased() == b[b.count - 1 - end].lowercased() { end += 1 }
        return [
            DiffPart(text: String(a[..<start]), wrong: false),
            DiffPart(text: String(a[start..<(a.count - end)]), wrong: true),
            DiffPart(text: String(a[(a.count - end)...]), wrong: false),
        ].filter { !$0.text.isEmpty }
    }
}
