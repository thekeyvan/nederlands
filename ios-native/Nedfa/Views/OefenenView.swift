import SwiftUI

/// The start screen: today's mixed round, then one list of focused rounds.
struct OefenenView: View {
    @State private var progress = Learner.shared
    @State private var preferences = Preferences.shared
    @State private var cloud = Cloud.shared
    @State private var theme = "all"
    @State private var showSignIn = false
    private let session = PracticeSession.shared

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        let goal = preferences.goal
        let resumeId = Stats.resumeTheme(events: progress.events)
        let roundSize = min(20, max(5, goal - stats.today))
        let daily = Planner.plan(reviews: progress.reviews, theme: stats.due > 0 ? "all" : resumeId, limit: stats.due > 0 ? 20 : roundSize)
        let mistakes = Content.shared.cards.filter { card in
            guard let review = progress.reviews[card.id], review.grade < 3 else { return false }
            return theme == "all" || card.themeId == theme
        }.sorted { progress.reviews[$0.id]!.lastReviewed > progress.reviews[$1.id]!.lastReviewed }.prefix(20)
        let themeTitle = Content.shared.theme(theme)?.title

        NavigationStack {
            List {
                Section {
                    DailyCard(today: stats.today, goal: goal, count: daily.count) {
                        session.start(daily, label: "Dagrondje")
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }

                if cloud.user == nil, cloud.status != .unavailable, cloud.status != .starting {
                    Section {
                        Button { showSignIn = true } label: {
                            HStack(spacing: 12) {
                                Mascot(mood: .think, size: 44)
                                Text("Log in en ga ook op de website verder.").font(.subheadline.weight(.medium)).foregroundStyle(Color.primary)
                                Spacer()
                                Text("Inloggen").font(.subheadline.weight(.semibold))
                            }
                        }
                    }
                }

                Section {
                    focusedRow("Woorden", picture: "oefenen/woorden", count: Planner.plan(reviews: progress.reviews, theme: theme, kind: .woorden).count) {
                        session.start(theme: theme, kind: .woorden, label: themeTitle.map { "\($0) · woorden" } ?? "Woorden")
                    }
                    focusedRow("Handige zinnen", picture: "oefenen/zinnen", count: Planner.plan(reviews: progress.reviews, theme: theme, kind: .praktisch).count) {
                        session.start(theme: theme, kind: .praktisch, label: themeTitle.map { "\($0) · zinnen" } ?? "Handige zinnen")
                    }
                    focusedRow("Zinsbouw", picture: "themes/zinsbouw", count: Planner.plan(reviews: progress.reviews, theme: "zinsbouw", kind: .zinnen).count) {
                        session.start(theme: "zinsbouw", kind: .zinnen, label: "Zinsbouw")
                    }
                    focusedRow("Mijn fouten", picture: "oefenen/fouten", count: mistakes.count) {
                        session.start(Array(mistakes), label: "Mijn fouten")
                    }
                } header: {
                    HStack {
                        Text("Gericht oefenen")
                        Spacer()
                        Menu {
                            Picker("Thema", selection: $theme) {
                                Text("Alle thema’s").tag("all")
                                ForEach(Content.shared.themes) { Text($0.title).tag($0.id) }
                            }
                        } label: {
                            HStack(spacing: 4) { Text(themeTitle ?? "Alle thema’s").lineLimit(1); Image(systemName: "chevron.down").font(.caption2) }
                                .font(.footnote.weight(.semibold)).textCase(nil)
                        }
                    }
                }

                Section("Verder met") {
                    if let resume = Content.shared.theme(resumeId) {
                        NavigationLink(value: resume) {
                            PictureRow(picture: "themes/\(resume.id)", title: resume.title, detail: stats.progress(for: resume.id).map { "\($0.done) van \($0.total) geoefend" })
                        }
                    }
                    let stop = stats.stops[stats.currentStop]
                    NavigationLink(value: RouteLink()) {
                        PictureRow(picture: "themes/route", title: "Halte \(stats.currentStop + 1): \(stop.lesson.title)", detail: "Route · \(stop.done) van \(stop.total) geoefend")
                    }
                }
            }
            .navigationTitle("Oefenen")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Label("\(stats.streak.count)", systemImage: "flame.fill").labelStyle(.titleAndIcon).font(.subheadline.weight(.bold)).foregroundStyle(Color.brand)
                        .accessibilityLabel("Reeks van \(stats.streak.count) dagen")
                }
            }
            .navigationDestination(for: Theme.self) { ThemeDetailView(theme: $0) }
            .navigationDestination(for: RouteLink.self) { _ in RouteView() }
            .sheet(isPresented: $showSignIn) { SignInSheet() }
        }
    }

    private func focusedRow(_ title: String, picture: String, count: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                PictureRow(picture: picture, title: title)
                Spacer()
                Text(count > 0 ? "\(count)" : "–").font(.body.weight(.semibold)).foregroundStyle(Color.brand).monospacedDigit()
                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
            }
        }
        .foregroundStyle(.primary)
        .disabled(count == 0)
        .opacity(count == 0 ? 0.5 : 1)
    }
}

struct RouteLink: Hashable {}

/// The navy card with the daily goal ring, the mascot and the Start button.
struct DailyCard: View {
    let today: Int
    let goal: Int
    let count: Int
    let start: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                ZStack {
                    Circle().stroke(.white.opacity(0.15), lineWidth: 8)
                    Circle().trim(from: 0, to: min(1, Double(today) / Double(goal))).stroke(Color.brand, style: StrokeStyle(lineWidth: 8, lineCap: .round)).rotationEffect(.degrees(-90))
                    Text("\(min(today, goal))/\(goal)").font(.headline.weight(.heavy)).monospacedDigit()
                }
                .frame(width: 72, height: 72)
                VStack(alignment: .leading, spacing: 2) {
                    Text(today >= goal ? "Dagdoel gehaald" : "Dagrondje").font(.title3.weight(.bold))
                    Text(count > 0 ? "\(count) kaartjes · ± \(max(2, Int((Double(count) * 0.4).rounded()))) min" : "Alles is herhaald").font(.subheadline).opacity(0.75)
                }
                Spacer(minLength: 0)
                Mascot(mood: today >= goal ? .cheer : count > 0 ? .wave : .sleep, size: 68)
            }
            Button(action: start) { Label(today >= goal ? "Nog een rondje" : "Start", systemImage: "arrow.right").labelStyle(TrailingIcon()) }
                .buttonStyle(GameButtonStyle())
                .disabled(count == 0)
        }
        .padding(18)
        .foregroundStyle(.white)
        .background(Color.navy, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

struct TrailingIcon: LabelStyle {
    func makeBody(configuration: Configuration) -> some View { HStack(spacing: 8) { configuration.title; configuration.icon } }
}
