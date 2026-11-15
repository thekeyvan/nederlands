import AuthenticationServices
import CryptoKit
import Foundation
import Observation
import Security
import UIKit

/// Sign in with Apple or Google and keep progress in step with nedfa.nl (its own API on Railway).
/// One account can have both Apple and Google: the same email joins automatically, or link the other one under Instellingen.
@MainActor @Observable
final class Cloud {
    static let shared = Cloud()

    enum Status: Equatable { case starting, guest, syncing, saved, retry, unavailable }
    struct User: Equatable, Decodable {
        let id: String; let name: String; let email: String; let providers: [String]
        var provider: String { providers.first ?? "" }
        func has(_ provider: String) -> Bool { providers.contains(provider) }
    }

    private(set) var status: Status = .starting
    private(set) var user: User?
    var message: String?

    private static let base = URL(string: "https://nedfa.nl/api")!
    private static let scheme = "com.keyvanmahmoudi.nederlands"
    @ObservationIgnored private var token: String? = Keychain.read()
    @ObservationIgnored private var working = false
    @ObservationIgnored private var rerun = false
    @ObservationIgnored private var pending: Task<Void, Never>?
    @ObservationIgnored private var webSession: ASWebAuthenticationSession?
    @ObservationIgnored private let anchor = WindowAnchor()

    private init() {
        Learner.shared.onChange = { [weak self] in self?.scheduleSync() }
    }

    func start() async {
        guard token != nil else { status = .guest; return }
        do {
            let me: MeResponse = try await request("me")
            await setUser(me.user)
        } catch APIError.signedOut {
            forgetToken(); await setUser(nil)
        } catch {
            // Offline: keep practising on this iPhone and try again later.
            status = .retry
        }
    }

    // MARK: API

    enum APIError: Error { case signedOut, server(Int), offline }
    private struct MeResponse: Decodable { let user: User? }
    private struct SessionResponse: Decodable { let token: String; let user: User }

    private func request<T: Decodable>(_ path: String, method: String = "GET", body: (any Encodable)? = nil) async throws -> T {
        var request = URLRequest(url: Self.base.appending(path: path))
        request.httpMethod = method
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }
        let data: Data, response: URLResponse
        do { (data, response) = try await URLSession.shared.data(for: request) } catch { throw APIError.offline }
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        if code == 401 { throw APIError.signedOut }
        guard (200..<300).contains(code) else { throw APIError.server(code) }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let text = try decoder.singleValueContainer().decode(String.self)
            let iso = ISO8601DateFormatter()
            iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso.date(from: text) { return date }
            iso.formatOptions = [.withInternetDateTime]
            if let date = iso.date(from: text) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: text))
        }
        return try decoder.decode(T.self, from: data)
    }
    private struct OK: Decodable {}

    private func signedIn(_ session: SessionResponse) async {
        token = session.token
        Keychain.save(session.token)
        await setUser(session.user)
    }

    private func forgetToken() { token = nil; Keychain.delete() }

    // MARK: Sign in with Apple

    private var nonce = ""
    private var linking = false
    /// `link`: add Apple to the account you are signed in with.
    func appleRequest(_ request: ASAuthorizationAppleIDRequest, link: Bool = false) {
        linking = link
        nonce = UUID().uuidString + UUID().uuidString
        request.requestedScopes = [.fullName, .email]
        request.nonce = SHA256.hash(data: Data(nonce.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    func appleCompletion(_ result: Result<ASAuthorization, Error>) async {
        let failed = "Inloggen met Apple lukt nu niet. Probeer het later opnieuw."
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken, let idToken = String(data: tokenData, encoding: .utf8) else { message = failed; return }
            // Apple shares the name only the first time.
            let name = [credential.fullName?.givenName, credential.fullName?.familyName].compactMap { $0 }.joined(separator: " ")
            struct Body: Encodable { let idToken: String; let nonce: String; let name: String; let link: Bool; let client = "app" }
            let body = Body(idToken: idToken, nonce: nonce, name: name, link: linking)
            do {
                if linking {
                    let me: MeResponse = try await request("auth/apple", method: "POST", body: body)
                    if let next = me.user { await setUser(next) }
                    message = "Apple is gekoppeld aan je account."
                } else {
                    await signedIn(try await request("auth/apple", method: "POST", body: body))
                }
            } catch {
                message = failed
            }
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code != .canceled { message = failed }
        }
    }

    // MARK: Google (in a Safari sheet; nedfa.nl checks Google's answer and sends back a one-time code)

    func signInWithGoogle(link: Bool = false) async {
        var items = [URLQueryItem(name: "mode", value: "app")]
        if link {
            struct Ticket: Decodable { let ticket: String }
            guard let ticket: Ticket = try? await request("auth/link-ticket", method: "POST") else { message = "Koppelen lukt nu niet. Probeer het later opnieuw."; return }
            items.append(URLQueryItem(name: "ticket", value: ticket.ticket))
        }
        var components = URLComponents(url: Self.base.appending(path: "auth/google"), resolvingAgainstBaseURL: false)!
        components.queryItems = items
        let url: URL? = await withCheckedContinuation { continuation in
            let session = ASWebAuthenticationSession(url: components.url!, callbackURLScheme: Self.scheme) { callback, error in
                if let error, (error as? ASWebAuthenticationSessionError)?.code != .canceledLogin {
                    Task { @MainActor in self.message = "Google-inloggen is niet afgerond. Je kunt het opnieuw proberen." }
                }
                continuation.resume(returning: callback)
            }
            session.presentationContextProvider = anchor
            session.prefersEphemeralWebBrowserSession = false
            webSession = session
            session.start()
        }
        webSession = nil
        if let url { await handleCallback(url) }
    }

    func handle(_ url: URL) { Task { await handleCallback(url) } }

    private func handleCallback(_ url: URL) async {
        guard url.scheme == Self.scheme else { return }
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        let value = { (name: String) in items.first { $0.name == name }?.value }
        if let code = value("code") {
            struct Body: Encodable { let code: String }
            do { await signedIn(try await request("auth/exchange", method: "POST", body: Body(code: code))) }
            catch { message = "Inloggen lukt nu niet. Probeer het later opnieuw." }
        } else if value("linked") != nil {
            if let me: MeResponse = try? await request("me"), let next = me.user { await setUser(next) }
            message = "Google is gekoppeld aan je account."
        } else if let error = value("error"), error != "cancelled" {
            message = "Google-inloggen is niet afgerond. Je kunt het opnieuw proberen."
        }
    }

    /// Removes Apple or Google from the account (only when the other one stays).
    func unlink(_ provider: String) async {
        do {
            let me: MeResponse = try await request("me/identities/\(provider)", method: "DELETE")
            if let next = me.user { user = next }
        } catch {
            message = "Je hebt minstens één manier van inloggen nodig."
        }
    }

    func signOut() async {
        guard user != nil else { return }
        await sync()
        let _: OK? = try? await request("auth/signout", method: "POST")
        forgetToken()
        await setUser(nil)
    }

    /// Deletes the account and everything saved with it, online and on this device.
    func deleteAccount() async -> Bool {
        if user != nil {
            do { let _: OK = try await request("me", method: "DELETE") } catch {
                message = "Je account kon niet worden verwijderd. Controleer je verbinding en probeer het opnieuw."; return false
            }
            forgetToken()
        }
        Learner.shared.forgetDevice()
        Preferences.shared.reset()
        user = nil
        status = .guest
        return true
    }

    // MARK: Sync

    private func setUser(_ next: User?) async {
        if next?.id == user?.id, Learner.shared.identity == (user?.id ?? "guest") {
            user = next
            if status == .starting { status = next == nil ? .guest : .saved }
            return
        }
        user = next
        Learner.shared.switchUser(next?.id)
        guard next != nil else { status = .guest; return }
        status = .syncing
        do { try await load() } catch APIError.signedOut { forgetToken(); await setUser(nil); return } catch { status = .retry; return }
        await sync()
    }

    private struct CardRow: Decodable {
        let card_id: String; let ease: Double; let interval_days: Int; let repetitions: Int
        let due: Date; let last_reviewed: Date; let grade: Int; let reviews: Int
    }
    private struct EventRow: Decodable { let id: String; let card_id: String; let grade: Int; let reviewed_at: Date }
    private struct PreferenceRow: Decodable { let data: [String: JSONValue]; let updated_at: Date? }
    private struct Progress: Decodable { let cards: [CardRow]; let events: [EventRow]; let preferences: PreferenceRow? }

    private func load() async throws {
        let progress: Progress = try await request("me/progress")
        Learner.shared.merge(
            reviews: Dictionary(progress.cards.map { ($0.card_id, Review(ease: $0.ease, interval: $0.interval_days, repetitions: $0.repetitions, due: $0.due, lastReviewed: $0.last_reviewed, grade: $0.grade, reviews: $0.reviews)) }, uniquingKeysWith: { a, _ in a }),
            events: progress.events.map { ReviewEvent(id: $0.id, cardId: $0.card_id, grade: $0.grade, at: $0.reviewed_at) })
        if let remote = progress.preferences {
            let local = Preferences.shared.updatedAt
            if local == nil || (remote.updated_at ?? .distantPast) > local! {
                if case .number(let goal)? = remote.data["goal"], Preferences.goals.contains(Int(goal)) { Preferences.shared.goal = Int(goal) }
                if case .string(let level)? = remote.data["level"], Preferences.levels.contains(level) { Preferences.shared.level = level }
                Preferences.shared.updatedAt = remote.updated_at
            }
        }
        remotePreferences = progress.preferences?.data ?? [:]
    }

    @ObservationIgnored private var remotePreferences: [String: JSONValue] = [:]

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
        guard user != nil else { return }
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
            let _: OK = try await request("me/sync", method: "POST", body: payload)
            if let updated = Preferences.shared.updatedAt {
                var data = remotePreferences
                data["goal"] = .number(Double(Preferences.shared.goal))
                if let level = Preferences.shared.level { data["level"] = .string(level) }
                struct Body: Encodable { let data: [String: JSONValue]; let updated_at: String }
                let _: OK = try await request("me/preferences", method: "PUT", body: Body(data: data, updated_at: iso.string(from: updated)))
            }
            progress.clearGuest()
            status = .saved
        } catch APIError.signedOut {
            working = false
            forgetToken(); await setUser(nil); return
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

/// Any JSON value, so settings the website stores are kept when the app saves its own.
enum JSONValue: Codable, Equatable {
    case string(String), number(Double), bool(Bool), object([String: JSONValue]), array([JSONValue]), null
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([JSONValue].self) { self = .array(value) }
        else { self = .object(try container.decode([String: JSONValue].self)) }
    }
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): if value == value.rounded() && abs(value) < 1e15 { try container.encode(Int(value)) } else { try container.encode(value) }
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

/// Where the Google sheet appears.
final class WindowAnchor: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first ?? ASPresentationAnchor()
        }
    }
}

/// The session token lives in the Keychain, only on this iPhone.
enum Keychain {
    private static var query: [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "nl.nedfa.session", kSecAttrAccount as String: "session"] }
    static func read() -> String? {
        var item: CFTypeRef?
        var search = query
        search[kSecReturnData as String] = true
        guard SecItemCopyMatching(search as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    static func save(_ token: String) {
        delete()
        var item = query
        item[kSecValueData as String] = Data(token.utf8)
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(item as CFDictionary, nil)
    }
    static func delete() { SecItemDelete(query as CFDictionary) }
}
