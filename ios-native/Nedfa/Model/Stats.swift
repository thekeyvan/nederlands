import Foundation

/// The game layer, computed from real reviews like on the website: XP, level, streak, stars, route, stamps, missions.
struct Stats {
    struct Level { let number: Int; let name: String; let next: LevelInfo?; let toNext: Int; let progress: Double }
    struct Streak { let count: Int; let today: Bool }
    struct ThemeProgress { let theme: Theme; let total: Int; let done: Int; let known: Int; let stars: Int }
    struct Stop: Identifiable { let lesson: Lesson; let index: Int; let done: Int; let known: Int; let total: Int; var complete: Bool { done == total }; var id: String { lesson.id } }
    struct Mission: Identifiable { let id: String; let title: String; let picture: String; let count: Int; let target: Int; var done: Bool { count >= target } }
    struct Day: Identifiable { let date: Date; let label: String; let count: Int; var id: Date { date } }

    let xp: Int
    let level: Level
    let streak: Streak
    let bestStreak: Int
    let attempts: Int
    let practised: Int
    let known: Int
    let due: Int
    let themes: [ThemeProgress]
    let stops: [Stop]
    let currentStop: Int
    let earned: Set<String>
    let today: Int
    let week: [Day]
    let missions: [Mission]

    init(reviews: [String: Review], events: [ReviewEvent], now: Date = .now) {
        let content = Content.shared
        let calendar = Calendar.current
        attempts = reviews.values.reduce(0) { $0 + $1.reviews }
        let misses = events.filter { $0.grade < 3 }.count
        xp = max(0, attempts * 10 - misses * 5)
        var index = 0
        for (i, level) in content.levels.enumerated() where xp >= level.xp { index = i }
        let current = content.levels[index], next = index + 1 < content.levels.count ? content.levels[index + 1] : nil
        var levelProgress = 1.0
        var toNext = 0
        if let next {
            levelProgress = min(1, Double(xp - current.xp) / Double(next.xp - current.xp))
            toNext = next.xp - xp
        }
        level = Level(number: index + 1, name: current.name, next: next, toNext: toNext, progress: levelProgress)

        let days = Set(events.map { calendar.startOfDay(for: $0.at) })
        var cursor = calendar.startOfDay(for: now)
        let practisedToday = days.contains(cursor)
        if !practisedToday { cursor = calendar.date(byAdding: .day, value: -1, to: cursor)! }
        var count = 0
        while days.contains(cursor) { count += 1; cursor = calendar.date(byAdding: .day, value: -1, to: cursor)! }
        streak = Streak(count: count, today: practisedToday)
        var best = 0
        for day in days where !days.contains(calendar.date(byAdding: .day, value: -1, to: day)!) {
            var run = 0, step = day
            while days.contains(step) { run += 1; step = calendar.date(byAdding: .day, value: 1, to: step)! }
            best = max(best, run)
        }
        bestStreak = best

        let valid = Set(content.cards.map(\.id))
        practised = reviews.keys.filter { valid.contains($0) }.count
        known = reviews.values.filter { SRS.status($0) == .known }.count
        due = reviews.values.filter { $0.due <= now }.count
        themes = content.themes.map { theme in
            let list = content.cards.filter { $0.themeId == theme.id }
            let done = list.filter { reviews[$0.id] != nil }.count
            let known = list.filter { SRS.status(reviews[$0.id]) == .known }.count
            return ThemeProgress(theme: theme, total: list.count, done: done, known: known, stars: Stats.stars(total: list.count, done: done, known: known))
        }
        stops = content.lessons.enumerated().map { index, lesson in
            Stop(lesson: lesson, index: index, done: lesson.cardIds.filter { reviews[$0] != nil }.count,
                 known: lesson.cardIds.filter { SRS.status(reviews[$0]) == .known }.count, total: lesson.cardIds.count)
        }
        let open = stops.firstIndex { !$0.complete }
        currentStop = open ?? stops.count - 1

        let starred = themes.filter { $0.stars > 0 }.count
        var earned = Set<String>()
        if attempts >= 10 { earned.insert("fiets") }
        if starred >= 1 { earned.insert("tulp") }
        if best >= 7 { earned.insert("vuur") }
        if practised >= 100 { earned.insert("molen") }
        if known >= 50 { earned.insert("stroopwafel") }
        if open == nil { earned.insert("kroon") }
        self.earned = earned

        let start = calendar.startOfDay(for: now)
        today = events.filter { calendar.isDate($0.at, inSameDayAs: now) }.count
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "nl_NL")
        formatter.dateFormat = "EEEEEE"
        // This calendar week, Monday on the left; days still to come stay empty.
        let monday = calendar.date(byAdding: .day, value: -((calendar.component(.weekday, from: start) + 5) % 7), to: start)!
        week = (0..<7).map { offset in
            let date = calendar.date(byAdding: .day, value: offset, to: monday)!
            return Day(date: date, label: formatter.string(from: date), count: events.filter { calendar.isDate($0.at, inSameDayAs: date) }.count)
        }

        var first: [String: Date] = [:]
        for event in events where first[event.cardId] == nil { first[event.cardId] = calendar.startOfDay(for: event.at) }
        let todays = events.filter { calendar.isDate($0.at, inSameDayAs: now) }
        let old = Set(todays.filter { first[$0.cardId] != start }.map(\.cardId)).count
        let fresh = Set(todays.filter { first[$0.cardId] == start }.map(\.cardId)).count
        let practical = todays.filter { $0.cardId.hasPrefix("phrase:") }.count
        missions = [
            Mission(id: "herhaal", title: "Herhaal 3 oude kaartjes", picture: "oefenen/fouten", count: min(old, 3), target: 3),
            Mission(id: "nieuw", title: "Leer 3 nieuwe kaartjes", picture: "oefenen/woorden", count: min(fresh, 3), target: 3),
            Mission(id: "zinnen", title: "Oefen 3 handige zinnen", picture: "oefenen/zinnen", count: min(practical, 3), target: 3),
        ]
    }

    /// 1 star: half the theme practised. 2 stars: everything practised. 3 stars: 80% well remembered.
    static func stars(total: Int, done: Int, known: Int) -> Int {
        guard total > 0 else { return 0 }
        if Double(known) / Double(total) >= 0.8 { return 3 }
        if done >= total { return 2 }
        if Double(done) / Double(total) >= 0.5 { return 1 }
        return 0
    }

    func progress(for theme: String) -> ThemeProgress? { themes.first { $0.theme.id == theme } }

    /// The theme you practised most recently, for "Verder met".
    /// The theme to continue with: the last one practised, or for a new learner the first theme that fits their level.
    static func resumeTheme(events: [ReviewEvent], level: String? = nil) -> String {
        for event in events.reversed() {
            if let card = Content.shared.card(event.cardId), Content.shared.theme(card.themeId) != nil { return card.themeId }
        }
        if events.isEmpty, let level { return LevelPlan.sorted(Content.shared.themes, for: level).first?.id ?? "huisarts" }
        return events.isEmpty ? "huisarts" : "werk"
    }
}
