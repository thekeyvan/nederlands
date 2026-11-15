import SwiftUI

/// Leren: Thema’s, Zinsbouw and the Route, switched with a segmented control.
struct LerenView: View {
    enum Part: String, CaseIterable { case themas = "Thema’s", zinsbouw = "Zinsbouw", route = "Route" }
    @State private var part: Part = .themas

    var body: some View {
        NavigationStack {
            Group {
                switch part {
                case .themas: ThemesList()
                case .zinsbouw: PatternList()
                case .route: RouteList()
                }
            }
            .safeAreaInset(edge: .top, spacing: 0) {
                Picker("Leren", selection: $part) { ForEach(Part.allCases, id: \.self) { Text($0.rawValue) } }
                    .pickerStyle(.segmented).padding(.horizontal).padding(.bottom, 8).background(Color(.systemGroupedBackground), ignoresSafeAreaEdges: [])
            }
            .navigationTitle("Leren")
            .navigationDestination(for: Theme.self) { ThemeDetailView(theme: $0) }
            .navigationDestination(for: PatternLink.self) { PatternDetailView(cardId: $0.id) }
        }
    }
}

struct PatternLink: Hashable { let id: String }

// MARK: Themes

struct ThemesList: View {
    @State private var progress = Learner.shared
    @State private var query = ""

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        let themes = Content.shared.themes.filter { needle.isEmpty || "\($0.title) \($0.meaning) \($0.intro)".lowercased().contains(needle) }
        List(themes) { theme in
            let item = stats.progress(for: theme.id)
            NavigationLink(value: theme) {
                HStack {
                    PictureRow(picture: "themes/\(theme.id)", title: theme.title, detail: (item?.done ?? 0) > 0 ? "\(item!.done) van \(item!.total) geoefend" : "\(Content.shared.words(in: theme.id).count) woorden · \(Content.shared.phrases(in: theme.id).count) zinnen", size: 52)
                    Spacer()
                    if (item?.done ?? 0) > 0 { StarsView(count: item?.stars ?? 0) } else { Text("Nieuw").font(.caption.weight(.bold)).padding(.horizontal, 8).padding(.vertical, 3).background(Color.brand.opacity(0.15), in: Capsule()).foregroundStyle(Color.brand) }
                }
            }
        }
        .searchable(text: $query, prompt: "Zoek een thema")
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
    @State private var progress = Learner.shared

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Text(card.nl ?? "").font(.title2.weight(.bold))
                        Spacer()
                        ListenButton(text: card.nl ?? "")
                    }
                    if let meaning = card.meaning { Persian(text: meaning, font: .title3) }
                }
                if let example = card.example {
                    Section("Zo gebruik je het") {
                        HStack(alignment: .top) { Text(example).font(.body.weight(.medium)); Spacer(); ListenButton(text: example, size: 14) }
                        if let translation = card.translation { Persian(text: translation) }
                    }
                }
                if let forms = card.forms, forms.count == 3 {
                    Section("Vormen") {
                        LabeledContent("Imperfectum", value: forms[0])
                        LabeledContent("Perfectum", value: forms[1])
                        LabeledContent("Soort", value: forms[2])
                    }
                }
                Section {
                    Button { dismiss(); PracticeSession.shared.start([card], label: "Eén kaartje") } label: { Label("Oefen dit kaartje", systemImage: "bolt.fill") }
                        .buttonStyle(GameButtonStyle()).listRowInsets(EdgeInsets()).listRowBackground(Color.clear)
                }
            }
            .navigationTitle(card.themeTitle ?? "")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Klaar") { dismiss() } } }
        }
        .presentationDetents([.medium, .large])
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
        .searchable(text: $query, prompt: "Zoek bijvoorbeeld omdat")
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

struct RouteView: View {
    var body: some View { RouteList().navigationTitle("Route") }
}

struct RouteList: View {
    @State private var progress = Learner.shared
    @State private var open: Int?

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        List {
            Section {
                HStack(spacing: 14) {
                    Art(name: "themes/route", size: 72)
                    VStack(alignment: .leading) {
                        Text("A2 → B1").font(.title3.weight(.bold))
                        Text("\(stats.stops.filter(\.complete).count) van \(stats.stops.count) haltes · acht stappen uit je lessen").font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
            Section {
                ForEach(stats.stops) { stop in
                    let isOpen = (open ?? stats.currentStop) == stop.index
                    VStack(alignment: .leading, spacing: 12) {
                        Button { withAnimation(.snappy) { open = isOpen ? -1 : stop.index } } label: {
                            HStack(spacing: 12) {
                                marker(stop, current: stop.index == stats.currentStop)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(stop.lesson.title).font(.body.weight(isOpen ? .bold : .semibold))
                                    Text("\(stop.done) van \(stop.total) geoefend").font(.footnote).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.down").rotationEffect(.degrees(isOpen ? 180 : 0)).foregroundStyle(.tertiary)
                            }
                        }
                        .foregroundStyle(.primary)
                        if isOpen {
                            ProgressView(value: Double(stop.done), total: Double(stop.total)).tint(stop.complete ? .success : .brand)
                            HStack(spacing: 10) { Art(name: "oefenen/woorden", size: 36); Text("\(stop.total) kaartjes herhalen").font(.subheadline) }
                            HStack(alignment: .top, spacing: 10) {
                                Art(name: "themes/zinsbouw", size: 36)
                                VStack(alignment: .leading, spacing: 6) {
                                    ForEach(stop.lesson.grammarIds, id: \.self) { id in
                                        NavigationLink(value: PatternLink(id: id)) { Text(Content.shared.card(id)?.title ?? id).font(.subheadline.weight(.medium)) }
                                    }
                                }
                            }
                            HStack(alignment: .top, spacing: 10) { Art(name: "themes/spreken", size: 36); Text(stop.lesson.task).font(.subheadline) }
                            Button { PracticeSession.shared.start(label: "Halte \(stop.index + 1)", limit: 10, cardIds: stop.lesson.cardIds) } label: {
                                Text(stop.complete ? "Herhaal halte" : "Start halte \(stop.index + 1)")
                            }
                            .buttonStyle(GameButtonStyle())
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }

    @ViewBuilder private func marker(_ stop: Stats.Stop, current: Bool) -> some View {
        if current && !stop.complete {
            Mascot(mood: .wave, size: 44).overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Color.brand, lineWidth: 3))
        } else {
            ZStack {
                Circle().fill(stop.complete ? Color.success : Color(.secondarySystemBackground))
                if stop.complete { Image(systemName: "checkmark").font(.headline).foregroundStyle(.white) } else { Text("\(stop.index + 1)").font(.headline).foregroundStyle(.secondary) }
            }
            .frame(width: 44, height: 44)
        }
    }
}
