import SwiftUI
import UIKit

// MARK: Colours
// Apple-clean ground and white cards; orange = play, navy = calm, mint = right, gold = XP and stars.

extension Color {
    /// A colour with its own light and dark value.
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
    }

    static let brand = Color("AccentColor")
    static let brandEdge = Color(light: 0xC2560F, dark: 0x9C440B)
    static let navy = Color(red: 0.141, green: 0.255, blue: 0.416)
    static let cream = Color(red: 0.988, green: 0.980, blue: 0.965)
    static let mint = Color(light: 0x3CC48B, dark: 0x34B27D)
    static let mintEdge = Color(light: 0x23935F, dark: 0x1D7A4F)
    static let butter = Color(light: 0xFFC53D, dark: 0xF5B92E)
    static let goldEdge = Color(light: 0xD9A21E, dark: 0xB4841A)
    static let goldInk = Color(light: 0xA06E00, dark: 0xFFCF5C)
    static let sky = Color(light: 0x4B8BE0, dark: 0x6CA3F0)
    static let success = Color(light: 0x23935F, dark: 0x4CD69B)
    static let danger = Color(light: 0xE5624F, dark: 0xF07A68)
    static let dangerEdge = Color(light: 0xC24A3D, dark: 0x9E3A2F)
    /// Opaque soft tints for answer tiles (a see-through tint would show the rim underneath).
    static let mintSoft = Color(light: 0xE4F6EE, dark: 0x173528)
    static let dangerSoft = Color(light: 0xFCE9E6, dark: 0x3B1F1C)
    static let butterSoft = Color(light: 0xFFF5DC, dark: 0x3A3016)
    /// The screen behind the cards.
    static let ground = Color(light: 0xEEF0F4, dark: 0x0D121C)
    /// Cards and tiles.
    static let surface = Color(light: 0xFFFFFF, dark: 0x1B2333)
    /// The darker rim under a tile that makes it look pressable.
    static let edge = Color(light: 0xDCE0E8, dark: 0x080C14)
    /// Tracks of progress bars and empty dots.
    static let track = Color(light: 0xE3E7EE, dark: 0x2A3346)
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
    }
}

// MARK: Type
// SF Pro Rounded for titles and numbers (the game voice), SF Pro for reading.

extension Font {
    static func game(_ size: CGFloat, _ weight: Font.Weight = .heavy) -> Font { .system(size: size, weight: weight, design: .rounded) }
}

/// Small caps label above a title, e.g. "DAGRONDJE".
struct Eyebrow: View {
    let text: String
    var color: Color = .secondary
    init(_ text: String, color: Color = .secondary) { self.text = text; self.color = color }
    var body: some View { Text(text.uppercased()).font(.caption.weight(.heavy)).tracking(0.6).foregroundStyle(color) }
}

// MARK: Surfaces

extension View {
    /// A white card with a soft shadow.
    func card(padding: CGFloat = 16, radius: CGFloat = 26) -> some View {
        self.padding(padding)
            .background(RoundedRectangle(cornerRadius: radius, style: .continuous).fill(Color.surface).shadow(color: .black.opacity(0.06), radius: 14, y: 6))
    }

    /// A tactile tile: a surface with a darker rim underneath, like a key.
    func tile(radius: CGFloat = 22, fill: Color = .surface, edge: Color = .edge, depth: CGFloat = 4) -> some View {
        self.background(
            ZStack {
                RoundedRectangle(cornerRadius: radius, style: .continuous).fill(edge).offset(y: depth)
                RoundedRectangle(cornerRadius: radius, style: .continuous).fill(fill)
            }
        )
        .padding(.bottom, depth)
    }

    /// The grey game background for a whole screen.
    func gameBackground() -> some View { self.background(Color.ground.ignoresSafeArea()) }

    /// The screen colour behind the clock and battery, so content that scrolls up never runs under them.
    func statusBarScrim(_ color: Color = .ground) -> some View {
        self.safeAreaInset(edge: .top, spacing: 0) { Color.clear.frame(height: 0).background(color).scrollEdgeFade(color) }
    }

    /// A short fade below a fixed header, so content slides away softly instead of being cut off.
    func scrollEdgeFade(_ color: Color = .ground) -> some View {
        self.overlay(alignment: .bottom) {
            LinearGradient(colors: [color, color.opacity(0)], startPoint: .top, endPoint: .bottom)
                .frame(height: 14).offset(y: 14).allowsHitTesting(false)
        }
    }
}

/// The big title at the top of a tab, the same on Vandaag, Leren and Arcade.
struct ScreenTitle<Trailing: View>: View {
    let title: String
    let eyebrow: String
    @ViewBuilder var trailing: Trailing
    init(_ title: String, eyebrow: String, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) {
        self.title = title; self.eyebrow = eyebrow; self.trailing = trailing()
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Eyebrow(eyebrow)
            HStack(alignment: .firstTextBaseline) {
                Text(title).font(.game(34, .black)).accessibilityAddTraits(.isHeader)
                Spacer()
                trailing
            }
        }
    }
}

/// A rounded search field that lives in the content, not in the navigation bar.
struct SearchField: View {
    let prompt: String
    @Binding var text: String
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField(prompt, text: $text).textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.search)
            if !text.isEmpty {
                Button { text = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary) }
                    .accessibilityLabel("Wissen")
            }
        }
        .font(.body)
        .padding(.horizontal, 14).frame(height: 44)
        .background(Color.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

/// The big pressable 3D button used to start rounds and games.
struct GameButtonStyle: ButtonStyle {
    var color: Color = .brand
    var edge: Color = .brandEdge
    var foreground: Color = .white
    var height: CGFloat = 56

    func makeBody(configuration: Configuration) -> some View {
        let depth: CGFloat = configuration.isPressed ? 1 : 6
        configuration.label
            .font(.game(19, .black))
            .frame(maxWidth: .infinity, minHeight: height)
            .foregroundStyle(foreground)
            .background(color, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .background(edge, in: RoundedRectangle(cornerRadius: 20, style: .continuous).offset(y: depth))
            .offset(y: 6 - depth)
            .padding(.bottom, 6)
            .animation(.snappy(duration: 0.1), value: configuration.isPressed)
    }
}

/// A tile that sinks into its rim when pressed.
struct PressableTile: ButtonStyle {
    var fill: Color = .surface
    var edge: Color = .edge
    var radius: CGFloat = 22
    func makeBody(configuration: Configuration) -> some View {
        let depth: CGFloat = configuration.isPressed ? 1 : 5
        configuration.label
            .background(fill, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .background(edge, in: RoundedRectangle(cornerRadius: radius, style: .continuous).offset(y: depth))
            .offset(y: 5 - depth)
            .padding(.bottom, 5)
            .animation(.snappy(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: Game parts

/// A rounded chip with an icon and a number: the streak flame or XP star.
struct StatChip: View {
    let systemImage: String
    let value: String
    let color: Color
    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: systemImage).symbolRenderingMode(.hierarchical)
            Text(value).monospacedDigit()
        }
        .font(.game(16, .heavy))
        .foregroundStyle(color)
        .padding(.horizontal, 12).frame(height: 36)
        .background(Capsule().fill(Color.surface).shadow(color: .black.opacity(0.06), radius: 8, y: 3))
    }
}

/// A thick, glossy progress bar.
struct ThickProgress: View {
    let value: Double
    var color: Color = .mint
    var height: CGFloat = 14
    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.track)
                Capsule().fill(color)
                    .overlay(alignment: .top) { Capsule().fill(.white.opacity(0.3)).frame(height: height * 0.3).padding(.horizontal, height / 2).padding(.top, height * 0.18) }
                    .frame(width: max(height, proxy.size.width * min(1, max(0, value))))
                    .opacity(value > 0 ? 1 : 0)
            }
        }
        .frame(height: height)
        .animation(.spring(duration: 0.4), value: value)
        .accessibilityElement()
        .accessibilityValue("\(Int(value * 100)) procent")
    }
}

/// The level number inside a gold ring that fills towards the next level.
struct LevelRing: View {
    let number: Int
    let progress: Double
    var size: CGFloat = 46
    var body: some View {
        // A gold level coin with the number, and a thin ring around it that fills with XP (no dark track).
        ZStack {
            Circle().fill(Color.butter).padding(7)
                .overlay(Circle().fill(.white.opacity(0.35)).frame(width: size * 0.22).offset(x: -size * 0.12, y: -size * 0.14).blur(radius: 2).padding(7))
            Circle().stroke(Color.butter.opacity(0.22), lineWidth: 3.5)
            Circle().trim(from: 0, to: max(0.001, progress)).stroke(Color.butter, style: StrokeStyle(lineWidth: 3.5, lineCap: .round)).rotationEffect(.degrees(-90))
            Text("\(number)").font(.game(size * 0.4, .black)).foregroundStyle(Color.navy).monospacedDigit()
        }
        .frame(width: size, height: size)
        .accessibilityLabel("Niveau \(number)")
    }
}

/// A short bar of segments, one per card of today's goal.
struct SegmentBar: View {
    let done: Int
    let total: Int
    var on: Color = .mint
    var off: Color = .white.opacity(0.18)
    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<max(1, total), id: \.self) { index in
                Capsule().fill(index < done ? on : off).frame(height: 8)
            }
        }
        .accessibilityElement()
        .accessibilityLabel("\(done) van \(total)")
    }
}

// MARK: Pictures

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
                Image(uiImage: image).resizable().scaledToFill()
            } else {
                Image("Logo").resizable().scaledToFit().padding(size * 0.15)
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

/// The mascot standing on a soft shadow, as the hero of a card.
struct HeroMascot: View {
    var mood: Mood = .wave
    var size: CGFloat = 110
    var body: some View {
        ZStack(alignment: .bottom) {
            Ellipse().fill(.black.opacity(0.22)).frame(width: size * 0.7, height: size * 0.12).blur(radius: 3).offset(y: 4)
            Mascot(mood: mood, size: size)
        }
    }
}

// MARK: Text and small controls

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
                    .frame(width: size * 2.3, height: size * 2.3).background(Color.sky.opacity(0.14), in: Circle()).foregroundStyle(Color.sky)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Luister")
        }
    }
}

struct StarsView: View {
    let count: Int
    var size: Font = .caption2
    var body: some View {
        HStack(spacing: 1) {
            ForEach(0..<3, id: \.self) { index in
                Image(systemName: "star.fill").font(size).foregroundStyle(index < count ? Color.butter : Color.track)
            }
        }
        .accessibilityLabel("\(count) van 3 sterren")
    }
}

/// A small orange "Nieuw" pill.
struct NewBadge: View {
    var body: some View {
        Text("Nieuw").font(.caption.weight(.bold)).padding(.horizontal, 8).padding(.vertical, 3)
            .background(Color.brand.opacity(0.15), in: Capsule()).foregroundStyle(Color.brand)
    }
}

/// A section title in the game voice, with an optional trailing control.
struct SectionTitle<Trailing: View>: View {
    let title: String
    @ViewBuilder var trailing: () -> Trailing
    init(_ title: String, @ViewBuilder trailing: @escaping () -> Trailing = { EmptyView() }) { self.title = title; self.trailing = trailing }
    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.game(22, .black))
            Spacer()
            trailing()
        }
        .padding(.horizontal, 20)
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

// MARK: Sheets

private struct SheetHeightKey: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

/// A bottom sheet exactly as tall as its content, so everything is visible at once.
/// It only scrolls when the content is taller than the screen. Use it for every sheet.
struct FittedSheet<Content: View>: View {
    var title: String? = nil
    @ViewBuilder var content: Content
    @State private var contentHeight: CGFloat = 320
    @Environment(\.dismiss) private var dismiss
    private let headerHeight: CGFloat = 56

    var body: some View {
        VStack(spacing: 0) {
            if let title {
                ZStack {
                    Text(title).font(.headline).lineLimit(1).padding(.horizontal, 80)
                    HStack { Spacer(); Button("Klaar") { dismiss() }.font(.body.weight(.semibold)).foregroundStyle(Color.brand) }
                }
                .frame(height: headerHeight)
                .padding(.horizontal, 20)
            }
            ScrollView {
                content.background(GeometryReader { Color.clear.preference(key: SheetHeightKey.self, value: $0.size.height) })
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .onPreferenceChange(SheetHeightKey.self) { contentHeight = $0 }
        // The system caps a detent at the large size; the content then scrolls.
        .presentationDetents([.height(contentHeight + (title == nil ? 4 : headerHeight))])
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(32)
        .gameBackground()
    }
}

// MARK: Confirmations

extension View {
    /// Asks before a big step (signing out, deleting, linking, stopping): a short question, what will happen,
    /// and two buttons — `cancel` keeps everything as it is, `action` does it. The same wording as on the website.
    func confirm(_ title: String, isPresented: Binding<Bool>, message: String, action: String, destructive: Bool = false,
                 cancel: String = "Annuleren", perform: @escaping () -> Void) -> some View {
        alert(title, isPresented: isPresented) {
            Button(cancel, role: .cancel) {}
            Button(action, role: destructive ? .destructive : nil, action: perform)
        } message: {
            Text(message)
        }
    }
}
