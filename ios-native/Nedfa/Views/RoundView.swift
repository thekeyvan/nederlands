import SwiftUI

struct Round: Identifiable {
    let id = UUID()
    let cards: [Card]
    let label: String
    let drill: Bool
}

struct Outcome { let grade: Int; let correct: Bool; let result: Answer.Result; var hint: String? = nil }

/// A practice round: one card at a time in the best exercise for it, feedback, then a summary.
struct RoundView: View {
    let round: Round
    @Environment(\.dismiss) private var dismiss
    @State private var index = 0
    @State private var outcome: Outcome?
    @State private var results: [(cardId: String, grade: Int, correct: Bool)] = []
    @State private var combo = 0
    @State private var bestCombo = 0
    @State private var confirmQuit = false
    @State private var before = Stats(reviews: Learner.shared.reviews, events: Learner.shared.events)

    var body: some View {
        NavigationStack {
            Group {
                if index < round.cards.count {
                    let card = round.cards[index]
                    CardRunner(card: card, position: index, outcome: $outcome, answer: answer)
                        .id("\(index)")
                        .padding(.horizontal)
                        .safeAreaInset(edge: .bottom) { if let outcome { FeedbackPanel(card: card, outcome: outcome, combo: combo, next: next) } }
                } else {
                    RoundSummary(round: round, results: results, bestCombo: bestCombo, before: before, again: again, done: { dismiss() })
                        .statusBarScrim(.navy)
                }
            }
            .safeAreaInset(edge: .top, spacing: 0) {
                if index < round.cards.count {
                    HStack(spacing: 14) {
                        Button { results.isEmpty ? dismiss() : (confirmQuit = true) } label: {
                            Image(systemName: "xmark").font(.system(size: 16, weight: .bold)).foregroundStyle(.secondary).frame(width: 40, height: 40)
                        }
                        .buttonStyle(PressableTile(radius: 20))
                        .accessibilityLabel("Stoppen met oefenen")
                        ThickProgress(value: Double(results.count) / Double(max(1, round.cards.count)), color: .mint, height: 16)
                            .accessibilityLabel("\(index + 1) van \(round.cards.count)")
                        HStack(spacing: 3) { Image(systemName: "flame.fill"); Text("\(combo)").monospacedDigit() }
                            .font(.game(17, .black)).foregroundStyle(combo >= 2 ? Color.brand : Color.secondary.opacity(0.5))
                            .accessibilityLabel("Combo \(combo)")
                    }
                    .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 4)
                    .background(Color.ground)
                    .scrollEdgeFade()
                }
            }
            .gameBackground()
            .feedbackScreen("Rondje: \(round.label)", restoresOnClose: true)
            .toolbar(.hidden, for: .navigationBar)
            .confirm("Stoppen met dit rondje?", isPresented: $confirmQuit,
                     message: "Wat je al hebt beantwoord, is bewaard. De andere kaartjes komen later terug.",
                     action: "Stoppen", destructive: true, cancel: "Doorgaan") { dismiss() }
        }
        .onDisappear { Audio.shared.stop() }
    }

    private func answer(_ result: Outcome) {
        guard outcome == nil, results.count == index else { return }
        let card = round.cards[index]
        // A pattern round asks about one pattern several times; only its first answer goes into the schedule.
        if !round.drill || !results.contains(where: { $0.cardId == card.id }) { Learner.shared.review(card.id, grade: result.grade) }
        results.append((card.id, result.grade, result.correct))
        combo = result.correct ? combo + 1 : 0
        bestCombo = max(bestCombo, combo)
        if result.correct { Haptics.success() } else { Haptics.error() }
        if card.mode == nil, result.correct, card.kind != .grammar, let nl = card.nl { Audio.shared.play(nl) }
        outcome = result
    }

    private func next() {
        outcome = nil
        withAnimation(.snappy) { index += 1 }
    }

    private func again() {
        let next = round.drill ? round.cards : Planner.plan(reviews: Learner.shared.reviews)
        PracticeSession.shared.round = Round(cards: next.isEmpty ? round.cards : next, label: round.label, drill: round.drill)
    }
}

/// Picks the exercise for a card and shows it.
struct CardRunner: View {
    let card: Card
    let position: Int
    @Binding var outcome: Outcome?
    let answer: (Outcome) -> Void
    @State private var mode: Card.Mode?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                switch mode ?? .flash {
                case .choose: ChooseCard(card: card, dutch: false, outcome: outcome, answer: answer)
                case .reverse: ChooseCard(card: card, dutch: true, outcome: outcome, answer: answer)
                case .listen: ListenCard(card: card, outcome: outcome, answer: answer)
                case .type: TypeCard(card: card, outcome: outcome, answer: answer)
                case .gap: GapCard(card: card, outcome: outcome, answer: answer)
                case .flash: FlashCard(card: card, answer: answer)
                case .order: OrderCard(card: card, outcome: outcome, answer: answer)
                case .pick: OptionsCard(question: "Welke zin is goed?", subtitle: card.translation, options: card.pick ?? [], outcome: outcome, answer: answer)
                }
            }
            .padding(.top, 12)
            .padding(.bottom, 200)
        }
        .scrollDismissesKeyboard(.interactively)
        .onAppear { if mode == nil { mode = Planner.mode(for: card, review: Learner.shared.reviews[card.id], position: position) } }
    }
}

/// Answer buttons; after a pick the right one turns green.
struct OptionList: View {
    let options: [Option]
    var persian = false
    let outcome: Outcome?
    let pick: (Option) -> Void
    @State private var chosen: String?

    var body: some View {
        let grid = options.count == 4 && options.allSatisfy { $0.label.count <= 20 }
        let columns = grid ? [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)] : [GridItem(.flexible())]
        LazyVGrid(columns: columns, spacing: 14) {
            ForEach(options, id: \.label) { option in
                let right = outcome != nil && option.correct
                let wrong = outcome != nil && option.label == chosen && !option.correct
                Button { chosen = option.label; Haptics.tap(); pick(option) } label: {
                    Group {
                        if persian {
                            Text(option.label).font(.system(size: grid ? 20 : 18, weight: .semibold)).environment(\.layoutDirection, .rightToLeft).multilineTextAlignment(.center)
                        } else {
                            Text(option.label).font(.game(grid ? 19 : 17, .bold)).multilineTextAlignment(grid ? .center : .leading)
                        }
                    }
                    .frame(maxWidth: .infinity, minHeight: grid ? 84 : 58, alignment: grid || persian ? .center : .leading)
                    .padding(.horizontal, 16)
                    .foregroundStyle(right ? Color.success : wrong ? Color.danger : Color.primary)
                    .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(right ? Color.mint : wrong ? Color.danger : .clear, lineWidth: 3))
                }
                .buttonStyle(PressableTile(fill: right ? Color.mintSoft : wrong ? Color.dangerSoft : .surface, edge: right ? .mintEdge : wrong ? .dangerEdge : .edge))
                .opacity(outcome != nil && !right && !wrong ? 0.45 : 1)
                .disabled(outcome != nil)
            }
        }
        .environment(\.layoutDirection, persian && grid ? .rightToLeft : .leftToRight)
    }
}

/// The mascot asks; the word sits in a speech bubble with a listen button.
struct PromptBubble<Content: View>: View {
    /// A card the learner got wrong last time: the mascot tilts its head and thinks.
    var hard = false
    @ViewBuilder var content: () -> Content
    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            MascotActor(pose: .think, moment: hard ? .ponder : nil, size: 84, delay: 0.25)
            content()
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .tile(radius: 22)
        }
    }
}

struct ChooseCard: View {
    let card: Card
    let dutch: Bool
    let outcome: Outcome?
    let answer: (Outcome) -> Void
    var body: some View {
        Eyebrow(dutch ? "Hoe zeg je dit in het Nederlands?" : "Wat betekent dit?")
        PromptBubble(hard: (Learner.shared.reviews[card.id]?.grade ?? 5) < 3) {
            if dutch {
                Persian(text: card.meaning ?? "", font: .system(size: 26, weight: .bold), color: .primary)
            } else {
                HStack(spacing: 10) { Text(card.nl ?? "").font(.game(28, .black)).minimumScaleFactor(0.5).lineLimit(2); Spacer(minLength: 0); ListenButton(text: card.nl ?? "", size: 18) }
            }
        }
        OptionList(options: (dutch ? card.dutchOptions : card.meaningOptions) ?? [], persian: !dutch, outcome: outcome) { option in
            answer(Outcome(grade: option.correct ? 4 : 1, correct: option.correct, result: option.correct ? .correct : .wrong))
        }
    }
}

struct ListenCard: View {
    let card: Card
    let outcome: Outcome?
    let answer: (Outcome) -> Void
    var body: some View {
        Text("Wat hoor je?").font(.headline).foregroundStyle(.secondary).frame(maxWidth: .infinity)
        VStack(spacing: 8) {
            Button { Audio.shared.play(card.nl ?? "") } label: { Image(systemName: "speaker.wave.3.fill").font(.system(size: 44)).frame(width: 110, height: 110) }
                .buttonStyle(GameButtonStyle(color: .navy)).frame(width: 120)
            Button { Audio.shared.play(card.nl ?? "", speed: 0.75) } label: { Label("Langzamer", systemImage: "tortoise.fill") }.font(.subheadline)
        }
        .frame(maxWidth: .infinity)
        .task { try? await Task.sleep(for: .milliseconds(300)); Audio.shared.play(card.nl ?? "") }
        OptionList(options: card.dutchOptions ?? [], outcome: outcome) { option in
            answer(Outcome(grade: option.correct ? 4 : 1, correct: option.correct, result: option.correct ? .correct : .wrong))
        }
    }
}

struct AnswerField: View {
    @Binding var value: String
    let placeholder: String
    let outcome: Outcome?
    let submit: () -> Void
    @FocusState private var focused: Bool
    var body: some View {
        VStack(spacing: 12) {
            TextField(placeholder, text: $value)
                .font(.title3).textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.done)
                .padding(14).background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(outcome.map { $0.result == .wrong ? Color.danger : $0.result == .close ? Color.butter : Color.success } ?? .clear, lineWidth: 2))
                .focused($focused).disabled(outcome != nil).onSubmit(submit)
            if outcome == nil { Button("Controleer", action: submit).buttonStyle(GameButtonStyle()).disabled(value.trimmingCharacters(in: .whitespaces).isEmpty) }
        }
        .onAppear { focused = true }
    }
}

struct TypeCard: View {
    let card: Card
    let outcome: Outcome?
    let answer: (Outcome) -> Void
    @State private var value = ""
    @State private var hinted = false
    var body: some View {
        Text("Typ het Nederlandse woord").font(.headline).foregroundStyle(.secondary)
        Persian(text: card.meaning ?? "", font: .largeTitle.weight(.bold), color: .primary)
        AnswerField(value: $value, placeholder: "Typ hier…", outcome: outcome, submit: check)
        if outcome == nil {
            HStack {
                if hinted { Text("Begint met \(hint(card.nl ?? ""))").font(.subheadline).foregroundStyle(.secondary) } else { Button("Hint", systemImage: "lightbulb") { hinted = true } }
                Spacer()
                Button("Ik weet het niet") { answer(Outcome(grade: 1, correct: false, result: .wrong)) }.foregroundStyle(.secondary)
            }
            .font(.subheadline)
        }
    }
    private func check() {
        let (result, why) = Answer.check(value, card.nl ?? "")
        answer(Outcome(grade: Answer.grade(result, hinted: hinted), correct: result != .wrong, result: result, hint: why))
    }
    private func hint(_ text: String) -> String {
        text.split(separator: " ").map { ["de", "het", "een"].contains($0.lowercased()) ? String($0) : String($0.prefix(max(1, Int(ceil(Double($0.count) / 3))))) + "…" }.joined(separator: " ")
    }
}

struct GapCard: View {
    let card: Card
    let outcome: Outcome?
    let answer: (Outcome) -> Void
    @State private var value = ""
    @State private var hinted = false
    var body: some View {
        let parts = (card.prompt ?? "").components(separatedBy: "___")
        Text("Vul het ontbrekende woord in.").font(.headline).foregroundStyle(.secondary)
        VStack(alignment: .leading, spacing: 8) {
            Text(card.title ?? "").font(.caption.weight(.semibold)).textCase(.uppercase).foregroundStyle(.secondary)
            (Text(parts.first ?? "") + Text(value.isEmpty ? " … " : " \(value) ").foregroundColor(outcome.map { $0.result == .wrong ? .danger : .success } ?? .brand).underline() + Text(parts.count > 1 ? parts[1] : ""))
                .font(.title2.weight(.bold))
        }
        .padding().frame(maxWidth: .infinity, alignment: .leading).background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 18))
        AnswerField(value: $value, placeholder: "Het ontbrekende woord", outcome: outcome, submit: check)
        if outcome == nil {
            if hinted, let rule = card.rule { Persian(text: rule) } else { Button("Toon de regel", systemImage: "lightbulb") { hinted = true }.font(.subheadline) }
        }
    }
    private func check() {
        let (result, why) = Answer.check(value, card.answer ?? "")
        answer(Outcome(grade: Answer.grade(result, hinted: hinted), correct: result != .wrong, result: result, hint: why))
    }
}

struct OrderCard: View {
    let card: Card
    let outcome: Outcome?
    let answer: (Outcome) -> Void
    @State private var chosen: [Int] = []
    var body: some View {
        if let order = card.order {
            Text("Zet de woorden in de goede volgorde").font(.headline).foregroundStyle(.secondary)
            if let translation = card.translation { Persian(text: translation, font: .title3, color: .primary) }
            FlowLayout {
                Text(order.first).font(.headline).padding(.horizontal, 12).padding(.vertical, 8).background(Color.navy, in: RoundedRectangle(cornerRadius: 10)).foregroundStyle(.white)
                ForEach(chosen, id: \.self) { index in
                    Button(order.tiles[index]) { chosen.removeAll { $0 == index } }.font(.headline).padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Color.brand.opacity(0.15), in: RoundedRectangle(cornerRadius: 10)).disabled(outcome != nil)
                }
                if !order.ending.isEmpty { Text(order.ending).font(.title3.bold()).foregroundStyle(.secondary) }
            }
            .padding(12).frame(maxWidth: .infinity, minHeight: 80, alignment: .topLeading)
            .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(outcome.map { $0.correct ? Color.success : Color.danger } ?? Color(.separator), style: StrokeStyle(lineWidth: 2, dash: [6])))
            FlowLayout {
                ForEach(order.tiles.indices.filter { !chosen.contains($0) }, id: \.self) { index in
                    Button(order.tiles[index]) { chosen.append(index) }.font(.title3.weight(.semibold)).padding(.horizontal, 14).padding(.vertical, 10)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12)).foregroundStyle(.primary)
                }
            }
            if outcome == nil {
                HStack {
                    Button("Terug") { _ = chosen.popLast() }.buttonStyle(.bordered).disabled(chosen.isEmpty)
                    Button("Controleer") {
                        let words = chosen.map { order.tiles[$0] }
                        let right = Answer.normalize(words.joined(separator: " ")) == Answer.normalize(order.answer.joined(separator: " "))
                        answer(Outcome(grade: right ? 4 : 1, correct: right, result: right ? .correct : .wrong))
                    }
                    .buttonStyle(GameButtonStyle()).disabled(chosen.count < order.tiles.count)
                }
            }
        }
    }
}

struct OptionsCard: View {
    let question: String
    var subtitle: String?
    let options: [Option]
    let outcome: Outcome?
    let answer: (Outcome) -> Void
    var body: some View {
        Text(question).font(.headline).foregroundStyle(.secondary)
        if let subtitle { Persian(text: subtitle, font: .title3, color: .primary) }
        OptionList(options: options, outcome: outcome) { option in
            answer(Outcome(grade: option.correct ? 4 : 1, correct: option.correct, result: option.correct ? .correct : .wrong))
        }
    }
}

struct FlashCard: View {
    let card: Card
    let answer: (Outcome) -> Void
    @State private var revealed = false
    var body: some View {
        let grammar = card.kind == .grammar
        Text(grammar ? "Maak de zin af" : "Weet je het nog?").font(.headline).foregroundStyle(.secondary)
        VStack(spacing: 14) {
            Text(grammar ? (card.prompt ?? "") : (card.nl ?? "")).font(.title2.weight(.bold)).multilineTextAlignment(.center)
            if revealed {
                Divider()
                if grammar {
                    Text(card.answer ?? "").font(.title3.bold()).foregroundStyle(Color.brand)
                    Text(card.example ?? "")
                    if let translation = card.translation { Persian(text: translation) }
                } else {
                    Persian(text: card.meaning ?? "", font: .title3)
                    if let example = card.example { Text(example).foregroundStyle(.secondary) }
                    ListenButton(text: card.example ?? card.nl ?? "")
                }
            }
        }
        .padding(24).frame(maxWidth: .infinity).background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 24))
        if !revealed {
            Button("Bekijk het antwoord") { withAnimation(.snappy) { revealed = true } }.buttonStyle(GameButtonStyle())
        } else {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(SRS.ratings, id: \.grade) { rating in
                    Button {
                        answer(Outcome(grade: rating.grade, correct: rating.grade >= 3, result: rating.grade >= 3 ? .correct : .wrong))
                    } label: {
                        VStack(spacing: 2) {
                            Text(rating.label).font(.headline)
                            Text("over \(SRS.schedule(Learner.shared.reviews[card.id], grade: rating.grade).interval) dag(en)").font(.caption).foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, minHeight: 60)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

/// The answer panel at the bottom: the mascot reacts, the right answer, the example, and Verder.
struct FeedbackPanel: View {
    let card: Card
    let outcome: Outcome
    /// Right answers in a row, including this one; 3, 5, 10… get a double jump.
    var combo = 0
    let next: () -> Void
    var body: some View {
        let good = outcome.result == .correct
        let close = outcome.result == .close
        let ink: Color = good ? .success : close ? .goldInk : .danger
        let whole = card.mode != nil
        let answerText = whole ? card.example : card.kind == .grammar ? card.answer : card.nl
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                MascotActor(pose: good || close ? .cheer : .oops,
                            moment: good || close ? ([3, 5, 10, 15, 20, 30].contains(combo) ? .doubleHop : .hop) : .nope,
                            size: 64)
                VStack(alignment: .leading, spacing: 2) {
                    Text(good ? "Top!" : close ? (outcome.hint == "article" ? "Bijna! Let op de of het." : "Bijna! Kleine typfout.") : "Nog niet. Dit is het:").font(.game(22, .black)).foregroundStyle(ink)
                    if outcome.result != .correct || card.kind == .grammar, let answerText { Text(answerText).font(.headline) }
                }
                Spacer(minLength: 0)
                Text("+\(XP.forGrade(outcome.grade)) XP").font(.game(16, .black)).foregroundStyle(Color.goldInk)
            }
            if card.kind != .grammar, let example = card.example {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) { Text(example).font(.subheadline); if let translation = card.translation { Persian(text: translation, font: .footnote) } }
                    ListenButton(text: example, size: 13)
                }
            }
            if card.kind == .grammar, let text = whole ? card.translation : card.rule { Persian(text: text, font: .footnote) }
            Button(action: next) { HStack { Text("Verder"); Image(systemName: "arrow.right") } }
                .buttonStyle(GameButtonStyle(color: good ? .mint : close ? .brand : .danger, edge: good ? .mintEdge : close ? .brandEdge : .dangerEdge))
        }
        .padding(20)
        .background(
            UnevenRoundedRectangle(topLeadingRadius: 28, topTrailingRadius: 28, style: .continuous)
                .fill(good ? Color.mintSoft : close ? Color.butterSoft : Color.dangerSoft)
                .shadow(color: .black.opacity(0.08), radius: 16, y: -4)
                .ignoresSafeArea(edges: .bottom)
        )
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}

/// The end of a round: the mascot cheers, XP, right answers, streak, new stamps.
struct RoundSummary: View {
    let round: Round
    let results: [(cardId: String, grade: Int, correct: Bool)]
    let bestCombo: Int
    let before: Stats
    let again: () -> Void
    let done: () -> Void
    @State private var progress = Learner.shared

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        let right = results.filter(\.correct).count
        let xp = results.reduce(0) { $0 + XP.forGrade($1.grade) }
        let newStamps = Content.shared.stamps.filter { stats.earned.contains($0.id) && !before.earned.contains($0.id) }
        ScrollView {
            VStack(spacing: 18) {
                if !results.isEmpty {
                    HStack(alignment: .bottom, spacing: 8) {
                        ForEach(0..<3, id: \.self) { star in
                            Image(systemName: "star.fill").font(.system(size: star == 1 ? 64 : 46))
                                .foregroundStyle(star < starCount(right: right) ? Color.butter : .white.opacity(0.18))
                                .rotationEffect(.degrees(star == 0 ? -12 : star == 2 ? 12 : 0))
                        }
                    }
                    .padding(.top, 30)
                }
                if results.isEmpty {
                    HeroMascot(mood: .sleep, size: 170).padding(.top, 40)
                } else {
                    MascotActor(pose: .cheer, moment: .doubleHop, size: 190, stars: true, delay: 0.2)
                }
                Text(results.isEmpty ? "Je bent weer bij." : "Rondje klaar!").font(.game(34, .black)).foregroundStyle(.white)
                if !results.isEmpty {
                    Text(right == results.count ? "Alles goed. Wat knap!" : right * 2 >= results.count ? "Lekker bezig. De moeilijke komen snel terug." : "Goed geoefend. Morgen gaat het al makkelijker.").foregroundStyle(.white.opacity(0.75)).multilineTextAlignment(.center)
                    HStack(spacing: 10) {
                        tile("XP", "+\(xp)", .goldInk, .goldEdge)
                        tile("Goed", "\(right)/\(results.count)", .success, .mintEdge)
                        tile("Reeks", "\(stats.streak.count)", .brand, .brandEdge)
                    }
                    if bestCombo >= 3 { Label("Beste combo: \(bestCombo) goed op rij", systemImage: "flame.fill").font(.subheadline.weight(.semibold)).foregroundStyle(.white) }
                    if stats.level.number > before.level.number {
                        HStack(spacing: 12) { LevelRing(number: stats.level.number, progress: stats.level.progress); VStack(alignment: .leading) { Eyebrow("Nieuw niveau", color: .butter); Text(stats.level.name).font(.game(18, .black)).foregroundStyle(.white) } ; Spacer() }
                            .padding(14).background(.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                    }
                    ForEach(newStamps) { stamp in
                        HStack(spacing: 12) { Art(name: "stamps/\(stamp.id)", size: 58); VStack(alignment: .leading) { Eyebrow("Nieuwe stempel", color: .butter); Text(stamp.title).font(.game(18, .black)).foregroundStyle(.white); Text(stamp.description).font(.footnote).foregroundStyle(.white.opacity(0.7)) }; Spacer() }
                            .padding(14).background(.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                    }
                }
                Button(action: done) { Text("Verder") }.buttonStyle(GameButtonStyle()).padding(.top, 8)
                Button("Nog een rondje", action: again).font(.headline).foregroundStyle(.white.opacity(0.85)).frame(minHeight: 44)
            }
            .padding(20)
        }
        .background(Color.navy.ignoresSafeArea())
        .onAppear {
            guard !results.isEmpty else { return }
            Haptics.success()
            Analytics.shared.event("ronde klaar", ["soort": round.drill ? "patroon" : "mix", "kaartjes": results.count, "goed": results.filter(\.correct).count])
        }
    }

    private func starCount(right: Int) -> Int {
        guard !results.isEmpty else { return 0 }
        let share = Double(right) / Double(results.count)
        return share >= 0.9 ? 3 : share >= 0.6 ? 2 : 1
    }

    private func tile(_ label: String, _ value: String, _ ink: Color, _ edge: Color) -> some View {
        VStack(spacing: 2) {
            Text(label.uppercased()).font(.caption2.weight(.heavy)).tracking(0.6).foregroundStyle(ink)
            Text(value).font(.game(24, .black)).foregroundStyle(Color(light: 0x141B2B, dark: 0x141B2B)).monospacedDigit()
        }
        .frame(maxWidth: .infinity).padding(.vertical, 12)
        .tile(radius: 20, fill: .white, edge: edge, depth: 5)
    }
}

/// Wraps word tiles onto several lines.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 320
        var x: CGFloat = 0, y: CGFloat = 0, line: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 { x = 0; y += line + spacing; line = 0 }
            x += size.width + spacing; line = max(line, size.height)
        }
        return CGSize(width: width, height: y + line)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, line: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX { x = bounds.minX; y += line + spacing; line = 0 }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing; line = max(line, size.height)
        }
    }
}
