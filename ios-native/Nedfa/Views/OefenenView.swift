import SwiftUI

/// Vandaag: today's round as the hero, your place on the path, missions and focused practice.
struct OefenenView: View {
    @State private var progress = Learner.shared
    @State private var preferences = Preferences.shared
    @State private var cloud = Cloud.shared
    @State private var theme = "all"
    @State private var showSignIn = false
    @State private var stop: Stats.Stop?
    private let session = PracticeSession.shared

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        let goal = preferences.goal
        let resumeId = Stats.resumeTheme(events: progress.events)
        let roundSize = min(20, max(5, goal - stats.today))
        let daily = Planner.plan(reviews: progress.reviews, theme: stats.due > 0 ? "all" : resumeId, limit: stats.due > 0 ? 20 : roundSize)

        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    header(stats)
                    DailyCard(today: stats.today, goal: goal, count: daily.count) { session.start(daily, label: "Dagrondje") }
                        .padding(.horizontal, 20)

                    if cloud.user == nil, cloud.status != .unavailable, cloud.status != .starting {
                        Button { showSignIn = true } label: {
                            HStack(spacing: 12) {
                                Mascot(mood: .think, size: 44)
                                Text("Log in en ga ook op de website verder.").font(.subheadline.weight(.medium)).foregroundStyle(Color.primary).multilineTextAlignment(.leading)
                                Spacer(minLength: 0)
                                Text("Inloggen").font(.subheadline.weight(.bold)).foregroundStyle(Color.brand)
                            }
                            .card(padding: 12, radius: 22)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20)
                    }

                    PathStrip(stats: stats) { stop = $0 }
                    missions(stats)
                    focused
                    if let resume = Content.shared.theme(resumeId) {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionTitle("Verder met")
                            NavigationLink(value: resume) {
                                HStack(spacing: 14) {
                                    Art(name: "themes/\(resume.id)", size: 64)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(resume.title).font(.game(18, .heavy)).foregroundStyle(Color.primary)
                                        if let item = stats.progress(for: resume.id) {
                                            ThickProgress(value: Double(item.done) / Double(max(1, item.total)), color: .brand, height: 10)
                                            Text("\(item.done) van \(item.total) geoefend").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                                        }
                                    }
                                    Image(systemName: "chevron.right").font(.footnote.weight(.bold)).foregroundStyle(.tertiary)
                                }
                                .padding(12)
                            }
                            .buttonStyle(PressableTile())
                            .padding(.horizontal, 20)
                        }
                    }
                }
                .padding(.bottom, 30)
            }
            .feedbackScreen("Vandaag")
            .statusBarScrim()
            .gameBackground()
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Theme.self) { ThemeDetailView(theme: $0) }
            .sheet(isPresented: $showSignIn) { SignInSheet() }
            .sheet(item: $stop) { StopSheet(stop: $0) }
        }
    }

    private func header(_ stats: Stats) -> some View {
        HStack(spacing: 10) {
            LevelRing(number: stats.level.number, progress: stats.level.progress)
            VStack(alignment: .leading, spacing: 0) {
                Eyebrow("Niveau \(stats.level.number)")
                Text(stats.level.name).font(.game(17, .black))
            }
            Spacer()
            StatChip(systemImage: "flame.fill", value: "\(stats.streak.count)", color: .brand)
                .accessibilityLabel("Reeks van \(stats.streak.count) dagen")
            StatChip(systemImage: "star.fill", value: stats.xp.formatted(), color: .goldInk)
                .accessibilityLabel("\(stats.xp) XP")
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    private func missions(_ stats: Stats) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle("Missies van vandaag")
            VStack(spacing: 0) {
                ForEach(Array(stats.missions.enumerated()), id: \.element.id) { index, mission in
                    HStack(spacing: 12) {
                        Art(name: mission.picture, size: 44, corner: 12)
                        VStack(alignment: .leading, spacing: 6) {
                            Text(mission.title).font(.subheadline.weight(.semibold))
                            ThickProgress(value: Double(mission.count) / Double(max(1, mission.target)), color: mission.done ? .mint : .brand, height: 8)
                        }
                        if mission.done {
                            Image(systemName: "checkmark.circle.fill").font(.title3).foregroundStyle(Color.mint)
                        } else {
                            Text("\(min(mission.count, mission.target))/\(mission.target)").font(.game(15, .heavy)).foregroundStyle(.secondary).monospacedDigit()
                        }
                    }
                    .padding(.vertical, 10)
                    if index < stats.missions.count - 1 { Divider() }
                }
            }
            .card(padding: 14)
            .padding(.horizontal, 20)
        }
    }

    private var focused: some View {
        let themeTitle = Content.shared.theme(theme)?.title
        let mistakes = Content.shared.cards.filter { card in
            guard let review = progress.reviews[card.id], review.grade < 3 else { return false }
            return theme == "all" || card.themeId == theme
        }.sorted { progress.reviews[$0.id]!.lastReviewed > progress.reviews[$1.id]!.lastReviewed }.prefix(20)
        let items: [(String, String, Int, () -> Void)] = [
            ("Woorden", "oefenen/woorden", Planner.plan(reviews: progress.reviews, theme: theme, kind: .woorden).count, { session.start(theme: theme, kind: .woorden, label: themeTitle.map { "\($0) · woorden" } ?? "Woorden") }),
            ("Handige zinnen", "oefenen/zinnen", Planner.plan(reviews: progress.reviews, theme: theme, kind: .praktisch).count, { session.start(theme: theme, kind: .praktisch, label: themeTitle.map { "\($0) · zinnen" } ?? "Handige zinnen") }),
            ("Zinsbouw", "themes/zinsbouw", Planner.plan(reviews: progress.reviews, theme: "zinsbouw", kind: .zinnen).count, { session.start(theme: "zinsbouw", kind: .zinnen, label: "Zinsbouw") }),
            ("Mijn fouten", "oefenen/fouten", mistakes.count, { session.start(Array(mistakes), label: "Mijn fouten") }),
        ]
        return VStack(alignment: .leading, spacing: 12) {
            SectionTitle("Gericht oefenen") {
                Menu {
                    Picker("Thema", selection: $theme) {
                        Text("Alle thema’s").tag("all")
                        ForEach(Content.shared.themes) { Text($0.title).tag($0.id) }
                    }
                } label: {
                    HStack(spacing: 4) { Text(themeTitle ?? "Alle thema’s").lineLimit(1); Image(systemName: "chevron.down").font(.caption2.weight(.bold)) }
                        .font(.subheadline.weight(.semibold)).foregroundStyle(Color.brand)
                }
            }
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 14) {
                ForEach(items, id: \.0) { title, picture, count, action in
                    Button(action: action) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(alignment: .top) {
                                Art(name: picture, size: 56)
                                Spacer()
                                Text(count > 0 ? "\(count)" : "–").font(.game(18, .black)).foregroundStyle(count > 0 ? Color.brand : .secondary).monospacedDigit()
                            }
                            Text(title).font(.game(17, .heavy)).foregroundStyle(Color.primary).lineLimit(1)
                        }
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(PressableTile())
                    .disabled(count == 0)
                    .opacity(count == 0 ? 0.55 : 1)
                }
            }
            .padding(.horizontal, 20)
        }
    }
}

/// The navy hero card: today's goal as segments, the mascot, and one big button.
struct DailyCard: View {
    let today: Int
    let goal: Int
    let count: Int
    let start: () -> Void

    var body: some View {
        let reached = today >= goal
        let left = max(0, goal - today)
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    Eyebrow(reached ? "Dagdoel gehaald" : "Dagrondje", color: .butter)
                    Text(reached ? "Top! Nog een\nrondje?" : count == 0 ? "Alles is\nherhaald" : left == 1 ? "Nog 1 kaartje\ntot je doel" : "Nog \(left) kaartjes\ntot je doel")
                        .font(.game(28, .black)).foregroundStyle(.white).fixedSize(horizontal: false, vertical: true)
                    SegmentBar(done: min(today, goal), total: min(goal, 10) == goal ? goal : 10, on: .mint)
                        .frame(maxWidth: 170)
                        .padding(.top, 6)
                }
                Spacer(minLength: 0)
                HeroMascot(mood: reached ? .cheer : count > 0 ? .wave : .sleep, size: 108)
            }
            Button(action: start) {
                HStack(spacing: 10) { Text(reached ? "Nog een rondje" : today > 0 ? "Speel verder" : "Start"); Image(systemName: "play.fill") }
            }
            .buttonStyle(GameButtonStyle())
            .disabled(count == 0)
        }
        .padding(20)
        .background(
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color.navy)
                Circle().fill(.white.opacity(0.06)).frame(width: 200).offset(x: 40, y: -60)
            }
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        )
        .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color.navy).shadow(color: Color.navy.opacity(0.3), radius: 16, y: 8))
    }
}

/// Three stops around where you are on the path: done, now, next.
struct PathStrip: View {
    let stats: Stats
    let open: (Stats.Stop) -> Void
    var body: some View {
        let current = stats.currentStop
        let range = max(0, current - 1)...min(stats.stops.count - 1, max(0, current - 1) + 2)
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle("Jouw pad") { Text("Halte \(current + 1) van \(stats.stops.count)").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary) }
            HStack(spacing: 12) {
                ForEach(stats.stops[range]) { stop in
                    let isCurrent = stop.index == current
                    let locked = stop.index > current
                    Button { open(stop) } label: {
                        VStack(spacing: 6) {
                            ZStack {
                                if locked {
                                    RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.track).frame(height: 84)
                                    Image(systemName: "lock.fill").font(.title2).foregroundStyle(.secondary)
                                } else {
                                    Art(name: "themes/\(stop.lesson.themeIds.first ?? "route")", size: 84, corner: 18)
                                }
                            }
                            Text(stop.lesson.title).font(.game(13, .heavy)).foregroundStyle(locked ? .secondary : .primary).lineLimit(2, reservesSpace: true).multilineTextAlignment(.center).frame(height: 34)
                            if stop.complete {
                                StarsView(count: 3)
                            } else if isCurrent {
                                Text("NU · \(stop.done)/\(stop.total)").font(.caption2.weight(.heavy)).foregroundStyle(Color.brand)
                            } else {
                                Text("Halte \(stop.index + 1)").font(.caption2.weight(.semibold)).foregroundStyle(.secondary)
                            }
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(isCurrent ? Color.brand : .clear, lineWidth: 3))
                    }
                    .buttonStyle(PressableTile(edge: isCurrent ? .brandEdge : .edge))
                    .opacity(locked ? 0.7 : 1)
                }
            }
            .padding(.horizontal, 20)
        }
    }
}

/// A stop of the route: what it practises and a button to start it.
struct StopSheet: View {
    let stop: Stats.Stop
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        FittedSheet {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 14) {
                    Art(name: "themes/\(stop.lesson.themeIds.first ?? "route")", size: 76)
                    VStack(alignment: .leading, spacing: 4) {
                        Eyebrow("Halte \(stop.index + 1) · \(stop.lesson.level)", color: .brand)
                        Text(stop.lesson.title).font(.game(24, .black))
                    }
                }
                ThickProgress(value: Double(stop.done) / Double(max(1, stop.total)), color: stop.complete ? .mint : .brand)
                Text("\(stop.done) van \(stop.total) kaartjes geoefend").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                if !stop.lesson.goal.isEmpty { Text(stop.lesson.goal).font(.body) }
                if !stop.lesson.task.isEmpty {
                    Label(stop.lesson.task, systemImage: "target").font(.subheadline).foregroundStyle(.secondary)
                }
                Button {
                    dismiss()
                    PracticeSession.shared.start(label: "Halte \(stop.index + 1)", limit: 10, cardIds: stop.lesson.cardIds)
                } label: { HStack { Text(stop.complete ? "Herhaal deze halte" : "Start halte \(stop.index + 1)"); Image(systemName: "play.fill") } }
                .buttonStyle(GameButtonStyle())
            }
            .padding(24)
        }
    }
}

struct TrailingIcon: LabelStyle {
    func makeBody(configuration: Configuration) -> some View { HStack(spacing: 8) { configuration.title; configuration.icon } }
}
