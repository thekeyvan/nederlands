import SwiftUI

enum GameID: String, CaseIterable, Identifiable {
    case lidwoord, tijdrace, zinsbouwer, aanvullen, werkwoorden, dictee, gesprek
    var id: String { rawValue }
    var title: String {
        switch self {
        case .lidwoord: "De of het?"
        case .tijdrace: "Tijdrace"
        case .zinsbouwer: "Zinnen bouwen"
        case .aanvullen: "Zinnen aanvullen"
        case .werkwoorden: "Werkwoorden"
        case .dictee: "Luisterdictee"
        case .gesprek: "Gesprekken"
        }
    }
    var length: String {
        switch self {
        case .lidwoord, .tijdrace: "60 seconden"
        case .zinsbouwer: "8 zinnen"
        case .aanvullen: "10 zinnen"
        case .werkwoorden: "10 vragen"
        case .dictee: "8 opnames"
        case .gesprek: "3 gesprekken"
        }
    }
    var howTo: [String] {
        switch self {
        case .lidwoord: ["Je ziet een zelfstandig naamwoord.", "Tik op de of het, zo snel als je kunt.", "Je hebt 60 seconden. Elke goede keuze is een punt."]
        case .tijdrace: ["Je ziet een Nederlands woord.", "Kies de goede vertaling.", "Zo veel mogelijk in 60 seconden."]
        case .zinsbouwer: ["Je ziet de vertaling van een zin.", "Tik de woorden in de goede volgorde.", "Het eerste woord staat er al."]
        case .aanvullen: ["In elke zin mist één woord.", "Kies het woord dat past.", "Tien zinnen per ronde."]
        case .werkwoorden: ["Je ziet een werkwoord.", "Kies de goede verleden tijd of het voltooid deelwoord.", "Let op hebben of zijn, t of d."]
        case .dictee: ["Tik op de luidspreker en luister.", "Typ wat je hoort. Je mag vaker luisteren.", "Een kleine typfout telt ook als goed."]
        case .gesprek: ["Je leest een kort gesprek.", "Kies bij jouw beurt wat jij zegt.", "Drie gesprekken per ronde."]
        }
    }
    static let sections: [(String, [GameID])] = [("Woorden", [.lidwoord, .tijdrace]), ("Zinnen", [.zinsbouwer, .aanvullen, .werkwoorden]), ("Luisteren & spreken", [.dictee, .gesprek])]
}

struct GameLaunch: Identifiable { let id = UUID(); let game: GameID; let theme: String
    init(id: GameID, theme: String) { self.game = id; self.theme = theme }
}

struct GameList: View {
    var theme = "all"
    var onPick: (() -> Void)? = nil
    @State private var preferences = Preferences.shared
    var body: some View {
        ForEach(GameID.sections, id: \.0) { section in
            Section(section.0) {
                ForEach(section.1) { game in
                    Button { onPick?(); PracticeSession.shared.play(game, theme: theme) } label: {
                        HStack {
                            PictureRow(picture: "games/\(game.rawValue)", title: game.title, detail: "\(game.length) · \(preferences.records[game.rawValue].map { "record \($0)" } ?? "nog niet gespeeld")", size: 52)
                            Spacer()
                            Image(systemName: "play.fill").foregroundStyle(Color.brand)
                        }
                    }
                    .foregroundStyle(.primary)
                }
            }
        }
    }
}

/// Arcade: the challenge of the week as a big card, then every game as a 3D tile.
struct SpellenView: View {
    @State private var theme = "all"
    @State private var preferences = Preferences.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    ScreenTitle("Arcade", eyebrow: "\(GameID.allCases.count) spellen") {
                            Menu {
                                Picker("Thema", selection: $theme) {
                                    Text("Alle thema’s").tag("all")
                                    ForEach(Content.shared.themes) { Text($0.title).tag($0.id) }
                                }
                            } label: {
                                HStack(spacing: 4) { Text(Content.shared.theme(theme)?.title ?? "Alle thema’s").lineLimit(1); Image(systemName: "chevron.down").font(.caption2.weight(.bold)) }
                                    .font(.subheadline.weight(.semibold)).foregroundStyle(Color.brand)
                            }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    FeaturedGame(game: GameID.weekly, record: preferences.records[GameID.weekly.rawValue]) { PracticeSession.shared.play(GameID.weekly, theme: theme) }
                        .padding(.horizontal, 20)
                    GameGrid(games: GameID.allCases.filter { $0 != GameID.weekly }, theme: theme)
                        .padding(.horizontal, 20)
                }
                .padding(.bottom, 30)
            }
            .feedbackScreen("Arcade")
            .statusBarScrim()
            .gameBackground()
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

extension GameID {
    /// One game is the challenge of the week, so the Arcade looks different each week.
    static var weekly: GameID {
        let week = Calendar.current.component(.weekOfYear, from: .now)
        return allCases[week % allCases.count]
    }
}

/// The big orange card for the challenge of the week.
struct FeaturedGame: View {
    let game: GameID
    let record: Int?
    let play: () -> Void
    var body: some View {
        Button(action: play) {
            HStack(alignment: .top, spacing: 0) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("UITDAGING VAN DE WEEK").font(.caption2.weight(.heavy)).tracking(0.4).lineLimit(1).fixedSize().padding(.horizontal, 10).padding(.vertical, 4).background(.white.opacity(0.22), in: Capsule())
                    Text(game.title).font(.game(28, .black)).lineLimit(1).minimumScaleFactor(0.6)
                    Text(game.length).font(.subheadline.weight(.semibold)).opacity(0.9)
                    Spacer(minLength: 8)
                    HStack(spacing: 8) { Image(systemName: "play.fill"); Text(record.map { "Speel · record \($0)" } ?? "Speel") }
                        .font(.game(16, .black)).foregroundStyle(Color.brand)
                        .padding(.horizontal, 18).frame(height: 44)
                        // A white key with a peach rim and a soft glow on the card, not a shadow on the letters.
                        .background {
                            ZStack {
                                RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color(light: 0xF7C9A3, dark: 0xF2BE94)).offset(y: 4)
                                    .shadow(color: Color.brandEdge.opacity(0.45), radius: 8, y: 6)
                                RoundedRectangle(cornerRadius: 16, style: .continuous).fill(.white)
                            }
                        }
                        .padding(.bottom, 4)
                }
                .foregroundStyle(.white)
                Spacer(minLength: 0)
                Art(name: "games/\(game.rawValue)", size: 128, corner: 30).rotationEffect(.degrees(4)).padding(.top, 30)
            }
            .padding(20)
            .frame(maxWidth: .infinity, minHeight: 200, alignment: .leading)
        }
        .buttonStyle(PressableTile(fill: .brand, edge: .brandEdge, radius: 30))
        .compositingGroup()
        .shadow(color: Color.brand.opacity(0.28), radius: 16, y: 10)
    }
}

/// Games as 3D tiles in two columns.
struct GameGrid: View {
    let games: [GameID]
    var theme = "all"
    var onPick: (() -> Void)? = nil
    @State private var preferences = Preferences.shared
    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 16) {
            ForEach(games) { game in
                Button { onPick?(); PracticeSession.shared.play(game, theme: theme) } label: {
                    VStack(alignment: .leading, spacing: 6) {
                        Art(name: "games/\(game.rawValue)", size: 150, corner: 16).frame(maxWidth: .infinity)
                        Text(game.title).font(.game(16, .black)).foregroundStyle(Color.primary).lineLimit(1)
                        Text(preferences.records[game.rawValue].map { "Record \($0)" } ?? game.length).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    }
                    .padding(10)
                }
                .buttonStyle(PressableTile())
            }
        }
    }
}

struct ThemeGamesSheet: View {
    let theme: Theme
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            ScrollView { GameGrid(games: GameID.allCases, theme: theme.id) { dismiss() }.padding(20) }
                .gameBackground()
                .navigationTitle("Spelen · \(theme.title)")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Klaar") { dismiss() } } }
        }
        .presentationDetents([.large])
    }
}

/// Intro, the game itself, and the end screen, shown over the screen it was opened from.
struct GameFlow: View {
    let game: GameLaunch
    @Environment(\.dismiss) private var dismiss
    @State private var started = false
    @State private var round = 0
    @State private var result: GameResult?
    @State private var confirmQuit = false

    var body: some View {
        NavigationStack {
            Group {
                if let result {
                    GameOver(game: game.game, theme: game.theme, result: result, again: { self.result = nil; round += 1 }, done: { dismiss() })
                } else if !started {
                    intro
                } else {
                    GamePlay(game: game.game, theme: game.theme) { result = $0 }.id(round)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    // Mid-game, ask first: the score of this round would not count.
                    Button { if started && result == nil { confirmQuit = true } else { dismiss() } } label: { Image(systemName: "xmark").font(.headline) }.accessibilityLabel("Sluiten")
                }
            }
        }
        .confirm("Stoppen met dit spel?", isPresented: $confirmQuit,
                 message: "Je score van dit spel telt dan niet mee voor je record.",
                 action: "Stoppen", destructive: true, cancel: "Doorgaan") { dismiss() }
        .feedbackScreen("Spel: \(game.game.title)", details: ["game": game.game.rawValue, "theme": game.theme], restoresOnClose: true)
        .onDisappear { Audio.shared.stop() }
    }

    private var intro: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Art(name: "games/\(game.game.rawValue)", size: 220).frame(maxWidth: .infinity)
                HStack { Label(game.game.length, systemImage: "timer"); if let theme = Content.shared.theme(game.theme) { Text("· \(theme.title)") } }.font(.subheadline).foregroundStyle(.secondary)
                Text(game.game.title).font(.largeTitle.weight(.heavy))
                ForEach(Array(game.game.howTo.enumerated()), id: \.offset) { index, line in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(index + 1)").font(.footnote.bold()).foregroundStyle(.white).frame(width: 24, height: 24).background(Color.brand, in: Circle())
                        Text(line)
                    }
                }
                if let record = Preferences.shared.records[game.game.rawValue] { Label("Record \(record)", systemImage: "trophy.fill").foregroundStyle(Color.butter).font(.headline) }
            }
            .padding()
        }
        .safeAreaInset(edge: .bottom) { Button { started = true } label: { Label("Start", systemImage: "play.fill") }.buttonStyle(GameButtonStyle()).padding() }
    }
}

struct GameResult { let score: Int; let total: Int?; let misses: [Card] }

struct GameOver: View {
    let game: GameID
    var theme = "all"
    let result: GameResult
    let again: () -> Void
    let done: () -> Void
    @State private var previousBest: Int?

    var body: some View {
        let best = previousBest ?? 0
        let isBest = result.score > best && result.score > 0
        ScrollView {
            VStack(spacing: 16) {
                Mascot(mood: isBest || (result.total.map { Double(result.score) / Double($0) >= 0.7 } ?? (result.score >= 10)) ? .cheer : .think, size: 170).padding(.top, 20)
                Text(game.title).font(.caption.weight(.bold)).textCase(.uppercase).foregroundStyle(Color.brand)
                Text(result.total.map { "\(result.score) van de \($0) goed" } ?? "\(result.score) goed!").font(.largeTitle.weight(.heavy))
                Text(isBest ? (best > 0 ? "Nieuw record! Je vorige record was \(best)." : "Je eerste record staat erop.") : "Jouw record: \(max(best, result.score)).").foregroundStyle(.secondary)
                if !result.misses.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Nog even oefenen").font(.headline)
                        ForEach(result.misses.prefix(8)) { card in
                            HStack {
                                VStack(alignment: .leading) { Text(card.label).font(.body.weight(.medium)); if let meaning = card.meaning { Persian(text: meaning, font: .footnote) } }
                                ListenButton(text: card.nl ?? "", size: 13)
                            }
                            Divider()
                        }
                    }
                    .padding().background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 18))
                }
                Button("Nog een keer", action: again).buttonStyle(GameButtonStyle())
                if !result.misses.isEmpty {
                    Button("Oefen deze kaartjes") { PracticeSession.shared.start(Array(Set(result.misses)), label: "Fouten uit \(game.title)") }.buttonStyle(GameButtonStyle(color: .navy))
                }
                Button("Klaar", action: done).font(.headline).frame(maxWidth: .infinity, minHeight: 50).background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
            }
            .padding()
        }
        .onAppear {
            if previousBest == nil {
                previousBest = Preferences.shared.record(game: game.rawValue, score: result.score)
                if result.score > (previousBest ?? 0) { Haptics.success() }
                Analytics.shared.event("spel klaar", ["spel": game.rawValue, "score": result.score])
                // A situation's conversation with half or more right finishes step 4 of its path.
                if game == .gesprek, theme != "all", let total = result.total, total > 0, result.score * 2 >= total {
                    Learner.shared.review(LearningPath.conversationId(theme), grade: 4)
                }
            }
        }
    }
}

/// Runs one round of a game and reports the score.
struct GamePlay: View {
    let game: GameID
    let theme: String
    let finish: (GameResult) -> Void

    var body: some View {
        switch game {
        case .lidwoord: ArticleGame(theme: theme, finish: finish)
        case .tijdrace: RaceGame(theme: theme, finish: finish)
        case .werkwoorden: QuestionGame(questions: verbQuestions(), finish: finish)
        case .aanvullen: QuestionGame(questions: clozeQuestions(), finish: finish)
        case .zinsbouwer: BuilderGame(items: builderItems(), finish: finish)
        case .dictee: DictationGame(cards: dictationCards(), finish: finish)
        case .gesprek: ConversationGame(conversations: conversations(), finish: finish)
        }
    }

    private func themed<T>(_ all: [T], minimum: Int, card: (T) -> Card?) -> [T] {
        guard theme != "all" else { return all }
        let list = all.filter { card($0)?.themeId == theme }
        return list.count >= minimum ? list : all
    }
    private func verbQuestions() -> [Question] {
        let verbs = themed(Content.shared.games.verbs, minimum: 6) { Content.shared.card($0.cardId) }.shuffled()
        var seen = Set<String>(), list: [Question] = []
        for verb in verbs where !seen.contains(verb.cardId) {
            seen.insert(verb.cardId)
            guard let card = Content.shared.card(verb.cardId) else { continue }
            list.append(Question(card: card, title: card.nl ?? "", subtitle: verb.kind == "perfect" ? "Voltooid deelwoord (ik …)" : "Verleden tijd (ik …)", options: verb.options))
            if list.count == 10 { break }
        }
        return list
    }
    private func clozeQuestions() -> [Question] {
        let phrases = themed(Content.shared.games.cloze.filter { !$0.cardId.hasPrefix("zin:") }, minimum: 5) { Content.shared.card($0.cardId) }.shuffled().prefix(6)
        let grammar = Content.shared.games.cloze.filter { $0.cardId.hasPrefix("zin:") }.shuffled().prefix(10 - phrases.count)
        return (Array(phrases) + Array(grammar)).shuffled().compactMap { item in
            Content.shared.card(item.cardId).map { Question(card: $0, title: "\(item.before)___\(item.after)", subtitle: "Welk woord past in het gat?", options: item.options) }
        }
    }
    private func builderItems() -> [GameData.Builder] {
        Array(themed(Content.shared.games.builder, minimum: 5) { Content.shared.card($0.cardId) }.filter { $0.answer.count <= 8 }.shuffled().prefix(8))
    }
    private func dictationCards() -> [Card] {
        let cards = Content.shared.games.dictation.compactMap { Content.shared.card($0) }
        return Array(themed(cards, minimum: 4) { $0 }.shuffled().prefix(8))
    }
    private func conversations() -> [GameData.Conversation] {
        let all = Content.shared.games.conversations.shuffled()
        let own = all.filter { conversation in Content.shared.dialogues.first(where: { $0.id == conversation.dialogueId })?.themeId == theme }
        return Array((own + all.filter { c in !own.contains { $0.dialogueId == c.dialogueId } }).prefix(3))
    }
}

struct Question: Identifiable { let id = UUID(); let card: Card; let title: String; let subtitle: String; let options: [Option] }

struct GameHeader: View {
    var seconds: Int?
    var progress: Double?
    let score: Int
    var body: some View {
        HStack(spacing: 12) {
            if let seconds {
                ProgressView(value: Double(seconds), total: 60).tint(seconds <= 10 ? .danger : .brand)
                Label("\(seconds)", systemImage: "timer").monospacedDigit().font(.subheadline.weight(.bold)).foregroundStyle(seconds <= 10 ? Color.danger : .primary)
            } else if let progress {
                ProgressView(value: progress).tint(.success)
            }
            Label("\(score)", systemImage: "checkmark").font(.subheadline.weight(.bold)).padding(.horizontal, 10).padding(.vertical, 4).background(Color.butter.opacity(0.3), in: Capsule())
        }
        .padding(.horizontal)
    }
}

/// A one-minute countdown.
struct Countdown {
    let start = Date.now
    func left(_ now: Date) -> Int { max(0, 60 - Int(now.timeIntervalSince(start))) }
}

struct ArticleGame: View {
    let theme: String
    let finish: (GameResult) -> Void
    @State private var items: [GameData.Article] = []
    @State private var index = 0
    @State private var score = 0
    @State private var picked: String?
    @State private var misses: [Card] = []
    @State private var clock = Countdown()

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.25)) { context in
            let left = clock.left(context.date)
            VStack(spacing: 30) {
                GameHeader(seconds: left, score: score)
                Spacer()
                if let item = items.isEmpty ? nil : items[index % items.count] {
                    VStack(spacing: 10) {
                        Text("De of het?").font(.headline).foregroundStyle(.secondary)
                        Text(picked == nil ? item.noun : "\(item.article) \(item.noun)").font(.system(size: item.noun.count > 13 ? 32 : 46, weight: .heavy)).minimumScaleFactor(0.4).lineLimit(2).multilineTextAlignment(.center)
                            .foregroundStyle(picked == nil ? Color.primary : picked == item.article ? Color.success : Color.danger)
                        if let meaning = Content.shared.card(item.cardId)?.meaning { Persian(text: meaning, centered: true) }
                    }
                    .padding(.horizontal)
                    HStack(spacing: 16) {
                        ForEach(["de", "het"], id: \.self) { article in
                            Button { choose(article, item) } label: { Text(article).font(.system(size: 36, weight: .heavy)).frame(maxWidth: .infinity, minHeight: 110) }
                                .buttonStyle(GameButtonStyle(color: article == "de" ? .brand : .navy)).disabled(picked != nil)
                        }
                    }
                    .padding(.horizontal)
                }
                Spacer()
            }
            .onChange(of: left == 0) { _, over in if over { finish(GameResult(score: score, total: nil, misses: misses)) } }
        }
        .onAppear {
            let all = Content.shared.games.articles
            let themed = theme == "all" ? all : all.filter { Content.shared.card($0.cardId)?.themeId == theme }
            items = (themed.count >= 15 ? themed : all).shuffled()
            clock = Countdown()
        }
    }

    private func choose(_ article: String, _ item: GameData.Article) {
        picked = article
        if article == item.article { score += 1; Haptics.success() } else { Haptics.error(); if let card = Content.shared.card(item.cardId) { misses.append(card) } }
        Task { try? await Task.sleep(for: .milliseconds(article == item.article ? 350 : 900)); picked = nil; index += 1 }
    }
}

struct RaceGame: View {
    let theme: String
    let finish: (GameResult) -> Void
    @State private var cards: [Card] = []
    @State private var index = 0
    @State private var score = 0
    @State private var misses: [Card] = []
    @State private var clock = Countdown()
    @State private var outcome: Outcome?

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.25)) { context in
            let left = clock.left(context.date)
            VStack(spacing: 24) {
                GameHeader(seconds: left, score: score)
                if !cards.isEmpty {
                    let card = cards[index % cards.count]
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            Text(card.nl ?? "").font(.largeTitle.weight(.heavy)).minimumScaleFactor(0.5)
                            OptionList(options: card.meaningOptions ?? [], persian: true, outcome: outcome) { option in
                                outcome = Outcome(grade: 4, correct: option.correct, result: option.correct ? .correct : .wrong)
                                if option.correct { score += 1; Haptics.success() } else { misses.append(card); Haptics.error() }
                                Task { try? await Task.sleep(for: .milliseconds(option.correct ? 300 : 800)); outcome = nil; index += 1 }
                            }
                            .id(index)
                        }
                        .padding()
                    }
                }
            }
            .onChange(of: left == 0) { _, over in if over { finish(GameResult(score: score, total: nil, misses: misses)) } }
        }
        .onAppear {
            let words = Content.shared.words.filter { $0.meaningOptions != nil }
            let themed = theme == "all" ? words : words.filter { $0.themeId == theme }
            cards = (themed.count >= 12 ? themed : words).shuffled()
            clock = Countdown()
        }
    }
}

struct QuestionGame: View {
    let questions: [Question]
    let finish: (GameResult) -> Void
    @State private var index = 0
    @State private var score = 0
    @State private var misses: [Card] = []
    @State private var outcome: Outcome?

    var body: some View {
        VStack(spacing: 16) {
            GameHeader(progress: questions.isEmpty ? 0 : Double(index) / Double(questions.count), score: score)
            if index < questions.count {
                let question = questions[index]
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        Text(question.subtitle).font(.headline).foregroundStyle(.secondary)
                        Text(question.title.replacingOccurrences(of: "___", with: " ____ ")).font(.title.weight(.bold))
                        if let meaning = question.card.meaning { Persian(text: meaning) }
                        OptionList(options: question.options, outcome: outcome) { option in
                            outcome = Outcome(grade: 4, correct: option.correct, result: option.correct ? .correct : .wrong)
                            if option.correct { score += 1; Haptics.success() } else { misses.append(question.card); Haptics.error() }
                        }
                        .id(index)
                    }
                    .padding()
                }
                .safeAreaInset(edge: .bottom) {
                    if outcome != nil { Button("Verder") { outcome = nil; index += 1; if index >= questions.count { finish(GameResult(score: score, total: questions.count, misses: misses)) } }.buttonStyle(GameButtonStyle()).padding() }
                }
            }
        }
    }
}

struct BuilderGame: View {
    let items: [GameData.Builder]
    let finish: (GameResult) -> Void
    @State private var index = 0
    @State private var score = 0
    @State private var misses: [Card] = []
    @State private var outcome: Outcome?

    var body: some View {
        VStack(spacing: 16) {
            GameHeader(progress: items.isEmpty ? 0 : Double(index) / Double(items.count), score: score)
            if index < items.count, let card = Content.shared.card(items[index].cardId) {
                let item = items[index]
                let exercise = Card(id: card.id, kind: .phrase, themeId: card.themeId, themeTitle: card.themeTitle, wordKind: nil, nl: card.nl, example: item.sentence, forms: nil, meaning: card.meaning, translation: card.meaning, level: nil, title: nil, pattern: nil, prompt: nil, answer: nil, rule: nil, note: nil, hasAudio: card.hasAudio, exampleAudio: card.hasAudio, meaningOptions: nil, dutchOptions: nil, mode: .order, order: .init(first: item.first, tiles: item.tiles, answer: item.answer, ending: item.ending))
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        OrderCard(card: exercise, outcome: outcome) { result in
                            outcome = result
                            Audio.shared.play(item.sentence)
                            if result.correct { score += 1; Haptics.success() } else { misses.append(card); Haptics.error() }
                        }
                        .id(index)
                        if outcome != nil { Text(item.sentence).font(.headline) }
                    }
                    .padding()
                }
                .safeAreaInset(edge: .bottom) {
                    if outcome != nil { Button("Verder") { outcome = nil; index += 1; if index >= items.count { finish(GameResult(score: score, total: items.count, misses: misses)) } }.buttonStyle(GameButtonStyle()).padding() }
                }
            }
        }
    }
}

struct DictationGame: View {
    let cards: [Card]
    let finish: (GameResult) -> Void
    @State private var index = 0
    @State private var score = 0
    @State private var misses: [Card] = []
    @State private var value = ""
    @State private var outcome: Outcome?

    var body: some View {
        VStack(spacing: 16) {
            GameHeader(progress: cards.isEmpty ? 0 : Double(index) / Double(cards.count), score: score)
            if index < cards.count {
                let card = cards[index]
                ScrollView {
                    VStack(spacing: 18) {
                        Text("Luister en typ wat je hoort").font(.headline).foregroundStyle(.secondary)
                        Button { Audio.shared.play(card.nl ?? "") } label: { Image(systemName: "speaker.wave.3.fill").font(.system(size: 40)).frame(width: 100, height: 100) }.buttonStyle(GameButtonStyle(color: .navy)).frame(width: 110)
                        Button("Langzamer", systemImage: "tortoise.fill") { Audio.shared.play(card.nl ?? "", speed: 0.75) }.font(.subheadline)
                        AnswerField(value: $value, placeholder: "Typ wat je hoort", outcome: outcome) {
                            let (result, _) = Answer.check(value, card.nl ?? "")
                            outcome = Outcome(grade: 4, correct: result != .wrong, result: result)
                            if result != .wrong { score += 1; Haptics.success() } else { misses.append(card); Haptics.error() }
                        }
                        .id(index)
                        if outcome != nil { Text(card.nl ?? "").font(.headline); if let meaning = card.meaning { Persian(text: meaning) } }
                    }
                    .padding()
                }
                .task(id: index) { try? await Task.sleep(for: .milliseconds(300)); Audio.shared.play(card.nl ?? "") }
                .safeAreaInset(edge: .bottom) {
                    if outcome != nil { Button("Verder") { outcome = nil; value = ""; index += 1; if index >= cards.count { finish(GameResult(score: score, total: cards.count, misses: misses)) } }.buttonStyle(GameButtonStyle()).padding() }
                }
            }
        }
    }
}

struct ConversationGame: View {
    let conversations: [GameData.Conversation]
    let finish: (GameResult) -> Void
    @State private var conversation = 0
    @State private var step = 0
    @State private var score = 0
    @State private var total = 0
    @State private var misses: [Card] = []
    @State private var chosen: String?

    var body: some View {
        VStack(spacing: 12) {
            GameHeader(progress: conversations.isEmpty ? 0 : Double(conversation) / Double(conversations.count), score: score)
            if conversation < conversations.count {
                let current = conversations[conversation]
                let dialogue = Content.shared.dialogues.first { $0.id == current.dialogueId }
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        if let dialogue, let theme = Content.shared.theme(dialogue.themeId) { PictureRow(picture: "themes/\(theme.id)", title: theme.title, detail: "Gesprek \(conversation + 1) van \(conversations.count)") }
                        ForEach(Array(current.steps.prefix(step + 1).enumerated()), id: \.offset) { offset, item in
                            if let line = Content.shared.line(item.lineId) {
                                if item.options == nil || offset < step {
                                    bubble(line)
                                } else if let options = item.options {
                                    Text("Wat zeg jij?").font(.headline).foregroundStyle(.secondary)
                                    ForEach(options, id: \.lineId) { option in
                                        if let text = Content.shared.line(option.lineId) {
                                            Button { pick(option, line: line) } label: {
                                                Text(text.nl).frame(maxWidth: .infinity, alignment: .leading).padding(14)
                                                    .background((chosen == nil ? Color(.secondarySystemBackground) : option.correct ? Color.success.opacity(0.2) : chosen == option.lineId ? Color.danger.opacity(0.2) : Color(.secondarySystemBackground)), in: RoundedRectangle(cornerRadius: 14))
                                            }
                                            .buttonStyle(.plain).disabled(chosen != nil)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                }
                .safeAreaInset(edge: .bottom) {
                    let needsChoice = current.steps[step].options != nil && chosen == nil
                    if !needsChoice { Button("Verder", action: advance).buttonStyle(GameButtonStyle()).padding() }
                }
                .task(id: "\(conversation)-\(step)") { if let line = Content.shared.line(current.steps[step].lineId), current.steps[step].options == nil { Audio.shared.play(line.nl) } }
            }
        }
    }

    private func bubble(_ line: DialogueLine) -> some View {
        let mine = line.speaker == "Jij"
        return VStack(alignment: mine ? .trailing : .leading, spacing: 2) {
            Text(line.speaker).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(line.nl).padding(12).background(mine ? Color.brand.opacity(0.15) : Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
        }
        .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
    }

    private func pick(_ option: GameData.Conversation.Step.Choice, line: DialogueLine) {
        chosen = option.lineId
        total += 1
        if option.correct { score += 1; Haptics.success() } else { Haptics.error() }
        Audio.shared.play(line.nl)
    }

    private func advance() {
        chosen = nil
        let current = conversations[conversation]
        if step + 1 < current.steps.count { step += 1 } else {
            step = 0
            conversation += 1
            if conversation >= conversations.count { finish(GameResult(score: score, total: max(total, 1), misses: misses)) }
        }
    }
}
