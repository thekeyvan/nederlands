import SwiftUI

// The animated splash at launch: the only animation in the app for now (the screens themselves stay still).
// With Reduce Motion (Settings › Accessibility › Motion) it simply fades.

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
}

// MARK: Haptics

extension Haptics {
    static func soft() { UIImpactFeedbackGenerator(style: .soft).impactOccurred() }
}
