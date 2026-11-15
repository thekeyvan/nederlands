import AVFoundation
import Observation

/// Plays the bundled Dutch clips (Ronnie or Pim), also offline. Mixes with music instead of stopping it.
@MainActor @Observable
final class Audio: NSObject, AVAudioPlayerDelegate {
    static let shared = Audio()
    static let speeds: [Double] = [0.75, 0.85, 1, 1.15, 1.25]

    private(set) var playing: String?
    @ObservationIgnored private var player: AVAudioPlayer?

    override private init() {
        super.init()
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
    }

    func url(for text: String, voice: String? = nil) -> URL? {
        guard let key = Content.shared.audio.clips[text], let base = Bundle.main.resourceURL else { return nil }
        let url = base.appending(path: "audio/\(voice ?? Preferences.shared.voice)/\(key).mp3")
        return FileManager.default.fileExists(atPath: url.path()) ? url : nil
    }

    func has(_ text: String?) -> Bool { text.map { Content.shared.audio.clips[$0] != nil } ?? false }

    func play(_ text: String, speed: Double? = nil) {
        stop()
        guard let url = url(for: text), let player = try? AVAudioPlayer(contentsOf: url) else { return }
        try? AVAudioSession.sharedInstance().setActive(true)
        player.enableRate = true
        player.rate = Float(speed ?? Preferences.shared.speed)
        player.delegate = self
        player.play()
        self.player = player
        playing = text
    }

    func stop() {
        player?.stop()
        player = nil
        playing = nil
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in self.playing = nil }
    }
}
