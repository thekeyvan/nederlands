import UIKit

/// Anonymous usage statistics, sent to the same Umami as the website (https://nedfa.nl/stats, see docs/ANALYTICS.md).
/// No account id, no device id, nothing the learner typed: only which screen was opened and a few named moments.
/// Off in debug builds and when the learner turns it off in Instellingen.
@MainActor
final class Analytics {
    static let shared = Analytics()
    private static let website = "0cbc91c6-7ae2-4c9a-9851-d005214361fa"
    private static let endpoint = URL(string: "https://nedfa.nl/stats/api/send")!
    private static let offKey = "nedfa.stats.off"
    private var cache: String?
    private var lastPath = "/ios"

    var enabled: Bool {
        get { !UserDefaults.standard.bool(forKey: Self.offKey) }
        set { UserDefaults.standard.set(!newValue, forKey: Self.offKey) }
    }

    /// A screen, named as in feedback reports ("Oefenen", "Thema: Werk"); counted once until another screen opens.
    func screen(_ name: String) {
        let path = "/ios/" + Self.slug(name)
        guard path != lastPath else { return }
        lastPath = path
        send(["url": path, "title": name])
    }

    /// A named moment, such as a finished round. Never pass anything the learner typed.
    func event(_ name: String, _ data: [String: Any] = [:]) {
        var payload: [String: Any] = ["url": lastPath, "name": name]
        if !data.isEmpty { payload["data"] = data }
        send(payload)
    }

    private func send(_ extra: [String: Any]) {
        #if DEBUG
        return
        #else
        guard enabled else { return }
        let size = (UIApplication.shared.connectedScenes.first as? UIWindowScene)?.screen.bounds.size ?? .zero
        var payload: [String: Any] = [
            "website": Self.website, "hostname": "nedfa.nl", "referrer": "",
            "language": Locale.preferredLanguages.first ?? "nl", "screen": "\(Int(size.width))x\(Int(size.height))",
        ]
        payload.merge(extra) { _, new in new }
        guard let body = try? JSONSerialization.data(withJSONObject: ["type": "event", "payload": payload]) else { return }
        var request = URLRequest(url: Self.endpoint, timeoutInterval: 10)
        request.httpMethod = "POST"
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // A browser-style agent, so the statistics show "iOS, mobile" instead of an unknown client.
        let os = UIDevice.current.systemVersion.replacingOccurrences(of: ".", with: "_")
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS \(os) like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nedfa/\(Feedback.appVersion.split(separator: " ").first ?? "")", forHTTPHeaderField: "User-Agent")
        if let cache { request.setValue(cache, forHTTPHeaderField: "x-umami-cache") }
        Task {
            guard let (data, _) = try? await URLSession.shared.data(for: request),
                  let reply = try? JSONSerialization.jsonObject(with: data) as? [String: Any], let token = reply["cache"] as? String else { return }
            cache = token
        }
        #endif
    }

    /// "Thema: Werk & geld" → "thema-werk-geld".
    private static func slug(_ name: String) -> String {
        let folded = name.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "nl")).lowercased()
        return folded.split { !$0.isLetter && !$0.isNumber }.joined(separator: "-")
    }
}
