import SwiftUI

// Motion for a playful, game-like feel: the splash, a mascot that hops and wiggles, confetti,
// numbers that count up, answers that shake or pop. Everything respects Reduce Motion
// (Settings › Accessibility › Motion): then things simply fade in, without movement.

// MARK: Splash

/// Starts exactly like the static launch screen (same colour, same picture, same spot), then the mascot
/// hops, the name pops in letter by letter and the splash zooms away into the app.
struct SplashView: View {
    let done: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hop = 0
    @State private var rounded = false
    @State private var lettersIn = false
    @State private var taglineIn = false
    @State private var leaving = false
    private let word = Array("Nedfa")

    var body: some View {
        ZStack {
            Color("LaunchBackground").ignoresSafeArea()
            Image("LaunchMascot")
                .resizable()
                .frame(width: 200, height: 200)
                .clipShape(RoundedRectangle(cornerRadius: rounded ? 56 : 0, style: .continuous))
                .keyframeAnimator(initialValue: Pose(), trigger: hop) { view, pose in
                    view.scaleEffect(x: pose.scaleX, y: pose.scaleY, anchor: .bottom)
                        .rotationEffect(.degrees(pose.angle), anchor: .bottom)
                        .offset(y: pose.y)
                } keyframes: { _ in Pose.hopKeyframes(height: 54) }
                .overlay(alignment: .bottom) {
                    VStack(spacing: 6) {
                        HStack(spacing: 1) {
                            ForEach(word.indices, id: \.self) { index in
                                Text(String(word[index]))
                                    .font(.game(46, .black))
                                    .foregroundStyle(Color.brand)
                                    .scaleEffect(lettersIn ? 1 : 0.2)
                                    .offset(y: lettersIn ? 0 : 22)
                                    .opacity(lettersIn ? 1 : 0)
                                    .animation(.spring(response: 0.42, dampingFraction: 0.55).delay(Double(index) * 0.055), value: lettersIn)
                            }
                        }
                        Text("Nederlands van nul tot B1")
                            .font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                            .opacity(taglineIn ? 1 : 0).offset(y: taglineIn ? 0 : 6)
                    }
                    .fixedSize()
                    .offset(y: 96)
                }
                .scaleEffect(leaving ? 1.18 : 1)
                .opacity(leaving ? 0 : 1)
        }
        .opacity(leaving ? 0 : 1)
        .accessibilityHidden(true)
        .task { await play() }
    }

    private func play() async {
        if reduceMotion {
            withAnimation(.easeOut(duration: 0.25)) { lettersIn = true; taglineIn = true; rounded = true }
            try? await Task.sleep(for: .milliseconds(700))
        } else {
            try? await Task.sleep(for: .milliseconds(120))
            withAnimation(.smooth(duration: 0.35)) { rounded = true }
            hop += 1
            try? await Task.sleep(for: .milliseconds(560))
            Haptics.soft()
            lettersIn = true
            try? await Task.sleep(for: .milliseconds(330))
            withAnimation(.easeOut(duration: 0.3)) { taglineIn = true }
            try? await Task.sleep(for: .milliseconds(620))
        }
        withAnimation(.easeIn(duration: 0.32)) { leaving = true }
        try? await Task.sleep(for: .milliseconds(330))
        done()
    }
}

// MARK: Mascot motion

/// One frame of a hop: squash, stretch, height and tilt.
struct Pose {
    var scaleX: CGFloat = 1
    var scaleY: CGFloat = 1
    var y: CGFloat = 0
    var angle: Double = 0

    /// Crouch, jump with a stretch, land with a squash, settle.
    @KeyframesBuilder<Pose> static func hopKeyframes(height: CGFloat) -> some Keyframes<Pose> {
        KeyframeTrack(\.scaleX) {
            CubicKeyframe(1.12, duration: 0.12)
            CubicKeyframe(0.92, duration: 0.14)
            CubicKeyframe(0.96, duration: 0.18)
            CubicKeyframe(1.1, duration: 0.08)
            SpringKeyframe(1, duration: 0.3, spring: .bouncy)
        }
        KeyframeTrack(\.scaleY) {
            CubicKeyframe(0.86, duration: 0.12)
            CubicKeyframe(1.1, duration: 0.14)
            CubicKeyframe(1.04, duration: 0.18)
            CubicKeyframe(0.9, duration: 0.08)
            SpringKeyframe(1, duration: 0.3, spring: .bouncy)
        }
        KeyframeTrack(\.y) {
            LinearKeyframe(0, duration: 0.12)
            CubicKeyframe(-height, duration: 0.2)
            CubicKeyframe(0, duration: 0.2)
            LinearKeyframe(0, duration: 0.3)
        }
        KeyframeTrack(\.angle) {
            LinearKeyframe(0, duration: 0.12)
            CubicKeyframe(-7, duration: 0.2)
            CubicKeyframe(4, duration: 0.2)
            SpringKeyframe(0, duration: 0.3)
        }
    }

    /// A "nope" wiggle: tilt left and right, slightly down.
    @KeyframesBuilder<Pose> static var wiggleKeyframes: some Keyframes<Pose> {
        KeyframeTrack(\.angle) {
            CubicKeyframe(-10, duration: 0.09)
            CubicKeyframe(9, duration: 0.12)
            CubicKeyframe(-6, duration: 0.12)
            CubicKeyframe(4, duration: 0.1)
            SpringKeyframe(0, duration: 0.25)
        }
        KeyframeTrack(\.scaleY) {
            CubicKeyframe(0.94, duration: 0.15)
            SpringKeyframe(1, duration: 0.5)
        }
    }
}

enum MascotMotion { case none, idle, hop, wiggle, hopThenIdle }

private struct MascotMotionModifier: ViewModifier {
    let motion: MascotMotion
    let trigger: Int
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var tick = 0

    @ViewBuilder func body(content: Self.Content) -> some View {
        if reduceMotion || motion == .none {
            content
        } else {
            content
                .modifier(Breathing(active: motion == .idle || motion == .hopThenIdle))
                .keyframeAnimator(initialValue: Pose(), trigger: motion == .wiggle ? 0 : tick + trigger) { view, pose in
                    view.scaleEffect(x: pose.scaleX, y: pose.scaleY, anchor: .bottom)
                        .rotationEffect(.degrees(pose.angle), anchor: .bottom)
                        .offset(y: pose.y)
                } keyframes: { _ in Pose.hopKeyframes(height: 26) }
                .keyframeAnimator(initialValue: Pose(), trigger: motion == .wiggle ? tick + trigger : 0) { view, pose in
                    view.scaleEffect(y: pose.scaleY, anchor: .bottom)
                        .rotationEffect(.degrees(pose.angle), anchor: .bottom)
                } keyframes: { _ in Pose.wiggleKeyframes }
                .onAppear { if motion == .hop || motion == .wiggle || motion == .hopThenIdle { tick += 1 } }
        }
    }
}

/// A slow up-and-down, as if the mascot breathes.
private struct Breathing: ViewModifier {
    let active: Bool
    @ViewBuilder func body(content: Self.Content) -> some View {
        if active {
            content.phaseAnimator([false, true]) { view, up in
                view.scaleEffect(x: up ? 0.985 : 1, y: up ? 1.03 : 1, anchor: .bottom).offset(y: up ? -2 : 0)
            } animation: { _ in .easeInOut(duration: 1.5) }
        } else {
            content
        }
    }
}

extension View {
    /// `.hop` and `.wiggle` play when the view appears and again whenever `trigger` changes.
    func mascotMotion(_ motion: MascotMotion, trigger: Int = 0) -> some View {
        modifier(MascotMotionModifier(motion: motion, trigger: trigger))
    }
}

// MARK: Small effects

/// Shakes sideways once as `progress` goes from 0 to 1 (animate it with a linear curve).
struct Shake: GeometryEffect {
    var progress: CGFloat
    var distance: CGFloat = 9
    nonisolated var animatableData: CGFloat { get { progress } set { progress = newValue } }
    func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(CGAffineTransform(translationX: distance * sin(progress * .pi * 6) * (1 - progress * 0.4), y: 0))
    }
}

private struct PopIn: ViewModifier {
    let delay: Double
    let from: CGFloat
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false
    @ViewBuilder func body(content: Self.Content) -> some View {
        content
            .scaleEffect(shown || reduceMotion ? 1 : from)
            .offset(y: shown || reduceMotion ? 0 : 14)
            .opacity(shown ? 1 : 0)
            .onAppear {
                withAnimation(reduceMotion ? .easeOut(duration: 0.2).delay(delay) : .spring(response: 0.45, dampingFraction: 0.62).delay(delay)) { shown = true }
            }
    }
}

private struct Pulse: ViewModifier {
    let active: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ViewBuilder func body(content: Self.Content) -> some View {
        if active && !reduceMotion {
            content.phaseAnimator([false, true]) { view, big in view.scaleEffect(big ? 1.03 : 1) } animation: { big in big ? .easeInOut(duration: 0.9) : .easeInOut(duration: 0.9).delay(0.6) }
        } else {
            content
        }
    }
}

private struct PopOnChange<Value: Equatable>: ViewModifier {
    let value: Value
    let scale: CGFloat
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ViewBuilder func body(content: Self.Content) -> some View {
        if reduceMotion {
            content
        } else {
            content.keyframeAnimator(initialValue: CGFloat(1), trigger: value) { view, size in view.scaleEffect(size) } keyframes: { _ in
                KeyframeTrack {
                    CubicKeyframe(scale, duration: 0.12)
                    SpringKeyframe(1, duration: 0.35, spring: .bouncy)
                }
            }
        }
    }
}

extension View {
    /// Springs in when it appears (after `delay` seconds).
    func popIn(delay: Double = 0, from: CGFloat = 0.6) -> some View { modifier(PopIn(delay: delay, from: from)) }
    /// A gentle "tap me" pulse while `active`.
    func pulse(_ active: Bool = true) -> some View { modifier(Pulse(active: active)) }
    /// Grows for a moment whenever `value` changes.
    func popOnChange<Value: Equatable>(of value: Value, scale: CGFloat = 1.12) -> some View { modifier(PopOnChange(value: value, scale: scale)) }
    /// Shakes once when `active` turns true.
    func shake(when active: Bool) -> some View {
        modifier(Shake(progress: active ? 1 : 0)).animation(.linear(duration: 0.45), value: active)
    }
}

private struct CoinSpin: ViewModifier {
    let delay: Double
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var spun = false
    @ViewBuilder func body(content: Self.Content) -> some View {
        content
            .rotation3DEffect(.degrees(spun && !reduceMotion ? 720 : 0), axis: (x: 0, y: 1, z: 0))
            .task {
                try? await Task.sleep(for: .seconds(delay))
                withAnimation(.spring(response: 1.1, dampingFraction: 0.75)) { spun = true }
                Haptics.pop(0.8)
            }
    }
}

private struct StampSlam: ViewModifier {
    let delay: Double
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var down = false
    @ViewBuilder func body(content: Self.Content) -> some View {
        content
            .scaleEffect(down || reduceMotion ? 1 : 2.6)
            .rotationEffect(.degrees(down || reduceMotion ? -6 : -32))
            .opacity(down ? 1 : 0)
            .task {
                try? await Task.sleep(for: .seconds(delay))
                withAnimation(reduceMotion ? .easeOut(duration: 0.2) : .spring(response: 0.32, dampingFraction: 0.55)) { down = true }
                try? await Task.sleep(for: .milliseconds(140))
                Haptics.thud()
            }
    }
}

extension View {
    /// A gold coin that spins twice around (a new level).
    func coinSpin(delay: Double = 0) -> some View { modifier(CoinSpin(delay: delay)) }
    /// Comes down hard like a rubber stamp (a new stamp).
    func stampSlam(delay: Double = 0) -> some View { modifier(StampSlam(delay: delay)) }
}

// MARK: Numbers

/// A number that counts up from 0 (or `from`) when it appears.
struct CountUp: View {
    let to: Int
    var from: Int = 0
    var prefix = ""
    var suffix = ""
    var delay: Double = 0
    var duration: Double = 0.9
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var value: Double?

    var body: some View {
        CountingText(value: value ?? Double(from), prefix: prefix, suffix: suffix)
            .onAppear {
                guard value == nil else { return }
                value = Double(from)
                withAnimation(reduceMotion ? nil : .easeOut(duration: duration).delay(delay)) { value = Double(to) }
            }
            .accessibilityLabel("\(prefix)\(to)\(suffix)")
    }
}

private struct CountingText: View, Animatable {
    var value: Double
    let prefix: String
    let suffix: String
    nonisolated var animatableData: Double { get { value } set { value = newValue } }
    var body: some View { Text("\(prefix)\(Int(value.rounded()))\(suffix)").monospacedDigit() }
}

// MARK: Confetti and sparkles

/// A burst of confetti that falls and fades in about 2.5 seconds. It never catches taps.
struct Confetti: View {
    var count = 90
    var origin = UnitPoint(x: 0.5, y: 0.3)
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var start: Date?
    @State private var pieces: [Piece] = []

    struct Piece {
        let angle: Double, speed: Double, spin: Double, size: CGSize, color: Color, round: Bool, sway: Double
    }
    private static let colors: [Color] = [.brand, .mint, .butter, .sky, .danger, Color(light: 0x9B6BE8, dark: 0xB48CF5)]

    var body: some View {
        TimelineView(.animation(paused: start == nil || reduceMotion)) { timeline in
            Canvas { context, size in
                guard let start else { return }
                let t = timeline.date.timeIntervalSince(start)
                guard t < 3 else { return }
                let center = CGPoint(x: size.width * origin.x, y: size.height * origin.y)
                for piece in pieces {
                    // Thrown outwards, slowed by the air, pulled down by gravity, swaying like paper.
                    let drag = 1 - exp(-t * 2.2)
                    let x = center.x + cos(piece.angle) * piece.speed * drag / 2.2 + sin(t * 4 + piece.sway) * 12
                    let y = center.y + sin(piece.angle) * piece.speed * drag / 2.2 + 380 * t * t / 2
                    var copy = context
                    copy.opacity = t < 2 ? 1 : max(0, 3 - t)
                    copy.translateBy(x: x, y: y)
                    copy.rotate(by: .degrees(piece.spin * t * 360))
                    copy.scaleBy(x: 1, y: abs(cos(t * piece.spin * 5)) * 0.8 + 0.2)
                    let rect = CGRect(x: -piece.size.width / 2, y: -piece.size.height / 2, width: piece.size.width, height: piece.size.height)
                    copy.fill(piece.round ? Path(ellipseIn: rect) : Path(roundedRect: rect, cornerRadius: 1.5), with: .color(piece.color))
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            guard start == nil, !reduceMotion else { return }
            pieces = (0..<count).map { _ in
                Piece(angle: .random(in: -.pi * 0.95 ... -.pi * 0.05), speed: .random(in: 380...900), spin: .random(in: -1.6...1.6),
                      size: CGSize(width: .random(in: 7...11), height: .random(in: 10...16)), color: Self.colors.randomElement()!,
                      round: Int.random(in: 0..<5) == 0, sway: .random(in: 0...6))
            }
            start = .now
        }
    }
}

/// Little stars that fly out of a point: the "yes!" after a right answer.
struct SparkleBurst: View {
    var count = 8
    var radius: CGFloat = 46
    var color: Color = .butter
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var out = false

    var body: some View {
        ZStack {
            ForEach(0..<count, id: \.self) { index in
                let angle = Double(index) / Double(count) * 2 * .pi
                Image(systemName: index.isMultiple(of: 2) ? "star.fill" : "sparkle")
                    .font(.system(size: index.isMultiple(of: 2) ? 13 : 10, weight: .bold))
                    .foregroundStyle(index.isMultiple(of: 3) ? Color.mint : color)
                    .offset(x: out ? cos(angle) * radius : 0, y: out ? sin(angle) * radius : 0)
                    .scaleEffect(out ? 0.4 : 1.1)
                    .opacity(out ? 0 : 1)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 0.7)) { out = true }
        }
    }
}

// MARK: Haptics

extension Haptics {
    static func soft() { UIImpactFeedbackGenerator(style: .soft).impactOccurred() }
    static func thud() { UIImpactFeedbackGenerator(style: .heavy).impactOccurred() }
    static func pop(_ intensity: CGFloat = 0.7) { UIImpactFeedbackGenerator(style: .rigid).impactOccurred(intensity: intensity) }
}
