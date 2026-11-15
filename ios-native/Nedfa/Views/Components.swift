import SwiftUI
import UIKit

extension Color {
    static let brand = Color("AccentColor")
    static let navy = Color(red: 0.141, green: 0.255, blue: 0.416)
    static let cream = Color(red: 0.988, green: 0.980, blue: 0.965)
    static let mint = Color(red: 0.62, green: 0.85, blue: 0.76)
    static let butter = Color(red: 0.965, green: 0.784, blue: 0.373)
    static let success = Color(red: 0.17, green: 0.62, blue: 0.40)
    static let danger = Color(red: 0.78, green: 0.27, blue: 0.24)
}

/// A 3D picture from the bundled illustrations, e.g. "themes/werk", "mascot/cheer", "games/lidwoord".
struct Art: View {
    let name: String
    var size: CGFloat = 48
    var corner: CGFloat? = nil

    private static let cache = NSCache<NSString, UIImage>()
    static func image(_ name: String) -> UIImage? {
        if let cached = cache.object(forKey: name as NSString) { return cached }
        guard let base = Bundle.main.resourceURL, let image = UIImage(contentsOfFile: base.appending(path: "illustrations/\(name).jpg").path()) else { return nil }
        cache.setObject(image, forKey: name as NSString)
        return image
    }

    var body: some View {
        Group {
            if let image = Art.image(name) {
                Image(uiImage: image).resizable().scaledToFit()
            } else {
                Image("Logo").resizable().scaledToFit()
            }
        }
        .frame(width: size, height: size)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: corner ?? size * 0.26, style: .continuous))
        .accessibilityHidden(true)
    }
}

enum Mood: String { case wave, cheer, think, sleep }

struct Mascot: View {
    var mood: Mood = .wave
    var size: CGFloat = 64
    var body: some View { Art(name: "mascot/\(mood.rawValue)", size: size) }
}

/// Persian text: right to left, a little larger and calmer.
struct Persian: View {
    let text: String
    var font: Font = .subheadline
    var color: Color = .secondary
    var centered = false
    var body: some View {
        Text(text).font(font).environment(\.layoutDirection, .rightToLeft).multilineTextAlignment(centered ? .center : .trailing)
            .frame(maxWidth: .infinity, alignment: centered ? .center : .trailing).foregroundStyle(color).fixedSize(horizontal: false, vertical: true)
    }
}

struct ListenButton: View {
    let text: String
    var size: CGFloat = 18
    @State private var audio = Audio.shared
    var body: some View {
        if audio.has(text) {
            Button { Haptics.tap(); audio.play(text) } label: {
                Image(systemName: audio.playing == text ? "speaker.wave.3.fill" : "speaker.wave.2.fill").font(.system(size: size, weight: .semibold))
                    .frame(width: size * 2.2, height: size * 2.2).background(Color.navy.opacity(0.1), in: Circle()).foregroundStyle(Color.navy)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Luister")
        }
    }
}

struct StarsView: View {
    let count: Int
    var body: some View {
        HStack(spacing: 1) {
            ForEach(0..<3, id: \.self) { index in
                Image(systemName: index < count ? "star.fill" : "star").font(.caption2).foregroundStyle(index < count ? Color.butter : Color.secondary.opacity(0.4))
            }
        }
        .accessibilityLabel("\(count) van 3 sterren")
    }
}

/// The big pressable button used to start rounds and games.
struct GameButtonStyle: ButtonStyle {
    var color: Color = .brand
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: 52)
            .foregroundStyle(.white)
            .background(color, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .background(color.opacity(0.65), in: RoundedRectangle(cornerRadius: 16, style: .continuous).offset(y: configuration.isPressed ? 0 : 4))
            .offset(y: configuration.isPressed ? 4 : 0)
            .animation(.snappy(duration: 0.12), value: configuration.isPressed)
    }
}

@MainActor enum Haptics {
    static func tap() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    static func error() { UINotificationFeedbackGenerator().notificationOccurred(.error) }
}

/// A row with a 3D picture, a title and a detail line, as in every list of the app.
struct PictureRow: View {
    let picture: String
    let title: String
    var detail: String? = nil
    var size: CGFloat = 48
    var body: some View {
        HStack(spacing: 14) {
            Art(name: picture, size: size)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold)).lineLimit(1)
                if let detail { Text(detail).font(.footnote).foregroundStyle(.secondary).lineLimit(1) }
            }
        }
        .padding(.vertical, 2)
    }
}
