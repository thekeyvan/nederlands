import SwiftUI

/// What the level (from the niveautest) changes: which themes come first. Same rules as src/core/level.js on the website.
enum LevelPlan {
    static let levels = ["A0", "A1", "A2", "B1"]
    static let info: [String: (name: String, text: String)] = [
        "A0": ("Beginnen", "Je begint bij het begin: groeten, getallen en de eerste zinnen."),
        "A1": ("Basis", "Je kent de basis. Nu bouw je eenvoudige zinnen over je dag en je omgeving."),
        "A2": ("Op weg", "Je redt je in het dagelijks leven. Nu oefen je werk, wonen, zorg en de gemeente."),
        "B1": ("Zelfstandig", "Je spreekt al goed. Nu werk je aan lange zinnen, meningen en het inburgeringsexamen."),
    ]

    static func order(_ level: String?) -> [String]? {
        switch level {
        case "A0", "A1": ["A0", "A1", "A2", "B1"]
        case "A2": ["A2", "A1", "B1", "A0"]
        case "B1": ["B1", "A2", "A1", "A0"]
        default: nil
        }
    }

    /// Themes for this level first, course order within a level; unchanged without a level.
    static func sorted(_ themes: [Theme], for level: String?) -> [Theme] {
        guard let order = order(level) else { return themes }
        return themes.enumerated().sorted { a, b in
            let ra = order.firstIndex(of: a.element.levelOrDefault) ?? 9, rb = order.firstIndex(of: b.element.levelOrDefault) ?? 9
            return ra != rb ? ra < rb : a.offset < b.offset
        }.map(\.element)
    }

    /// Up to `count` unfinished themes that fit the level.
    static func suggested(for level: String?, stats: Stats, count: Int = 3) -> [Theme] {
        Array(sorted(Content.shared.themes, for: level).filter { theme in
            guard let item = stats.progress(for: theme.id) else { return true }
            return item.done < item.total
        }.prefix(count))
    }

    /// The start level: the first block not passed, or B1 after passing them all.
    static func result(_ right: [String: Int], passMark: Int) -> String {
        levels.first { (right[$0] ?? 0) < passMark } ?? "B1"
    }
}

/// The niveautest: short questions from easy to hard; it stops at the learner's level and saves it.
struct LevelTestView: View {
    enum Step: Equatable { case intro, question(level: String, index: Int), result(String) }

    @Environment(\.dismiss) private var dismiss
    @State private var step: Step = .intro
    @State private var right: [String: Int] = [:]
    @State private var picked: String?
    @State private var blocks: [String: [Placement.Question]] = [:]
    @State private var progress = Learner.shared
    private let placement = Content.shared.placement

    var body: some View {
        FittedSheet(title: stepTitle) {
            Group {
                switch step {
                case .intro: intro
                case .question(let level, let index): question(level: level, index: index)
                case .result(let level): result(level)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 12)
            .animation(.snappy, value: step)
        }
        .feedbackScreen("Niveautest", restoresOnClose: true)
        .onAppear(perform: shuffle)
    }

    private var stepTitle: String {
        if case .result = step { return "Jouw niveau" }
        return "Niveautest"
    }

    private func shuffle() {
        blocks = Dictionary(grouping: placement.questions, by: \.level).mapValues { list in
            list.map { Placement.Question(level: $0.level, kind: $0.kind, prompt: $0.prompt, answer: $0.answer, options: $0.options.shuffled()) }
        }
    }

    // MARK: Steps

    private var intro: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 14) {
                Mascot(mood: .think, size: 64)
                Text("Je krijgt korte vragen, eerst heel makkelijk en daarna moeilijker. Weet je het niet? Kies dan gewoon. De test stopt vanzelf op jouw niveau.")
                    .font(.subheadline)
            }
            .card(padding: 14, radius: 22)
            Button { right = [:]; step = .question(level: "A0", index: 0) } label: { HStack { Text("Start de test"); Image(systemName: "arrow.right") } }
                .buttonStyle(GameButtonStyle())
            Button("Ik begin bij nul") { finish("A0", skipped: true) }
                .font(.headline).foregroundStyle(Color.brand).frame(maxWidth: .infinity)
        }
    }

    private func question(level: String, index: Int) -> some View {
        let list = blocks[level] ?? []
        let item = list.indices.contains(index) ? list[index] : placement.questions[0]
        let done = Double((Preferences.levels.firstIndex(of: level) ?? 0) * 5 + index) / Double(max(1, placement.questions.count))
        return VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) {
                ThickProgress(value: max(0.04, done), color: .mint, height: 12)
                Text(level).font(.caption.weight(.heavy)).foregroundStyle(.secondary)
            }
            VStack(alignment: .leading, spacing: 6) {
                Eyebrow(item.kind == "fill" ? "Welk woord past?" : item.kind == "meaning" ? "Wat betekent dit?" : "Wat betekent deze zin?")
                Text(item.kind == "fill" ? item.prompt.replacingOccurrences(of: "___", with: picked.map { " \($0) " } ?? " ____ ") : item.prompt)
                    .font(.game(26, .black)).fixedSize(horizontal: false, vertical: true)
            }
            VStack(spacing: 10) {
                ForEach(item.options, id: \.self) { option in
                    Button { answer(option, item: item, level: level, index: index) } label: {
                        HStack {
                            if isPersian(option) { Spacer(minLength: 0) }
                            Text(option).font(.system(size: 17, weight: .semibold)).multilineTextAlignment(isPersian(option) ? .trailing : .leading)
                            if !isPersian(option) { Spacer(minLength: 0) }
                            if picked != nil, option == item.answer { Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.success) }
                            else if picked == option { Image(systemName: "xmark.circle.fill").foregroundStyle(Color.danger) }
                        }
                        .foregroundStyle(Color.primary)
                        .padding(.horizontal, 16).frame(maxWidth: .infinity, minHeight: 56)
                    }
                    .buttonStyle(PressableTile(fill: fill(for: option, item: item), radius: 18))
                    .disabled(picked != nil)
                }
            }
        }
        .id("\(level)-\(index)")
    }

    private func result(_ level: String) -> some View {
        let info = LevelPlan.info[level] ?? ("", "")
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        return VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 16) {
                Mascot(mood: .cheer, size: 84)
                VStack(alignment: .leading, spacing: 2) {
                    Text(level).font(.game(44, .black)).foregroundStyle(Color.brand)
                    Text(info.name).font(.game(20, .heavy))
                }
            }
            Text("\(info.text) Thema’s voor jouw niveau staan voortaan bovenaan. Je kunt de test altijd opnieuw doen bij Instellingen.")
                .font(.subheadline).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            Text("Begin hiermee").font(.game(17, .heavy))
            VStack(spacing: 10) {
                ForEach(LevelPlan.suggested(for: level, stats: stats)) { theme in
                    Button { dismiss(); PracticeSession.shared.start(theme: theme.id, kind: .woorden, label: theme.title) } label: {
                        HStack(spacing: 12) {
                            Art(name: "themes/\(theme.id)", size: 44, corner: 12)
                            Text(theme.title).font(.body.weight(.semibold)).foregroundStyle(Color.primary)
                            Spacer()
                            Image(systemName: "play.fill").foregroundStyle(Color.brand)
                        }
                        .padding(10)
                    }
                    .buttonStyle(PressableTile())
                }
            }
            Button("Klaar") { dismiss() }.buttonStyle(GameButtonStyle()).padding(.top, 4)
        }
    }

    // MARK: Logic

    private func fill(for option: String, item: Placement.Question) -> Color {
        guard picked != nil else { return .surface }
        if option == item.answer { return .mintSoft }
        return option == picked ? .dangerSoft : .surface
    }

    private func isPersian(_ text: String) -> Bool { text.unicodeScalars.contains { (0x0600...0x06FF).contains($0.value) } }

    private func answer(_ option: String, item: Placement.Question, level: String, index: Int) {
        guard picked == nil else { return }
        let correct = option == item.answer
        picked = option
        correct ? Haptics.success() : Haptics.error()
        right[level, default: 0] += correct ? 1 : 0
        Task {
            try? await Task.sleep(for: .milliseconds(correct ? 450 : 900))
            picked = nil
            let block = blocks[level]?.count ?? 5
            let asked = index + 1, score = right[level] ?? 0
            // Keep going while the block can still be passed.
            if asked < block, score + (block - asked) >= placement.passMark { step = .question(level: level, index: asked); return }
            if score >= placement.passMark, let next = Preferences.levels.firstIndex(of: level).map({ $0 + 1 }), next < Preferences.levels.count {
                step = .question(level: Preferences.levels[next], index: 0); return
            }
            finish(LevelPlan.result(right, passMark: placement.passMark))
        }
    }

    private func finish(_ level: String, skipped: Bool = false) {
        Preferences.shared.level = level
        Analytics.shared.event("niveautest", ["niveau": level, "overgeslagen": skipped])
        Haptics.success()
        step = .result(level)
    }
}
