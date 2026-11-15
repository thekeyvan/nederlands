import Foundation

/// The path: every situation in order from A0 to B1, each with five steps — words, sentences, the grammar you need there,
/// the conversation and a final game. The same rules as src/core/path.js, computed from the normal review history.
enum LearningPath {
    enum StepID: String, CaseIterable { case woorden, zinnen, grammatica, gesprek, eindspel }

    struct Step: Identifiable {
        let id: StepID
        let number: Int
        let title: String
        let detail: String
        let done: Int
        let total: Int
        var rules: [Card] = []
        var irregular: IrregularData.Set? = nil
        var complete: Bool { total > 0 && done >= total }
        var systemImage: String {
            switch id {
            case .woorden: "square.stack.3d.up.fill"
            case .zinnen: "text.bubble.fill"
            case .grammatica: "puzzlepiece.fill"
            case .gesprek: "bubble.left.and.bubble.right.fill"
            case .eindspel: "trophy.fill"
            }
        }
    }

    /// What a step starts.
    enum Launch {
        case round([Card], drill: Bool)
        case irregular(String)
        case game
    }

    /// Finishing a theme's conversation (half or more right) is saved as this review, so it syncs like everything else.
    static func conversationId(_ themeId: String) -> String { "gesprek:\(themeId)" }

    static var sections: [(section: PathSection, themes: [Theme])] {
        Content.shared.path.map { section in (section, section.themeIds.compactMap { Content.shared.theme($0) }) }
    }
    static var themes: [Theme] { sections.flatMap(\.themes) }

    static func themes(forRule id: String) -> [Theme] { themes.filter { $0.grammar?.contains(id) ?? false } }
    static func themes(forIrregular id: String) -> [Theme] { themes.filter { $0.irregular == id } }

    private static func rules(of theme: Theme) -> [Card] { (theme.grammar ?? []).compactMap { Content.shared.card($0) } }
    private static func practised(_ cards: [Card], _ reviews: [String: Review]) -> Int { cards.filter { reviews[$0.id] != nil }.count }

    static func steps(for themeId: String, reviews: [String: Review]) -> [Step] {
        guard let theme = Content.shared.theme(themeId) else { return [] }
        let words = Content.shared.words(in: themeId), sentences = Content.shared.phrases(in: themeId), rules = rules(of: theme)
        let irregular = theme.irregular.flatMap { Content.shared.irregularSet($0) }
        let irregularCards = irregular.map { Content.shared.irregularCards(in: $0) } ?? []
        // An Onregelmatig set counts once you have played a round of it (or all of it, if it is short).
        let irregularDone = irregular == nil || practised(irregularCards, reviews) >= min(10, irregularCards.count)
        let all = words + sentences
        let known = all.filter { SRS.status(reviews[$0.id]) == .known }.count
        let target = Int((Double(all.count) * 0.8).rounded(.up))
        return [
            Step(id: .woorden, number: 1, title: "Woorden", detail: "\(words.count) woorden", done: practised(words, reviews), total: words.count),
            Step(id: .zinnen, number: 2, title: "Handige zinnen", detail: "\(sentences.count) zinnen", done: practised(sentences, reviews), total: sentences.count),
            Step(id: .grammatica, number: 3, title: "Grammatica", detail: "\(rules.count) \(rules.count == 1 ? "regel" : "regels")\(irregular != nil ? " + onregelmatige vormen" : "") voor deze situatie",
                 done: practised(rules, reviews) + (irregular != nil && irregularDone ? 1 : 0), total: rules.count + (irregular != nil ? 1 : 0), rules: rules, irregular: irregular),
            Step(id: .gesprek, number: 4, title: "Gesprek", detail: "Kies wat jij zegt", done: reviews[conversationId(themeId)] != nil ? 1 : 0, total: 1),
            Step(id: .eindspel, number: 5, title: "Eindspel", detail: "Alles door elkaar, tot je het kent", done: min(known, target), total: target),
        ]
    }

    static func next(_ steps: [Step]) -> Step? { steps.first { !$0.complete } }
    static func complete(_ themeId: String, reviews: [String: Review]) -> Bool { next(steps(for: themeId, reviews: reviews)) == nil }

    /// The situation you are on: the one you practised last if it is not finished, else the next unfinished one from your level.
    static func current(reviews: [String: Review], events: [ReviewEvent], level: String?) -> String {
        let list = themes
        guard let first = list.first else { return "huisarts" }
        for event in events.reversed() {
            if let card = Content.shared.card(event.cardId), list.contains(where: { $0.id == card.themeId }) {
                if !complete(card.themeId, reviews: reviews) { return card.themeId }
                break
            }
        }
        var start = 0
        if let level, level != "A0" {
            start = max(0, list.firstIndex { level == "B1" ? $0.level == "B1" : $0.levelOrDefault != "A0" } ?? 0)
        }
        let ordered = Array(list[start...]) + Array(list[..<start])
        return (ordered.first { !complete($0.id, reviews: reviews) } ?? first).id
    }

    /// What a step starts: ten cards (a grammar step plays a pattern's exercises), an Onregelmatig round, or the conversation game.
    static func launch(themeId: String, step: StepID, reviews: [String: Review]) -> Launch? {
        guard let theme = Content.shared.theme(themeId) else { return nil }
        func planOrRepeat(_ list: [Card], kind: Planner.Kind) -> [Card] {
            let queue = Planner.plan(reviews: reviews, theme: themeId, kind: kind, limit: 10)
            if !queue.isEmpty { return queue }
            return Array(list.compactMap { card in reviews[card.id].map { (card, $0.lastReviewed) } }.sorted { $0.1 < $1.1 }.map(\.0).prefix(10))
        }
        switch step {
        case .woorden: return .round(planOrRepeat(Content.shared.words(in: themeId), kind: .woorden), drill: false)
        case .zinnen: return .round(planOrRepeat(Content.shared.phrases(in: themeId), kind: .praktisch), drill: false)
        case .grammatica:
            let rules = rules(of: theme)
            if let fresh = rules.first(where: { reviews[$0.id] == nil }), let pattern = Content.shared.pattern(fresh.id) { return .round(pattern.drill, drill: true) }
            if let set = theme.irregular.flatMap({ Content.shared.irregularSet($0) }) {
                let cards = Content.shared.irregularCards(in: set)
                if practised(cards, reviews) < min(10, cards.count) { return .irregular(set.id) }
            }
            let mixed = rules.compactMap { Content.shared.pattern($0.id) }.flatMap { $0.drill.prefix(3) }
            return .round(Array(mixed.prefix(10)), drill: true)
        case .gesprek: return .game
        case .eindspel:
            let pool = Content.shared.words(in: themeId) + Content.shared.phrases(in: themeId) + rules(of: theme)
            func score(_ card: Card) -> Int {
                guard let review = reviews[card.id] else { return -1 }
                return SRS.status(review) == .known ? 10 + review.repetitions : review.grade + review.repetitions
            }
            return .round(Array(pool.sorted { score($0) < score($1) }.prefix(12)), drill: false)
        }
    }
}

extension PracticeSession {
    /// Starts a step of a situation on the path.
    func start(step: LearningPath.StepID, of theme: Theme) {
        let reviews = Learner.shared.reviews
        let title = LearningPath.steps(for: theme.id, reviews: reviews).first { $0.id == step }?.title ?? ""
        switch LearningPath.launch(themeId: theme.id, step: step, reviews: reviews) {
        case .round(let cards, let drill): start(cards, label: "\(theme.title) · \(title)", drill: drill)
        case .irregular(let set): start(irregular: set, label: "\(theme.title) · \(title)")
        case .game: play(.gesprek, theme: theme.id)
        case nil: break
        }
    }
}
