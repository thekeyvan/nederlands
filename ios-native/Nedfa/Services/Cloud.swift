import AuthenticationServices
import CryptoKit
import Foundation
import Observation
import Supabase

/// Sign in with Apple or Google (Supabase), and keep progress in step with the website.
/// Uses the same tables and `sync_learning` function as nedfa.nl, so one account works everywhere.
@MainActor @Observable
final class Cloud {
    static let shared = Cloud()

    enum Status: Equatable { case starting, guest, syncing, saved, retry, unavailable }
    struct User: Equatable { let id: String; let name: String; let email: String; let provider: String }

    private(set) var status: Status = .starting
    private(set) var user: User?
    var message: String?

    @ObservationIgnored private var client: SupabaseClient?
    @ObservationIgnored private var working = false
    @ObservationIgnored private var rerun = false
    @ObservationIgnored private var pending: Task<Void, Never>?
    private static let callback = URL(string: "com.keyvanmahmoudi.nederlands://auth")!

    private init() {
        struct Config: Decodable { let supabaseUrl: String; let supabaseKey: String }
        guard let url = Bundle.main.url(forResource: "config", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let config = try? JSONDecoder().decode(Config.self, from: data),
              let base = URL(string: config.supabaseUrl) else { status = .unavailable; return }
        client = SupabaseClient(supabaseURL: base, supabaseKey: config.supabaseKey,
                                options: .init(auth: .init(redirectToURL: Self.callback, flowType: .pkce, emitLocalSessionAsInitialSession: true)))
        Learner.shared.onChange = { [weak self] in self?.scheduleSync() }
    }

    func start() async {
        guard let client else { return }
        if let session = try? await client.auth.session { await setSession(session) } else { status = .guest }
        Task {
            for await (event, session) in client.auth.authStateChanges where event == .signedIn || event == .signedOut {
                await setSession(session)
            }
        }
    }

    // MARK: Sign in

    private var nonce = ""
    func appleRequest(_ request: ASAuthorizationAppleIDRequest) {
        nonce = UUID().uuidString + UUID().uuidString
        request.requestedScopes = [.fullName, .email]
        request.nonce = SHA256.hash(data: Data(nonce.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    func appleCompletion(_ result: Result<ASAuthorization, Error>) async {
        guard let client else { return }
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken, let token = String(data: tokenData, encoding: .utf8) else {
                message = "Inloggen met Apple lukt nu niet. Probeer het later opnieuw."; return
            }
            do {
                let session = try await client.auth.signInWithIdToken(credentials: .init(provider: .apple, idToken: token, nonce: nonce))
                // Apple shares the name only the first time; keep it on the account.
                let name = [credential.fullName?.givenName, credential.fullName?.familyName].compactMap { $0 }.joined(separator: " ")
                if !name.isEmpty, session.user.userMetadata["full_name"] == nil {
                    _ = try? await client.auth.update(user: UserAttributes(data: ["full_name": .string(name)]))
                }
            } catch {
                message = "Inloggen met Apple lukt nu niet. Probeer het later opnieuw."
            }
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code != .canceled { message = "Inloggen met Apple lukt nu niet. Probeer het later opnieuw." }
        }
    }

    func signInWithGoogle() async {
        guard let client else { return }
        do {
            _ = try await client.auth.signInWithOAuth(provider: .google, redirectTo: Self.callback, queryParams: [(name: "prompt", value: "select_account")]) { session in
                session.prefersEphemeralWebBrowserSession = false
            }
        } catch {
            if (error as? ASWebAuthenticationSessionError)?.code != .canceledLogin { message = "Google-inloggen is niet afgerond. Je kunt het opnieuw proberen." }
        }
    }

    func handle(_ url: URL) { client?.auth.handle(url) }

    func signOut() async {
        guard let client, user != nil else { return }
        await sync()
        try? await client.auth.signOut(scope: .local)
        await setSession(nil)
    }

    /// Deletes the account and everything saved with it, online and on this device.
    func deleteAccount() async -> Bool {
        if let client, user != nil {
            do { try await client.rpc("delete_my_account").execute() } catch {
                message = "Je account kon niet worden verwijderd. Controleer je verbinding en probeer het opnieuw."; return false
            }
            try? await client.auth.signOut(scope: .local)
        }
        Learner.shared.forgetDevice()
        Preferences.shared.reset()
        user = nil
        status = client == nil ? .unavailable : .guest
        return true
    }

    // MARK: Sync

    private func setSession(_ session: Session?) async {
        let next = session?.user
        if next?.id.uuidString.lowercased() == user?.id, Learner.shared.identity == (user?.id ?? "guest") {
            if status == .starting { status = next == nil ? .guest : .saved }
            return
        }
        if let next {
            let meta = next.userMetadata
            let name = meta["full_name"]?.stringValue ?? meta["name"]?.stringValue ?? next.email?.components(separatedBy: "@").first ?? ""
            user = User(id: next.id.uuidString.lowercased(), name: name, email: next.email ?? "", provider: next.appMetadata["provider"]?.stringValue ?? "")
        } else {
            user = nil
        }
        Learner.shared.switchUser(user?.id)
        guard user != nil else { status = .guest; return }
        status = .syncing
        do { try await load() } catch { status = .retry; return }
        await sync()
    }

    private struct CardRow: Decodable {
        let card_id: String; let ease: Double; let interval_days: Int; let repetitions: Int
        let due: Date; let last_reviewed: Date; let grade: Int; let reviews: Int
    }
    private struct EventRow: Decodable { let id: String; let card_id: String; let grade: Int; let reviewed_at: Date }
    private struct PreferenceRow: Codable { let data: [String: AnyJSON]; let updated_at: Date? }

    private func load() async throws {
        guard let client else { return }
        let cards: [CardRow] = try await client.from("review_cards").select().limit(1000).execute().value
        let events: [EventRow] = try await client.from("review_events").select("id,card_id,grade,reviewed_at").order("reviewed_at", ascending: false).limit(2000).execute().value
        let prefs: [PreferenceRow] = try await client.from("learning_preferences").select("data,updated_at").execute().value
        Learner.shared.merge(
            reviews: Dictionary(cards.map { ($0.card_id, Review(ease: $0.ease, interval: $0.interval_days, repetitions: $0.repetitions, due: $0.due, lastReviewed: $0.last_reviewed, grade: $0.grade, reviews: $0.reviews)) }, uniquingKeysWith: { a, _ in a }),
            events: events.map { ReviewEvent(id: $0.id, cardId: $0.card_id, grade: $0.grade, at: $0.reviewed_at) })
        if let remote = prefs.first, let goal = remote.data["goal"]?.intValue, Preferences.goals.contains(goal) {
            let local = Preferences.shared.updatedAt
            if local == nil || (remote.updated_at ?? .distantPast) > local! { Preferences.shared.goal = goal; Preferences.shared.updatedAt = remote.updated_at }
        }
        remotePreferences = prefs.first?.data ?? [:]
    }

    @ObservationIgnored private var remotePreferences: [String: AnyJSON] = [:]

    private func scheduleSync() {
        pending?.cancel()
        pending = Task { try? await Task.sleep(for: .seconds(2)); if !Task.isCancelled { await sync() } }
    }

    private struct Payload: Encodable {
        struct CardItem: Encodable { let id: String; let ease: Double; let interval: Int; let repetitions: Int; let due: String; let lastReviewed: String; let grade: Int; let reviews: Int }
        struct EventItem: Encodable { let id: String; let cardId: String; let grade: Int; let at: String }
        let cards: [CardItem]
        let events: [EventItem]
    }

    func sync() async {
        guard let client, let user else { return }
        if working { rerun = true; return }
        working = true
        status = .syncing
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let progress = Learner.shared
        let payload = Payload(
            cards: progress.reviews.map { .init(id: $0.key, ease: $0.value.ease, interval: $0.value.interval, repetitions: $0.value.repetitions, due: iso.string(from: $0.value.due), lastReviewed: iso.string(from: $0.value.lastReviewed), grade: $0.value.grade, reviews: $0.value.reviews) },
            events: progress.events.map { .init(id: $0.id, cardId: $0.cardId, grade: $0.grade, at: iso.string(from: $0.at)) })
        do {
            try await client.rpc("sync_learning", params: ["payload": payload]).execute()
            if let updated = Preferences.shared.updatedAt {
                var data = remotePreferences
                data["goal"] = .integer(Preferences.shared.goal)
                struct Upsert: Encodable { let user_id: String; let data: [String: AnyJSON]; let updated_at: String }
                try await client.from("learning_preferences").upsert(Upsert(user_id: user.id, data: data, updated_at: iso.string(from: updated))).execute()
            }
            progress.clearGuest()
            status = .saved
        } catch {
            status = .retry
        }
        working = false
        if rerun { rerun = false; await sync() }
    }
}

extension Cloud.Status {
    var text: String {
        switch self {
        case .starting: "Even kijken of je bent ingelogd…"
        case .guest: "Je voortgang staat op deze iPhone."
        case .syncing: "Opslaan…"
        case .saved: "Opgeslagen in je account."
        case .retry: "Nog niet online opgeslagen. We proberen het opnieuw."
        case .unavailable: "Inloggen is nu niet beschikbaar. Je kunt gewoon oefenen."
        }
    }
}
