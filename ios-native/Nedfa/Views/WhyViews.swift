import SwiftUI

// "Waarom?": the reason behind an answer, after every exercise. The same on the website and Android:
// a wrong answer shows the reason in its feedback panel; a right answer with a reason shows a slim green bar
// that goes on by itself after 3 s unless you tap "Waarom?".

/// Persian text with the Dutch in **bold**; the Dutch keeps its Unicode isolates, so it stays left to right.
struct WhyText: View {
    let text: String
    var font: Font = .subheadline
    var color: Color = .primary

    var body: some View {
        Text(Self.attributed(text)).font(font).foregroundStyle(color).lineSpacing(3)
            .multilineTextAlignment(.leading)
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
            .environment(\.layoutDirection, .rightToLeft)
    }

    /// Only the ** markers go; every other character stays.
    static func attributed(_ text: String) -> AttributedString {
        var result = AttributedString()
        for (index, part) in text.components(separatedBy: "**").enumerated() where !part.isEmpty {
            var piece = AttributedString(part)
            if index % 2 == 1 { piece.inlinePresentationIntent = .stronglyEmphasized }
            result += piece
        }
        return result
    }
}

/// The rule's name as a small orange pill, e.g. "’t kofschip".
struct WhyTag: View {
    let tag: String
    var body: some View {
        Text(tag).font(.caption.weight(.bold)).lineLimit(1).truncationMode(.tail)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(Color.brand.opacity(0.15), in: Capsule()).foregroundStyle(Color.brandEdge)
            .environment(\.locale, Locale(identifier: "nl"))
    }
}

enum WhyTone { case success, close, wrong }

/// "Waarom?" with the rule's name and one or two Persian sentences: a white card inside a feedback panel.
struct WhyCard: View {
    let why: Why
    var tone: WhyTone = .wrong

    var body: some View {
        let ink: Color = tone == .success ? .success : tone == .close ? .goldInk : .brand
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: "info.circle.fill").font(.subheadline).foregroundStyle(ink)
                Text("Waarom?").font(.caption.weight(.heavy)).foregroundStyle(ink)
                Spacer(minLength: 8)
                WhyTag(tag: why.tag)
            }
            WhyText(text: why.fa)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}

/// The pill that opens the reason after a right answer.
struct WhyButton: View {
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Label("Waarom?", systemImage: "questionmark.circle").font(.subheadline.weight(.bold))
                .padding(.horizontal, 14).frame(minHeight: 40)
                .background(Capsule().fill(Color.surface))
                .overlay(Capsule().strokeBorder(Color.mint, lineWidth: 2))
                .foregroundStyle(Color.success)
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

/// After a right answer that has a reason: "Goed!", a Waarom? button and a thin line that empties in `delay` seconds;
/// then the game goes on by itself. Waarom? stops the clock and shows the reason with a Verder button.
/// With VoiceOver on nothing goes on by itself.
struct CorrectBar: View {
    let why: Why
    var delay: Double = 3
    let next: () -> Void
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver
    @State private var open = false
    @State private var running = false
    @State private var finished = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Text("Goed!").font(.game(22, .black)).foregroundStyle(Color.success)
                Spacer(minLength: 8)
                if !open { WhyButton { open = true } }
            }
            if open || voiceOver {
                if open { WhyCard(why: why, tone: .success) }
                Button(action: go) { HStack { Text("Verder"); Image(systemName: "arrow.right") } }
                    .buttonStyle(GameButtonStyle(color: .mint, edge: .mintEdge))
            } else {
                Capsule().fill(Color.mint.opacity(0.25)).frame(height: 4)
                    .overlay(alignment: .leading) { Capsule().fill(Color.mint).scaleEffect(x: running ? 0.001 : 1, anchor: .leading) }
                    .accessibilityHidden(true)
                    .padding(.bottom, 6)
            }
        }
        .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 10)
        .background(
            UnevenRoundedRectangle(topLeadingRadius: 24, topTrailingRadius: 24, style: .continuous)
                .fill(Color.mintSoft)
                .shadow(color: .black.opacity(0.08), radius: 16, y: -4)
                .ignoresSafeArea(edges: .bottom)
        )
        .onAppear { withAnimation(.linear(duration: delay)) { running = true } }
        .task(id: open) {
            guard !open, !voiceOver else { return }
            try? await Task.sleep(for: .seconds(delay))
            guard !Task.isCancelled, !open else { return }
            go()
        }
    }

    private func go() {
        guard !finished else { return }
        finished = true
        next()
    }
}

/// What was typed, with the letters that differ from the answer struck through on light red.
struct TypedDiff: View {
    let typed: String
    let answer: String
    var body: some View {
        var text = AttributedString()
        for part in Why.diff(typed, answer) {
            var piece = AttributedString(part.text)
            if part.wrong {
                piece.backgroundColor = Color.danger.opacity(0.22)
                piece.strikethroughStyle = Text.LineStyle(pattern: .solid, color: .danger)
                piece.foregroundColor = Color.danger
            }
            text += piece
        }
        return HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text("Jij typte:").font(.subheadline).foregroundStyle(.secondary)
            Text(text).font(.headline)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Jij typte: \(typed)")
    }
}

/// A game's panel after a wrong (or almost right) answer that has a reason: the right answer, the reason, and Verder.
struct GameFeedbackPanel: View {
    var close = false
    var answer: String? = nil
    var typed: String? = nil
    var expected: String? = nil
    let why: Why
    let next: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(close ? "Bijna! Kleine typfout." : "Bijna! Zo is het goed:").font(.game(20, .black)).foregroundStyle(close ? Color.goldInk : Color.danger)
            if let answer { Text(answer).font(.headline) }
            if let typed, let expected, !typed.isEmpty { TypedDiff(typed: typed, answer: expected) }
            WhyCard(why: why, tone: close ? .close : .wrong)
            Button(action: next) { HStack { Text("Verder"); Image(systemName: "arrow.right") } }
                .buttonStyle(GameButtonStyle(color: close ? .brand : .danger, edge: close ? .brandEdge : .dangerEdge))
        }
        .padding(20)
        .background(
            UnevenRoundedRectangle(topLeadingRadius: 28, topTrailingRadius: 28, style: .continuous)
                .fill(close ? Color.butterSoft : Color.dangerSoft)
                .shadow(color: .black.opacity(0.08), radius: 16, y: -4)
                .ignoresSafeArea(edges: .bottom)
        )
    }
}
