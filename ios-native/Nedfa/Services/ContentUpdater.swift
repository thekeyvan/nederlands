import Foundation

/// Fetches new lessons from the content API (nedfa.nl/api/v1). A new version is saved and used from the next launch,
/// so content never changes in the middle of a round. Without internet the app simply keeps what it has.
enum ContentUpdater {
    private static let api = URL(string: "https://nedfa.nl/api/v1")!
    private static var file: URL {
        URL.applicationSupportDirectory.appending(path: "content/content.json")
    }

    /// The downloaded content, if there is a valid copy that is newer than the bundled one.
    static func downloaded() -> ContentFile? {
        guard let data = try? Data(contentsOf: file) else { return nil }
        guard let content = try? JSONDecoder().decode(ContentFile.self, from: data) else {
            try? FileManager.default.removeItem(at: file)
            return nil
        }
        return content
    }

    static func check() async {
        struct Version: Decodable { let version: String }
        let session = URLSession(configuration: .ephemeral)
        do {
            var request = URLRequest(url: api.appending(path: "version"), timeoutInterval: 10)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response) = try await session.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return }
            let latest = try JSONDecoder().decode(Version.self, from: data).version
            if latest == Content.shared.version || latest == downloadedVersion() { return }
            let (body, contentResponse) = try await session.data(for: URLRequest(url: api.appending(path: "content"), timeoutInterval: 60))
            guard (contentResponse as? HTTPURLResponse)?.statusCode == 200 else { return }
            // Save only content this build can read.
            let content = try JSONDecoder().decode(ContentFile.self, from: body)
            guard content.version == latest, !content.cards.isEmpty else { return }
            try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            try body.write(to: file, options: .atomic)
        } catch {
            // Offline or the server is busy: try again next launch.
        }
    }

    private static func downloadedVersion() -> String? {
        struct Version: Decodable { let version: String? }
        guard let data = try? Data(contentsOf: file) else { return nil }
        return (try? JSONDecoder().decode(Version.self, from: data))?.version
    }
}
