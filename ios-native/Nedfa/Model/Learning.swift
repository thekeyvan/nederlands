import Foundation

/// One card's place in the SM-2 schedule. Field names match the website and the Supabase sync.
struct Review: Codable, Hashable {
    var ease: Double
    var interval: Int
    var repetitions: Int
    var due: Date
    var lastReviewed: Date
    var grade: Int
    var reviews: Int
}

struct ReviewEvent: Codable, Hashable, Identifiable {
    let id: String
    let cardId: String
    let grade: Int
    let at: Date
}

enum Status { case new, learning, known }

/// SM-2, exactly as on the website: right first time = 4, right with a hint or small slip = 3, wrong = 1.
enum SRS {
    static let ratings: [(grade: Int, label: String)] = [(1, "Nog niet"), (3, "Moeilijk"), (4, "Goed"), (5, "Makkelijk")]

    static func schedule(_ previous: Review?, grade: Int, now: Date = .now) -> Review {
        let ease = previous?.ease ?? 2.5
        var repetitions = previous?.repetitions ?? 0
        var interval: Int
        if grade < 3 {
            repetitions = 0
            interval = 1
        } else {
            interval = repetitions == 0 ? 1 : repetitions == 1 ? 6 : Int(ceil(Double(previous?.interval ?? 1) * ease))
            repetitions += 1
        }
        interval = min(36500, interval)
        let g = Double(5 - grade)
        let nextEase = min(10, max(1.3, ease + 0.1 - g * (0.08 + g * 0.02)))
        let due = Calendar.current.date(byAdding: .day, value: interval, to: now) ?? now
        return Review(ease: (nextEase * 100).rounded() / 100, interval: interval, repetitions: repetitions, due: due, lastReviewed: now, grade: grade, reviews: (previous?.reviews ?? 0) + 1)
    }

    static func status(_ review: Review?) -> Status {
        guard let review else { return .new }
        if review.grade < 3 { return .learning }
        return review.repetitions >= 3 ? .known : .learning
    }

    /// Cards that are due first (oldest first), then up to `newLimit` new ones.
    static func queue(_ cards: [Card], reviews: [String: Review], limit: Int = 20, newLimit: Int = 5, now: Date = .now) -> [Card] {
        let due = cards.filter { reviews[$0.id].map { $0.due <= now } ?? false }.sorted { reviews[$0.id]!.due < reviews[$1.id]!.due }
        let fresh = cards.filter { reviews[$0.id] == nil }.prefix(newLimit)
        return Array((due + fresh).prefix(limit))
    }
}

/// Which cards a round asks: the same choices as Oefenen on the website.
enum Planner {
    enum Kind: String { case all, woorden, praktisch, zinnen }

    static func plan(reviews: [String: Review], theme: String = "all", kind: Kind = .all, limit: Int = 20, cardIds: [String]? = nil) -> [Card] {
        let content = Content.shared
        var pool: [Card]
        switch kind {
        case .woorden: pool = content.words
        case .praktisch: pool = content.phrases
        case .zinnen: pool = content.grammar
        case .all: pool = content.cards
        }
        if theme != "all" { pool = pool.filter { $0.themeId == theme } }
        if let cardIds { let set = Set(cardIds); pool = pool.filter { set.contains($0.id) } }
        if kind == .all {
            // Alternate words and practical sentences, like the website.
            let words = pool.filter { $0.kind != .phrase }, practical = pool.filter { $0.kind == .phrase }
            pool = []
            for index in 0..<max(words.count, practical.count) {
                if index < words.count { pool.append(words[index]) }
                if index < practical.count { pool.append(practical[index]) }
            }
        }
        return SRS.queue(pool, reviews: reviews, limit: limit)
    }

    /// New cards get recognition modes; cards you know well get recall (typing).
    static func mode(for card: Card, review: Review?, position: Int) -> Card.Mode {
        if let mode = card.mode { return mode }
        let repetitions = review?.repetitions ?? 0
        switch card.kind {
        case .grammar: return (card.prompt?.contains("___") ?? false) && card.answer != nil ? .gap : .flash
        case .phrase: return repetitions >= 2 ? .flash : (card.hasAudio ? .listen : .flash)
        case .word:
            if card.meaning == nil { return .flash }
            if review == nil { return .choose }
            if repetitions < 2 { return position % 2 == 0 && card.hasAudio ? .listen : .reverse }
            return .type
        }
    }
}

enum Answer {
    enum Result { case correct, close, wrong }

    static func normalize(_ text: String) -> String {
        let lowered = text.lowercased().folding(options: .diacriticInsensitive, locale: Locale(identifier: "nl"))
        let stripped = lowered.unicodeScalars.filter { !".,!?;:\"“”'’()".unicodeScalars.contains($0) }
        return String(String.UnicodeScalarView(stripped)).split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    static func distance(_ a: String, _ b: String) -> Int {
        let a = Array(a), b = Array(b)
        if a.isEmpty { return b.count }
        if b.isEmpty { return a.count }
        var row = Array(0...b.count)
        for i in 1...a.count {
            var previous = row[0]
            row[0] = i
            for j in 1...b.count {
                let current = row[j]
                row[j] = min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] == b[j - 1] ? 0 : 1))
                previous = current
            }
        }
        return row[b.count]
    }

    /// 'close' covers a missing article or a small typo: right idea, worth a second look.
    static func check(_ input: String, _ expected: String) -> (Result, hint: String?) {
        let given = normalize(input), want = normalize(expected)
        guard !given.isEmpty else { return (.wrong, nil) }
        if given == want { return (.correct, nil) }
        let article = #/^(de|het|een) /#
        if want.contains(article) {
            let bareWant = want.replacing(article, with: "")
            if given == bareWant || given.replacing(article, with: "") == bareWant { return (.close, "article") }
        }
        let allowed = want.count >= 10 ? 2 : want.count >= 5 ? 1 : 0
        if allowed > 0 && distance(given, want) <= allowed { return (.close, "typo") }
        return (.wrong, nil)
    }

    static func grade(_ result: Result, hinted: Bool = false) -> Int {
        switch result {
        case .correct: hinted ? 3 : 4
        case .close: 3
        case .wrong: 1
        }
    }
}

/// XP: 10 for a right answer, 5 for an attempt. Everything is computed from the reviews.
enum XP {
    static func forGrade(_ grade: Int) -> Int { grade >= 3 ? 10 : 5 }
}
