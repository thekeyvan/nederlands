import SwiftUI

/// Leren: the path as a game map, all themes as tiles, and the grammar rules.
struct LerenView: View {
    enum Part: String, CaseIterable { case pad = "Pad", themas = "Thema’s", zinsbouw = "Grammatica" }
    @State private var part: Part = .pad

    var body: some View {
        NavigationStack {
            Group {
                switch part {
                case .pad: RouteMap()
                case .themas: ThemesGrid()
                case .zinsbouw: PatternList()
                }
            }
            // A fixed header like Vandaag and Arcade: the title and the switch stay put, content scrolls underneath.
            .safeAreaInset(edge: .top, spacing: 0) {
                VStack(alignment: .leading, spacing: 12) {
                    ScreenTitle("Leren", eyebrow: "\(Content.shared.themes.count) thema’s · \(Content.shared.grammar.count) patronen")
                    Picker("Leren", selection: $part) { ForEach(Part.allCases, id: \.self) { Text($0.rawValue) } }
                        .pickerStyle(.segmented)
                }
                .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 10)
                .background(Color.ground)
                .scrollEdgeFade()
            }
            .feedbackScreen("Leren")
            .gameBackground()
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Theme.self) { ThemeDetailView(theme: $0) }
            .navigationDestination(for: PatternLink.self) { PatternDetailView(cardId: $0.id) }
            .navigationDestination(for: IrregularLink.self) { _ in IrregularOverview() }
            .navigationDestination(for: IrregularSetLink.self) { IrregularSetView(setId: $0.id) }
        }
    }
}

struct PatternLink: Hashable { let id: String }

// MARK: Themes

struct ThemesGrid: View {
    @State private var progress = Learner.shared
    @State private var preferences = Preferences.shared
    @State private var query = ""

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        // Themes for the learner's level (niveautest) first.
        let themes = LevelPlan.sorted(Content.shared.themes, for: preferences.level).filter { needle.isEmpty || "\($0.title) \($0.meaning) \($0.intro)".lowercased().contains(needle) }
        ScrollView {
            SearchField(prompt: "Zoek een thema", text: $query).padding(.horizontal, 20).padding(.top, 12)
            if themes.isEmpty {
                Text("Geen thema gevonden voor “\(query)”.").font(.subheadline).foregroundStyle(.secondary).padding(.top, 30)
            }
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 16) {
                ForEach(themes) { theme in
                    let item = stats.progress(for: theme.id)
                    NavigationLink(value: theme) {
                        VStack(alignment: .leading, spacing: 8) {
                            Art(name: "themes/\(theme.id)", size: 150, corner: 18).frame(maxWidth: .infinity)
                            Text(theme.title).font(.game(16, .heavy)).foregroundStyle(Color.primary).lineLimit(1)
                            HStack {
                                if (item?.done ?? 0) > 0 {
                                    StarsView(count: item?.stars ?? 0)
                                    Spacer()
                                    Text("\(item!.done)/\(item!.total)").font(.caption.weight(.semibold)).foregroundStyle(.secondary).monospacedDigit()
                                } else {
                                    Text("\(Content.shared.words(in: theme.id).count) woorden").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                                    Spacer()
                                    NewBadge()
                                }
                            }
                        }
                        .padding(10)
                    }
                    .buttonStyle(PressableTile())
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
        .scrollDismissesKeyboard(.immediately)
    }
}

struct ThemeDetailView: View {
    let theme: Theme
    enum Part: String, CaseIterable { case woorden = "Woorden", zinnen = "Zinnen", gesprek = "Gesprek" }
    @State private var part: Part = .woorden
    @State private var progress = Learner.shared
    @State private var word: Card?
    @State private var showGames = false
    @State private var showMeaning = false
    private let session = PracticeSession.shared

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events).progress(for: theme.id)
        let words = Content.shared.words(in: theme.id)
        let phrases = Content.shared.phrases(in: theme.id)
        List {
            Section {
                HStack(spacing: 16) {
                    Art(name: "themes/\(theme.id)", size: 96)
                    VStack(alignment: .leading, spacing: 4) {
                        Persian(text: theme.meaning, font: .body)
                        if let stats { HStack { StarsView(count: stats.stars); Text("\(stats.done)/\(stats.total)").font(.footnote).foregroundStyle(.secondary).monospacedDigit() } }
                    }
                }
                HStack(spacing: 12) {
                    Button { session.start(theme: theme.id, label: theme.title) } label: { Label("Oefenen", systemImage: "bolt.fill") }.buttonStyle(GameButtonStyle())
                    Button { showGames = true } label: { Label("Spelen", systemImage: "gamecontroller.fill") }.buttonStyle(GameButtonStyle(color: .navy))
                }
                .listRowSeparator(.hidden)
                Picker("Onderdeel", selection: $part) { ForEach(Part.allCases, id: \.self) { Text($0.rawValue) } }.pickerStyle(.segmented)
            }
            switch part {
            case .woorden:
                Section("\(words.count) woorden") {
                    ForEach(words) { card in
                        Button { word = card } label: {
                            HStack {
                                Circle().fill(color(SRS.status(progress.reviews[card.id]))).frame(width: 9, height: 9)
                                VStack(alignment: .leading) {
                                    Text(card.nl ?? "").font(.body.weight(.semibold))
                                    if card.wordKind == "werkwoord" || card.wordKind == "uitdrukking" { Text(kindLabel(card.wordKind)).font(.caption).foregroundStyle(.secondary) }
                                }
                                Spacer(minLength: 12)
                                if let meaning = card.meaning { Text(meaning).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.trailing).lineLimit(2) }
                                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                            }
                        }
                        .foregroundStyle(.primary)
                    }
                }
            case .zinnen:
                Section {
                    Toggle("Toon vertalingen", isOn: $showMeaning)
                    Button("Oefen deze zinnen") { session.start(theme: theme.id, kind: .praktisch, label: "\(theme.title) · zinnen") }
                }
                Section {
                    ForEach(phrases) { card in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(alignment: .top) {
                                Text(card.nl ?? "").font(.body.weight(.medium))
                                Spacer()
                                ListenButton(text: card.nl ?? "", size: 14)
                            }
                            if showMeaning, let meaning = card.meaning { Persian(text: meaning) }
                        }
                        .padding(.vertical, 4)
                    }
                }
            case .gesprek:
                if let dialogue = Content.shared.dialogue(for: theme.id) {
                    Section { DialogueView(dialogue: dialogue) }.listRowSeparator(.hidden)
                }
            }
        }
        .navigationTitle(theme.title)
        .feedbackScreen("Thema: \(theme.title)", details: ["theme": theme.id])
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $word) { WordSheet(card: $0) }
        .sheet(isPresented: $showGames) { ThemeGamesSheet(theme: theme) }
    }

    private func color(_ status: Status) -> Color { status == .known ? .success : status == .learning ? .butter : Color.secondary.opacity(0.3) }
    private func kindLabel(_ kind: String?) -> String { kind == "werkwoord" ? "Werkwoord" : kind == "uitdrukking" ? "Uitdrukking" : "Woord" }
}

struct DialogueView: View {
    let dialogue: Dialogue
    @State private var hideMine = false
    @State private var revealed: Set<String> = []
    @State private var translations = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle("Vertaling", isOn: $translations)
            Toggle("Verberg mijn zinnen", isOn: $hideMine.animation())
            ForEach(dialogue.lines) { line in
                let mine = line.speaker == "Jij"
                VStack(alignment: mine ? .trailing : .leading, spacing: 4) {
                    Text(line.speaker).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    if mine && hideMine && !revealed.contains(line.id) {
                        Button("Wat zeg jij? Toon jouw zin") { revealed.insert(line.id) }.buttonStyle(.bordered)
                    } else {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(line.nl).font(.body.weight(.medium))
                                if translations { Persian(text: line.translation) }
                            }
                            ListenButton(text: line.nl, size: 13)
                        }
                        .padding(12)
                        .background(mine ? Color.brand.opacity(0.14) : Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                }
                .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
            }
        }
    }
}

struct WordSheet: View {
    let card: Card
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FittedSheet(title: card.themeTitle) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(card.nl ?? "").font(.game(26, .black))
                        Spacer()
                        ListenButton(text: card.nl ?? "")
                    }
                    if let meaning = card.meaning {
                        Divider()
                        Persian(text: meaning, font: .title3, color: .primary).frame(maxWidth: .infinity, alignment: .trailing)
                    }
                }
                .card(padding: 18, radius: 24)
                if let example = card.example {
                    Text("Zo gebruik je het").font(.game(17, .heavy)).padding(.top, 6)
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(alignment: .top) { Text(example).font(.body.weight(.semibold)); Spacer(); ListenButton(text: example, size: 14) }
                        if let translation = card.translation {
                            Divider()
                            Persian(text: translation).frame(maxWidth: .infinity, alignment: .trailing)
                        }
                    }
                    .card(padding: 18, radius: 24)
                }
                if let forms = card.forms, forms.count == 3 {
                    Text("Vormen").font(.game(17, .heavy)).padding(.top, 6)
                    VStack(spacing: 10) {
                        LabeledContent("Imperfectum", value: forms[0])
                        Divider()
                        LabeledContent("Perfectum", value: forms[1])
                        Divider()
                        LabeledContent("Soort", value: forms[2])
                    }
                    .card(padding: 18, radius: 24)
                }
                Button { dismiss(); PracticeSession.shared.start([card], label: "Eén kaartje") } label: { Label("Oefen dit kaartje", systemImage: "bolt.fill") }
                    .buttonStyle(GameButtonStyle())
                    .padding(.top, 8)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 12)
        }
        .feedbackScreen("Kaartje: \(card.nl ?? "")", details: ["card": card.id], restoresOnClose: true)
    }
}

// MARK: Zinsbouw

struct PatternList: View {
    @State private var progress = Learner.shared
    @State private var query = ""
    var body: some View {
        let needle = query.lowercased()
        let cards = Content.shared.grammar.filter { needle.isEmpty || "\($0.title ?? "") \($0.pattern ?? "") \($0.example ?? "")".lowercased().contains(needle) }
        List {
            IrregularBanner()
                .listRowBackground(Color.clear).listRowSeparator(.hidden).listRowInsets(EdgeInsets(top: 8, leading: 20, bottom: 4, trailing: 20))
            SearchField(prompt: "Zoek bijvoorbeeld omdat", text: $query)
                .listRowBackground(Color.clear).listRowInsets(EdgeInsets(top: 4, leading: 20, bottom: 4, trailing: 20))
            Section {
                HStack(spacing: 14) {
                    Art(name: "themes/zinsbouw", size: 72)
                    VStack(alignment: .leading) {
                        Text("Zo valt alles op z’n plek").font(.headline)
                        Text("\(Content.shared.grammar.count) patronen, elk met zes oefeningen").font(.footnote).foregroundStyle(.secondary)
                    }
                }
                Button { PracticeSession.shared.start(theme: "zinsbouw", kind: .zinnen, label: "Zinsbouw") } label: { Label("Mix van alle patronen", systemImage: "shuffle") }
            }
            Section {
                ForEach(cards) { card in
                    NavigationLink(value: PatternLink(id: card.id)) {
                        HStack(spacing: 12) {
                            Text(card.level ?? "").font(.caption.weight(.bold)).frame(width: 34, height: 24).background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 6))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(card.title ?? "").font(.body.weight(.semibold))
                                Text(card.pattern ?? "").font(.caption).foregroundStyle(.secondary).lineLimit(1)
                            }
                            Spacer()
                            if SRS.status(progress.reviews[card.id]) == .known { Image(systemName: "checkmark").foregroundStyle(Color.success) }
                        }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .scrollDismissesKeyboard(.immediately)
    }
}

struct PatternDetailView: View {
    let cardId: String
    var body: some View {
        if let card = Content.shared.card(cardId), let pattern = Content.shared.pattern(cardId) {
            List {
                Section {
                    HStack(spacing: 14) {
                        Art(name: "themes/zinsbouw", size: 64)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(card.level ?? "").font(.caption.weight(.bold)).foregroundStyle(.secondary)
                            Text(card.title ?? "").font(.title3.weight(.bold))
                        }
                    }
                    Text(card.pattern ?? "").font(.system(.footnote, design: .monospaced)).padding(10).frame(maxWidth: .infinity, alignment: .leading).background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 10))
                }
                Section("Voorbeelden") {
                    ForEach(pattern.examples, id: \.nl) { example in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(alignment: .top) {
                                highlighted(example.nl, word: example.gap).font(.body.weight(.medium))
                                Spacer()
                                if example.hasAudio { ListenButton(text: example.nl, size: 14) }
                            }
                            if !example.translation.isEmpty { Persian(text: example.translation) }
                        }
                        .padding(.vertical, 4)
                    }
                }
                if let rule = card.rule { Section("Uitleg") { Persian(text: rule, font: .body) } }
                if let note = card.note { Section("Let op") { Persian(text: note) } }
            }
            .navigationTitle(card.title ?? "")
            .navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                Button { PracticeSession.shared.start(pattern.drill, label: card.title ?? "Zinsbouw", drill: true) } label: {
                    Label("Oefen dit patroon · \(pattern.drill.count)", systemImage: "bolt.fill")
                }
                .buttonStyle(GameButtonStyle()).padding().background(.bar)
            }
        }
    }

    private func highlighted(_ sentence: String, word: String) -> Text {
        guard !word.isEmpty, let range = sentence.range(of: "\\b\(NSRegularExpression.escapedPattern(for: word))\\b", options: .regularExpression) else { return Text(sentence) }
        return Text(sentence[..<range.lowerBound]) + Text(sentence[range]).foregroundColor(.brand).bold() + Text(sentence[range.upperBound...])
    }
}

// MARK: Route

/// The route as a winding path of stops: done stops have gold rims, the current one glows with the mascot, later ones are locked.
struct RouteMap: View {
    @State private var progress = Learner.shared
    @State private var stop: Stats.Stop?
    private let rowHeight: CGFloat = 150
    private let offsets: [CGFloat] = [0, -80, -110, -60, 20, 90, 110, 60]

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        ScrollViewReader { reader in
            ScrollView {
                VStack(spacing: 18) {
                    HStack(spacing: 14) {
                        Art(name: "themes/route", size: 64)
                        VStack(alignment: .leading, spacing: 4) {
                            Eyebrow("A2 → B1", color: .success)
                            Text("\(stats.stops.filter(\.complete).count) van \(stats.stops.count) haltes").font(.game(20, .black))
                        }
                        Spacer()
                    }
                    .card(padding: 14)
                    .padding(.horizontal, 20)

                    VStack(spacing: 0) {
                        ForEach(stats.stops) { item in
                            node(item, current: item.index == stats.currentStop, locked: item.index > stats.currentStop)
                                .frame(maxWidth: .infinity)
                                .offset(x: offsets[item.index % offsets.count])
                                .frame(height: rowHeight)
                                .id(item.index)
                        }
                    }
                    .background(alignment: .top) {
                        GeometryReader { proxy in
                            let point = { (index: Int) in CGPoint(x: proxy.size.width / 2 + offsets[index % offsets.count], y: CGFloat(index) * rowHeight + rowHeight / 2 - 16) }
                            ZStack {
                                path(count: stats.stops.count, point: point).stroke(Color.surface, style: StrokeStyle(lineWidth: 22, lineCap: .round, lineJoin: .round))
                                path(count: stats.currentStop + 1, point: point).stroke(Color.butter, style: StrokeStyle(lineWidth: 7, lineCap: .round, dash: [2, 14]))
                            }
                        }
                    }
                    .padding(.bottom, 30)
                }
                .padding(.vertical, 12)
            }
            .onAppear { if stats.currentStop > 1 { reader.scrollTo(stats.currentStop, anchor: .center) } }
        }
        .sheet(item: $stop) { StopSheet(stop: $0) }
    }

    private func path(count: Int, point: (Int) -> CGPoint) -> Path {
        Path { path in
            guard count > 0 else { return }
            path.move(to: point(0))
            for index in 1..<max(1, count) {
                let from = point(index - 1), to = point(index)
                path.addCurve(to: to, control1: CGPoint(x: from.x, y: from.y + rowHeight * 0.5), control2: CGPoint(x: to.x, y: to.y - rowHeight * 0.5))
            }
        }
    }

    private func node(_ item: Stats.Stop, current: Bool, locked: Bool) -> some View {
        Button { Haptics.tap(); stop = item } label: {
            VStack(spacing: 6) {
                ZStack {
                    if current { Circle().fill(Color.brand.opacity(0.18)).frame(width: 118, height: 118) }
                    Circle().fill(locked ? Color.track : Color.surface)
                        .frame(width: current ? 96 : 84, height: current ? 96 : 84)
                        .background(Circle().fill(locked ? Color.edge : current ? Color.brandEdge : Color.goldEdge).offset(y: 6))
                        .overlay(Circle().stroke(locked ? .clear : current ? Color.brand : Color.butter, lineWidth: 5))
                    if locked {
                        Image(systemName: "lock.fill").font(.title2).foregroundStyle(.secondary)
                    } else {
                        Art(name: "themes/\(item.lesson.themeIds.first ?? "route")", size: current ? 84 : 72, corner: current ? 42 : 36)
                    }
                }
                Text(item.lesson.title).font(.game(13, .heavy)).foregroundStyle(locked ? .secondary : .primary).lineLimit(2, reservesSpace: true).multilineTextAlignment(.center).frame(width: 150)
                if item.complete { StarsView(count: 3) } else if current { Text("Start").font(.caption.weight(.black)).foregroundStyle(Color.brand) }
            }
            .overlay(alignment: .leading) { if current { HeroMascot(mood: .wave, size: 58).offset(x: -78, y: -14) } }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Halte \(item.index + 1): \(item.lesson.title)\(item.complete ? ", klaar" : locked ? ", nog op slot" : "")")
    }
}
