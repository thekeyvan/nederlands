import Foundation

/// Onregelmatig: the same rules as src/core/irregular.js. Every form is a review card with the normal schedule.
enum Irregular {
    struct Progress { let total: Int; let done: Int; let known: Int; let due: Int; let stars: Int }

    static func known(_ review: Review?) -> Bool { (review?.repetitions ?? 0) >= 3 && (review?.grade ?? 0) >= 3 }

    /// Stars like a theme: half practised, everything practised, 80% well remembered.
    static func progress(_ set: IrregularData.Set, reviews: [String: Review], now: Date = .now) -> Progress {
        let ids = set.cardIds
        let total = ids.count
        let done = ids.filter { reviews[$0] != nil }.count
        let known = ids.filter { Self.known(reviews[$0]) }.count
        let due = ids.filter { reviews[$0].map { $0.due <= now } ?? false }.count
        let share = total == 0 ? 0 : Double(known) / Double(total)
        let stars = total == 0 ? 0 : share >= 0.8 ? 3 : done >= total ? 2 : Double(done) / Double(total) >= 0.5 ? 1 : 0
        return Progress(total: total, done: done, known: known, due: due, stars: stars)
    }

    /// A round of ten: forms that are due, then new ones in order, then the ones practised longest ago.
    /// For all sets together ("all"): only forms you have practised.
    static func round(_ setId: String, reviews: [String: Review], now: Date = .now, limit: Int = 10) -> [Card] {
        let content = Content.shared
        var pool: [Card] = content.irregular.cards
        if setId != "all" { pool = content.irregularSet(setId).map { content.irregularCards(in: $0) } ?? [] }
        let practised: [(card: Card, review: Review)] = pool.compactMap { card in reviews[card.id].map { (card, $0) } }
        let due: [Card] = practised.filter { $0.review.due <= now }.sorted { $0.review.due < $1.review.due }.map(\.card)
        let rest: [Card] = practised.filter { $0.review.due > now }.sorted { $0.review.lastReviewed < $1.review.lastReviewed }.map(\.card)
        let fresh: [Card] = setId == "all" ? [] : pool.filter { reviews[$0.id] == nil }
        let queue = Array((due + fresh + rest).prefix(limit))
        if !queue.isEmpty || setId != "all" { return queue }
        return content.irregular.sets.first.map { Array(content.irregularCards(in: $0).prefix(limit)) } ?? []
    }

    /// New forms are chosen; after two good answers you type them.
    static func typed(_ review: Review?) -> Bool { (review?.repetitions ?? 0) >= 2 }

    static func isVerb(_ card: Card) -> Bool { card.labels?.first == "werkwoord" }

    /// A typed answer: right, or close when hebben/zijn is missing.
    static func check(_ input: String, card: Card) -> (Answer.Result, hint: String?) {
        let given = Answer.normalize(input)
        guard !given.isEmpty else { return (.wrong, nil) }
        let accepted = card.accept ?? [card.answer ?? ""]
        if accepted.contains(where: { Answer.normalize($0) == given }) { return (.correct, nil) }
        if card.ask == 2, isVerb(card), accepted.contains(where: { Answer.normalize($0.split(separator: " ").dropFirst().joined(separator: " ")) == given }) { return (.close, "aux") }
        return (.wrong, nil)
    }
}
