import SwiftUI
import UserNotifications

@main
struct NedfaApp: App {
    @State private var preferences = Preferences.shared
    @State private var cloud = Cloud.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if preferences.welcomeDone || cloud.user != nil {
                    RootView()
                } else {
                    WelcomeView()
                }
            }
            .tint(.brand)
            .preferredColorScheme(preferences.appearance == "light" ? .light : preferences.appearance == "dark" ? .dark : nil)
            .onOpenURL { cloud.handle($0) }
            .task { await cloud.start() }
            .alert("Let op", isPresented: Binding(get: { cloud.message != nil }, set: { if !$0 { cloud.message = nil } })) {
                Button("OK", role: .cancel) {}
            } message: { Text(cloud.message ?? "") }
        }
    }
}

/// Four tabs, like every iPhone app: Oefenen (start), Leren, Spellen, Ik.
struct RootView: View {
    enum Tab: Hashable { case oefenen, leren, spellen, ik }
    @State private var tab: Tab = .oefenen
    @State private var session = PracticeSession.shared

    var body: some View {
        TabView(selection: $tab) {
            OefenenView().tabItem { Label("Oefenen", systemImage: "bolt.fill") }.tag(Tab.oefenen)
            LerenView().tabItem { Label("Leren", systemImage: "book.fill") }.tag(Tab.leren)
            SpellenView().tabItem { Label("Spellen", systemImage: "gamecontroller.fill") }.tag(Tab.spellen)
            IkView().tabItem { Label("Ik", systemImage: "person.fill") }.tag(Tab.ik)
        }
        // A round opens over the screen you started it from; closing it brings you back there.
        .fullScreenCover(item: $session.round) { round in
            RoundView(round: round)
        }
        .fullScreenCover(item: $session.game) { game in
            GameFlow(game: game)
        }
    }
}

/// Starts practice rounds and games from any screen.
@MainActor @Observable
final class PracticeSession {
    static let shared = PracticeSession()
    var round: Round?
    var game: GameLaunch?

    func start(_ cards: [Card], label: String, drill: Bool = false) {
        guard !cards.isEmpty else { return }
        Haptics.tap()
        game = nil
        round = Round(cards: cards, label: label, drill: drill)
    }

    func start(theme: String = "all", kind: Planner.Kind = .all, label: String, limit: Int = 20, cardIds: [String]? = nil) {
        start(Planner.plan(reviews: Learner.shared.reviews, theme: theme, kind: kind, limit: limit, cardIds: cardIds), label: label)
    }

    func play(_ id: GameID, theme: String = "all") {
        Haptics.tap()
        round = nil
        game = GameLaunch(id: id, theme: theme)
    }
}

/// Daily reminder at a chosen hour, planned on the iPhone itself.
enum Reminder {
    static func set(hour: Int?) async -> Bool {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["daily"])
        guard let hour else { return true }
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        guard granted else { return false }
        let content = UNMutableNotificationContent()
        content.title = "Even oefenen?"
        content.body = "Vijf kaartjes houden je reeks vast."
        content.sound = .default
        let trigger = UNCalendarNotificationTrigger(dateMatching: DateComponents(hour: hour), repeats: true)
        try? await center.add(UNNotificationRequest(identifier: "daily", content: content, trigger: trigger))
        return true
    }
}
