import Foundation
import Observation

/// Het nieuws van vandaag: one short Dutch news video a day, opened outside the app.
/// The button opens today's newest video, which nedfa.nl/api/v1/news looks up (server/news.mjs); `url` is the fallback.
/// The same list as the website (src/core/news.js) and the Android app.
struct NewsShow: Identifiable, Equatable {
    let id: String
    let title: String
    let short: String
    let detail: String
    let minutes: Int
    let url: URL

    static let all = [
        NewsShow(id: "makkelijk", title: "NOS Journaal in Makkelijke Taal", short: "Makkelijke Taal", detail: "Het nieuws, rustig verteld", minutes: 10,
                 url: URL(string: "https://www.youtube.com/c/NOSNieuwsvandeWeek/videos")!),
        NewsShow(id: "jeugd", title: "Jeugdjournaal", short: "Jeugdjournaal", detail: "Nieuws met veel beeld", minutes: 10,
                 url: URL(string: "https://www.youtube.com/@jeugdjournaal/videos")!),
        NewsShow(id: "nos", title: "NOS Journaal", short: "NOS Journaal", detail: "Het gewone journaal, in gewoon tempo", minutes: 20,
                 url: URL(string: "https://npo.nl/start/serie/nos-journaal-20-00-uur/afleveringen")!),
    ]

    /// Persian tip on the card: turn on Dutch subtitles and watch twice.
    static let tip = "زیرنویس هلندی را روشن کن و دو بار ببین."

    /// Makkelijke Taal up to A2 (and before the niveautest), Jeugdjournaal from B1.
    static func forLevel(_ level: String?) -> NewsShow { all.first { $0.id == (level == "B1" ? "jeugd" : "makkelijk") }! }
}

/// Today's news card on this phone: not opened, opened (did you watch it?) or watched. Resets every day.
@MainActor @Observable
final class NewsToday {
    enum State: String { case idle, asked, done }
    static let shared = NewsToday()

    private(set) var stored: State
    private(set) var day: String

    var state: State { day == Self.today() ? stored : .idle }

    private init() {
        let defaults = UserDefaults.standard
        day = defaults.string(forKey: "newsDay") ?? ""
        stored = State(rawValue: defaults.string(forKey: "newsState") ?? "") ?? .idle
    }

    func mark(_ state: State) {
        day = Self.today(); stored = state
        UserDefaults.standard.set(day, forKey: "newsDay")
        UserDefaults.standard.set(state.rawValue, forKey: "newsState")
    }

    func reset() {
        UserDefaults.standard.removeObject(forKey: "newsDay"); UserDefaults.standard.removeObject(forKey: "newsState")
        day = ""; stored = .idle
    }

    private static func today() -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: .now)
        return "\(parts.year ?? 0)-\(parts.month ?? 0)-\(parts.day ?? 0)"
    }
}


/// Today's newest video per show, from nedfa.nl (the server reads the channels' YouTube feeds).
@MainActor
enum NewsLinks {
    private static var urls: [String: URL] = [:]

    static func load() async {
        let request = URLRequest(url: URL(string: "https://nedfa.nl/api/v1/news")!, timeoutInterval: 4)
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let shows = json["shows"] as? [String: [String: Any]] else { return }
        urls = shows.compactMapValues { ($0["url"] as? String).flatMap(URL.init(string:)) }
    }

    /// The newest video of a show; without a connection the show's channel page.
    static func url(for show: NewsShow) async -> URL {
        if urls[show.id] == nil { await load() }
        return urls[show.id] ?? show.url
    }
}
