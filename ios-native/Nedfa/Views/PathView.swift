import SwiftUI

// The path in Leren, the five steps of a situation, Vandaag's "Volgende stap" card and "Nodig bij" links.
// The same structure as the website (src/components/path/path-ui.tsx).

/// Five short bars: done, the next one, still to come.
struct StepDots: View {
    let steps: [LearningPath.Step]
    /// Marks the next step (on the situation you are on, or one you have started).
    var active = false
    var body: some View {
        let next = active || steps.contains { $0.done > 0 } ? LearningPath.next(steps)?.id : nil
        HStack(spacing: 4) {
            ForEach(steps) { step in
                Capsule().fill(step.complete ? Color.mint : step.id == next ? Color.brand : Color.track).frame(width: 16, height: 6)
            }
        }
        .accessibilityLabel("\(steps.filter(\.complete).count) van \(steps.count) stappen klaar")
    }
}

/// Leren › Pad: all situations in order, grouped, with where you are.
struct PathView: View {
    @State private var progress = Learner.shared
    @State private var preferences = Preferences.shared
    @State private var query = ""

    var body: some View {
        let reviews = progress.reviews
        let current = LearningPath.current(reviews: reviews, events: progress.events, level: preferences.level)
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        ScrollViewReader { reader in
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Elke situatie heeft vijf stappen: woorden, zinnen, de grammatica die je erbij nodig hebt, een gesprek en een eindspel.")
                        .font(.subheadline).foregroundStyle(.secondary).padding(.horizontal, 20)
                    SearchField(prompt: "Zoek bijvoorbeeld huisarts", text: $query).padding(.horizontal, 20)
                    ForEach(LearningPath.sections, id: \.section.id) { item in
                        let themes = item.themes.filter { needle.isEmpty || "\($0.title) \($0.meaning) \($0.intro)".lowercased().contains(needle) }
                        if !themes.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Eyebrow(item.section.title)
                                    Spacer()
                                    Text(item.section.level).font(.caption.weight(.bold)).padding(.horizontal, 8).padding(.vertical, 2)
                                        .overlay(Capsule().stroke(Color.edge, lineWidth: 1)).foregroundStyle(.secondary)
                                }
                                .padding(.horizontal, 24)
                                ForEach(themes) { theme in
                                    node(theme, steps: LearningPath.steps(for: theme.id, reviews: reviews), current: theme.id == current).id(theme.id)
                                }
                            }
                        }
                    }
                }
                .padding(.vertical, 12)
            }
            .scrollDismissesKeyboard(.immediately)
            .onAppear { reader.scrollTo(current, anchor: .center) }
        }
    }

    private func node(_ theme: Theme, steps: [LearningPath.Step], current: Bool) -> some View {
        let complete = steps.allSatisfy(\.complete)
        let started = steps.contains { $0.done > 0 }
        return NavigationLink(value: theme) {
            HStack(spacing: 12) {
                Art(name: "themes/\(theme.id)", size: 52, corner: 14)
                    .opacity(started || current ? 1 : 0.75)
                    .overlay(alignment: .bottomTrailing) {
                        if complete { Image(systemName: "checkmark.circle.fill").font(.body).foregroundStyle(.white, Color.mint).offset(x: 4, y: 4) }
                    }
                VStack(alignment: .leading, spacing: 4) {
                    Text(theme.title).font(.game(16, .heavy)).foregroundStyle(Color.primary).lineLimit(1)
                    Text(theme.meaning).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    StepDots(steps: steps, active: current)
                }
                Spacer(minLength: 0)
                if current {
                    Text("Hier ben je").font(.caption.weight(.bold)).padding(.horizontal, 8).padding(.vertical, 3).background(Color.brand.opacity(0.15), in: Capsule()).foregroundStyle(Color.brand)
                } else if complete {
                    Text("Klaar").font(.caption.weight(.bold)).foregroundStyle(Color.success)
                } else if started, let step = LearningPath.next(steps) {
                    Text("Stap \(step.number)").font(.caption).foregroundStyle(.secondary)
                }
                Image(systemName: "chevron.right").font(.footnote.weight(.bold)).foregroundStyle(.tertiary)
            }
            .padding(10)
            .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(current ? Color.brand : .clear, lineWidth: 2.5))
        }
        .buttonStyle(PressableTile(edge: current ? .brandEdge : .edge))
        .padding(.horizontal, 20)
    }
}

/// The five steps of a situation, as list rows on its page. The next one is highlighted; every step can be played.
struct StepRows: View {
    let theme: Theme
    @State private var progress = Learner.shared
    private let session = PracticeSession.shared

    var body: some View {
        let steps = LearningPath.steps(for: theme.id, reviews: progress.reviews)
        let next = LearningPath.next(steps)?.id
        ForEach(steps) { step in
            Button { session.start(step: step.id, of: theme) } label: { row(step, active: step.id == next) }
                .buttonStyle(.plain)
                .listRowBackground(step.id == next ? Color.brand.opacity(0.12) : nil)
            if step.id == .grammatica, !step.rules.isEmpty || step.irregular != nil {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(step.rules) { rule in
                            NavigationLink(value: PatternLink(id: rule.id)) { chip(rule.title ?? "") }.buttonStyle(.plain)
                        }
                        if let set = step.irregular {
                            NavigationLink(value: IrregularSetLink(id: set.id)) { chip("Onregelmatig: \(set.title)", gold: true) }.buttonStyle(.plain)
                        }
                    }
                    .padding(.leading, 58)
                }
                .listRowSeparator(.hidden, edges: .top)
            }
        }
    }

    private func row(_ step: LearningPath.Step, active: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: step.complete ? "checkmark" : step.systemImage)
                .font(.system(size: 17, weight: .bold))
                .frame(width: 44, height: 44)
                .background(step.complete ? Color.mint : active ? Color.brand : Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .foregroundStyle(step.complete || active ? Color.white : Color.secondary)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text("\(step.number)").font(.caption.weight(.bold)).foregroundStyle(.secondary).monospacedDigit()
                    Text(step.title).font(.game(16, .heavy))
                    if active { Text("Volgende").font(.caption2.weight(.bold)).padding(.horizontal, 7).padding(.vertical, 2).background(Color.brand.opacity(0.18), in: Capsule()).foregroundStyle(Color.brand) }
                }
                Text(step.detail).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                if step.total > 1, !step.complete, step.done > 0 {
                    ThickProgress(value: Double(step.done) / Double(step.total), color: .brand, height: 6)
                }
            }
            Spacer(minLength: 0)
            Image(systemName: "play.fill").font(.footnote).foregroundStyle(active ? Color.brand : Color.secondary.opacity(0.5))
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
        .accessibilityHint("Start deze stap")
    }

    private func chip(_ text: String, gold: Bool = false) -> some View {
        Text(text).font(.caption.weight(.semibold)).lineLimit(1)
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(gold ? Color.butterSoft : Color(.tertiarySystemFill), in: Capsule())
            .foregroundStyle(gold ? Color.goldInk : Color.primary)
    }
}

/// Vandaag's main card: the next step on your path, one button.
struct NextStepCard: View {
    let themeId: String
    let today: Int
    let goal: Int
    @State private var progress = Learner.shared
    private let session = PracticeSession.shared

    var body: some View {
        if let theme = Content.shared.theme(themeId) {
            let steps = LearningPath.steps(for: themeId, reviews: progress.reviews)
            let step = LearningPath.next(steps) ?? steps.last
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Eyebrow("Volgende stap", color: .butter)
                    Spacer()
                    Text("Dagdoel \(min(today, goal))/\(goal)").font(.caption.weight(.bold)).foregroundStyle(.white.opacity(0.8)).monospacedDigit()
                }
                NavigationLink(value: theme) {
                    HStack(spacing: 14) {
                        Art(name: "themes/\(theme.id)", size: 72, corner: 18)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(theme.title).font(.game(22, .black)).foregroundStyle(.white).lineLimit(2).multilineTextAlignment(.leading)
                            if let step { Text("Stap \(step.number) van \(steps.count) · \(step.title)").font(.subheadline.weight(.semibold)).foregroundStyle(.white.opacity(0.8)) }
                            StepDots(steps: steps, active: true)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right").font(.footnote.weight(.bold)).foregroundStyle(.white.opacity(0.6))
                    }
                }
                .buttonStyle(.plain)
                Button { if let step { session.start(step: step.id, of: theme) } } label: {
                    HStack { Text(steps.contains { $0.done > 0 } ? "Ga verder" : "Begin"); Image(systemName: "arrow.right") }
                }
                .buttonStyle(GameButtonStyle())
            }
            .padding(20)
            .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color.navy))
        }
    }
}

/// "Nodig bij": the situations a grammar rule or Onregelmatig set belongs to.
struct NeededInSection: View {
    let themes: [Theme]
    var body: some View {
        if !themes.isEmpty {
            Section("Nodig bij") {
                ForEach(themes) { theme in
                    NavigationLink(value: theme) {
                        HStack(spacing: 12) {
                            Art(name: "themes/\(theme.id)", size: 36, corner: 10)
                            Text(theme.title).font(.body.weight(.semibold))
                        }
                    }
                }
            }
        }
    }
}
