import SwiftUI

// Motion: the launch splash, and the mascot's reactions. Only the mascot moves, and only once, at a moment
// that matters (a right or wrong answer, a combo, a finished round, the first visit, a hard question);
// the rest of the app stays still. With Reduce Motion (Settings › Accessibility › Motion) only the pose changes.

// MARK: Splash

/// Starts exactly like the static launch screen (same colour, the same cut-out mascot in the same spot).
/// Only the mascot moves: it hops, then waves; the name fades in and the splash fades into the app.
struct SplashView: View {
    let done: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var waving = false
    @State private var nameIn = false
    @State private var leaving = false

    var body: some View {
        ZStack {
            Color("LaunchBackground").ignoresSafeArea()
            Group {
                if waving {
                    MascotActor(pose: .wave, moment: .greet, size: 200)
                } else {
                    MascotActor(pose: .idle, moment: .hop, size: 200, shadow: false, delay: 0.12)
                }
            }
            .frame(width: 200, height: 200)
            .overlay(alignment: .bottom) {
                VStack(spacing: 6) {
                    Text("Nedfa").font(.game(46, .black)).foregroundStyle(Color.brand)
                    Text("Nederlands van nul tot B1").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                }
                .fixedSize()
                .offset(y: 96)
                .opacity(nameIn ? 1 : 0)
            }
        }
        .opacity(leaving ? 0 : 1)
        .accessibilityHidden(true)
        .task { await play() }
    }

    private func play() async {
        if reduceMotion {
            withAnimation(.easeOut(duration: 0.25)) { nameIn = true }
            try? await Task.sleep(for: .milliseconds(700))
        } else {
            try? await Task.sleep(for: .milliseconds(820))
            Haptics.soft()
            waving = true
            withAnimation(.easeOut(duration: 0.35)) { nameIn = true }
            try? await Task.sleep(for: .milliseconds(1000))
        }
        withAnimation(.easeIn(duration: 0.3)) { leaving = true }
        try? await Task.sleep(for: .milliseconds(310))
        done()
    }
}

/// One frame of a hop: squash, stretch, height and tilt.
struct Pose {
    var scaleX: CGFloat = 1
    var scaleY: CGFloat = 1
    var y: CGFloat = 0
    var angle: Double = 0
}

// MARK: Mascot moments

/// The cut-out mascot (no tile behind it) in one pose.
enum MascotPose: String { case idle, cheer, oops, think, wave }

/// One short reaction, played once when the mascot appears.
enum MascotMoment {
    /// Right answer: crouch, jump, land.
    case hop
    /// 3, 5, 10… in a row, and a finished round: two jumps, the second higher.
    case doubleHop
    /// Wrong answer: a short head shake.
    case nope
    /// First visit: a small hello bounce.
    case greet
    /// A card you got wrong before: tilts its head and keeps thinking.
    case ponder

    fileprivate func steps(height h: CGFloat) -> [(Double, Pose)] {
        switch self {
        case .hop: [
            (0.1, Pose(scaleX: 1.12, scaleY: 0.86)),
            (0.2, Pose(scaleX: 0.93, scaleY: 1.1, y: -h, angle: -4)),
            (0.18, Pose(scaleX: 1.1, scaleY: 0.9, angle: 2)),
            (0.3, Pose()),
        ]
        case .doubleHop: [
            (0.09, Pose(scaleX: 1.1, scaleY: 0.88)),
            (0.16, Pose(scaleX: 0.95, scaleY: 1.08, y: -h * 0.6)),
            (0.15, Pose(scaleX: 1.08, scaleY: 0.92)),
            (0.18, Pose(scaleX: 0.92, scaleY: 1.1, y: -h, angle: -8)),
            (0.18, Pose(scaleX: 1.12, scaleY: 0.88, angle: 3)),
            (0.3, Pose()),
        ]
        case .nope: [
            (0.08, Pose(y: 2, angle: -7)),
            (0.11, Pose(y: 3, angle: 6)),
            (0.11, Pose(y: 3, angle: -4)),
            (0.11, Pose(y: 2, angle: 2)),
            (0.22, Pose()),
        ]
        case .greet: [
            (0.2, Pose(y: -h * 0.3, angle: -3)),
            (0.2, Pose(scaleX: 1.04, scaleY: 0.96)),
            (0.25, Pose()),
        ]
        case .ponder: [
            (0.18, Pose(angle: -6)),
            (0.32, Pose(angle: -3)),
        ]
        }
    }
}

/// The mascot cut out (only the character moves, never a picture frame), standing on a soft shadow.
/// `moment` plays once when it appears; without one it simply stands still.
struct MascotActor: View {
    let pose: MascotPose
    var moment: MascotMoment? = nil
    var size: CGFloat = 120
    /// Little stars fly out at the top of the jump (a finished round).
    var stars = false
    /// The soft shadow under its feet (off where the picture must match the static launch screen).
    var shadow = true
    var delay: Double = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var now = Pose()
    @State private var burst = false

    private static let cache = NSCache<NSString, UIImage>()
    private static func image(_ pose: MascotPose) -> UIImage? {
        if let cached = cache.object(forKey: pose.rawValue as NSString) { return cached }
        guard let base = Bundle.main.resourceURL, let image = UIImage(contentsOfFile: base.appending(path: "illustrations/mascot-cut/\(pose.rawValue).png").path()) else { return nil }
        cache.setObject(image, forKey: pose.rawValue as NSString)
        return image
    }

    var body: some View {
        // The shadow shrinks while the mascot is in the air.
        let lift = min(1, max(0, -now.y / (size * 0.3)))
        ZStack(alignment: .bottom) {
            Ellipse().fill(.black.opacity(shadow ? 0.2 - 0.1 * lift : 0))
                .frame(width: size * 0.52 * (1 - 0.4 * lift), height: size * 0.075)
                .blur(radius: 3)
                .offset(y: -size * 0.04)
            Group {
                if let image = Self.image(pose) {
                    Image(uiImage: image).resizable().scaledToFit()
                        // The thinking pose was drawn a little smaller than the others.
                        .scaleEffect(pose == .think ? 1.14 : 1, anchor: UnitPoint(x: 0.5, y: 0.85))
                        .offset(y: pose == .think ? size * 0.05 : 0)
                } else {
                    Mascot(mood: pose == .cheer ? .cheer : pose == .think || pose == .oops ? .think : .wave, size: size)
                }
            }
            .frame(width: size, height: size)
            .scaleEffect(x: now.scaleX, y: now.scaleY, anchor: UnitPoint(x: 0.5, y: 0.92))
            .rotationEffect(.degrees(now.angle), anchor: UnitPoint(x: 0.5, y: 0.92))
            .offset(y: now.y)
        }
        .frame(width: size, height: size)
        .overlay { if stars && burst { StarBurst(radius: size * 0.6).offset(y: -size * 0.15) } }
        .accessibilityHidden(true)
        .task { await play() }
    }

    private func play() async {
        guard let moment, !reduceMotion else { return }
        if delay > 0 { try? await Task.sleep(for: .seconds(delay)) }
        let steps = moment.steps(height: size * 0.3)
        for (index, (duration, pose)) in steps.enumerated() {
            let last = index == steps.count - 1
            withAnimation(last ? .spring(response: duration, dampingFraction: 0.55) : .easeInOut(duration: duration)) { now = pose }
            if stars, moment == .doubleHop, index == 3 { burst = true }
            try? await Task.sleep(for: .seconds(duration))
        }
    }
}

/// Stars that fly out once and fade.
private struct StarBurst: View {
    var radius: CGFloat
    @State private var out = false
    var body: some View {
        ZStack {
            ForEach(0..<9, id: \.self) { index in
                let angle = Double(index) / 9 * 2 * .pi - .pi / 2
                Image(systemName: index.isMultiple(of: 2) ? "star.fill" : "sparkle")
                    .font(.system(size: index.isMultiple(of: 2) ? 16 : 12, weight: .bold))
                    .foregroundStyle(index.isMultiple(of: 3) ? Color.mint : Color.butter)
                    .offset(x: out ? cos(angle) * radius : 0, y: out ? sin(angle) * radius : 0)
                    .scaleEffect(out ? 1 : 0.4)
                    .opacity(out ? 0 : 1)
            }
        }
        .allowsHitTesting(false)
        .onAppear { withAnimation(.easeOut(duration: 0.85)) { out = true } }
    }
}

// MARK: Haptics

extension Haptics {
    static func soft() { UIImpactFeedbackGenerator(style: .soft).impactOccurred() }
}
