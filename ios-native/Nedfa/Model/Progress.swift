import Foundation
import Observation

/// Your reviews and review history, saved on this device per account (or as a guest) and synced by `Cloud`.
@MainActor @Observable
final class Learner {
    static let shared = Learner()

    private(set) var reviews: [String: Review] = [:]
    private(set) var events: [ReviewEvent] = []
    private(set) var identity = "guest"
    /// Called after every review, so `Cloud` can save it online.
    @ObservationIgnored var onChange: (() -> Void)?

    private struct Saved: Codable { var reviews: [String: Review]; var events: [ReviewEvent] }
    private static let encoder: JSONEncoder = { let e = JSONEncoder(); e.dateEncodingStrategy = .iso8601; return e }()
    private static let decoder: JSONDecoder = { let d = JSONDecoder(); d.dateDecodingStrategy = .iso8601; return d }()

    private init() { load("guest") }

    private func file(_ id: String) -> URL {
        let folder = URL.applicationSupportDirectory.appending(path: "progress", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appending(path: "\(id).json")
    }

    private func load(_ id: String) {
        identity = id
        let valid = Set(Content.shared.cards.map(\.id))
        guard let data = try? Data(contentsOf: file(id)), let saved = try? Self.decoder.decode(Saved.self, from: data) else {
            reviews = [:]; events = []; return
        }
        reviews = saved.reviews.filter { valid.contains($0.key) }
        events = Array(saved.events.filter { valid.contains($0.cardId) }.suffix(2000))
    }

    private func save() {
        if let data = try? Self.encoder.encode(Saved(reviews: reviews, events: events)) { try? data.write(to: file(identity), options: .atomic) }
    }

    func review(_ cardId: String, grade: Int) {
        let now = Date.now
        reviews[cardId] = SRS.schedule(reviews[cardId], grade: grade, now: now)
        events.append(ReviewEvent(id: UUID().uuidString.lowercased(), cardId: cardId, grade: grade, at: now))
        events = Array(events.suffix(2000))
        save()
        onChange?()
    }

    /// Signing in: switch to the account's progress and bring along what was practised as a guest.
    func switchUser(_ id: String?) {
        let next = id ?? "guest"
        guard next != identity else { return }
        let guest = identity == "guest" ? (reviews, events) : nil
        load(next)
        if id != nil, let guest { merge(reviews: guest.0, events: guest.1) } else { save() }
    }

    func merge(reviews remote: [String: Review], events remoteEvents: [ReviewEvent]) {
        let valid = Set(Content.shared.cards.map(\.id))
        for (id, review) in remote where valid.contains(id) {
            if let local = reviews[id], local.lastReviewed >= review.lastReviewed { continue }
            reviews[id] = review
        }
        var byId = Dictionary(events.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        for event in remoteEvents where valid.contains(event.cardId) { byId[event.id] = event }
        events = Array(byId.values.sorted { $0.at < $1.at }.suffix(2000))
        save()
    }

    func clearGuest() { try? FileManager.default.removeItem(at: file("guest")) }

    /// Removes everything on this device.
    func forgetDevice() {
        try? FileManager.default.removeItem(at: URL.applicationSupportDirectory.appending(path: "progress"))
        identity = "guest"; reviews = [:]; events = []
    }
}

/// Settings that follow you between devices (daily goal) and ones that stay on this phone (voice, look).
@MainActor @Observable
final class Preferences {
    static let shared = Preferences()
    static let goals = [5, 10, 20]

    var goal: Int { didSet { UserDefaults.standard.set(goal, forKey: "goal"); updatedAt = .now } }
    var voice: String { didSet { UserDefaults.standard.set(voice, forKey: "voice") } }
    var speed: Double { didSet { UserDefaults.standard.set(speed, forKey: "speed") } }
    var appearance: String { didSet { UserDefaults.standard.set(appearance, forKey: "appearance") } }
    var reminderHour: Int? { didSet { UserDefaults.standard.set(reminderHour ?? -1, forKey: "reminderHour") } }
    var welcomeDone: Bool { didSet { UserDefaults.standard.set(welcomeDone, forKey: "welcomeDone") } }
    var records: [String: Int] { didSet { UserDefaults.standard.set(records, forKey: "records") } }
    var played: [String: Int] { didSet { UserDefaults.standard.set(played, forKey: "played") } }
    var updatedAt: Date? { didSet { UserDefaults.standard.set(updatedAt, forKey: "preferencesUpdated") } }

    private init() {
        let defaults = UserDefaults.standard
        let stored = defaults.integer(forKey: "goal")
        goal = Self.goals.contains(stored) ? stored : 5
        voice = defaults.string(forKey: "voice") ?? "ronnie"
        speed = defaults.object(forKey: "speed") as? Double ?? 1
        appearance = defaults.string(forKey: "appearance") ?? "system"
        let hour = defaults.object(forKey: "reminderHour") as? Int ?? -1
        reminderHour = hour >= 0 ? hour : nil
        welcomeDone = defaults.bool(forKey: "welcomeDone")
        records = defaults.dictionary(forKey: "records") as? [String: Int] ?? [:]
        played = defaults.dictionary(forKey: "played") as? [String: Int] ?? [:]
        updatedAt = defaults.object(forKey: "preferencesUpdated") as? Date
    }

    /// Saves a game score; returns the previous best.
    func record(game: String, score: Int) -> Int {
        let previous = records[game] ?? 0
        records[game] = max(previous, score)
        played[game, default: 0] += 1
        return previous
    }

    func reset() {
        for key in ["goal", "voice", "speed", "appearance", "reminderHour", "welcomeDone", "records", "played", "preferencesUpdated"] { UserDefaults.standard.removeObject(forKey: key) }
        goal = 5; voice = "ronnie"; speed = 1; appearance = "system"; reminderHour = nil; welcomeDone = false; records = [:]; played = [:]; updatedAt = nil
    }
}
