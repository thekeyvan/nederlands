import SwiftUI

// Onregelmatig, under Leren › Grammatica: strong verbs by sound pattern, plurals, comparisons and present-tense forms.
// The same sets, rounds and stars as the website.

struct IrregularLink: Hashable {}
struct IrregularSetLink: Hashable { let id: String }

/// The card at the top of Grammatica that opens Onregelmatig.
struct IrregularBanner: View {
    @State private var progress = Learner.shared
    var body: some View {
        let irregular = Content.shared.irregular
        let known = irregular.cards.filter { Irregular.known(progress.reviews[$0.id]) }.count
        // A hidden link behind the card: in a List a visible NavigationLink adds its own chevron and drops the card's look.
        HStack(spacing: 14) {
            MascotActor(pose: .think, size: 72)
            VStack(alignment: .leading, spacing: 3) {
                Text("Onregelmatig").font(.game(20, .black)).foregroundStyle(Color.goldInk)
                Text("Sterke werkwoorden, meervouden en meer: leer ze als rijtje.").font(.subheadline.weight(.medium)).foregroundStyle(Color.primary.opacity(0.8))
                    .fixedSize(horizontal: false, vertical: true)
                Text(known > 0 ? "\(known) van \(irregular.cards.count) vormen gekend" : "\(irregular.sets.count) sets · \(irregular.cards.count) vormen")
                    .font(.caption.weight(.bold)).foregroundStyle(.secondary).monospacedDigit()
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.headline).foregroundStyle(Color.goldInk)
        }
        .padding(14)
        .tile(radius: 22, fill: .butterSoft, edge: .butter)
        .background(NavigationLink(value: IrregularLink()) { EmptyView() }.opacity(0))
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
    }
}

/// All sets, the total, and one button: review what is due, or carry on with the next set.
struct IrregularOverview: View {
    @State private var progress = Learner.shared
    private let session = PracticeSession.shared

    var body: some View {
        let irregular = Content.shared.irregular
        let reviews = progress.reviews
        let known = irregular.cards.filter { Irregular.known(reviews[$0.id]) }.count
        let due = irregular.cards.filter { reviews[$0.id].map { $0.due <= .now } ?? false }.count
        let practised = irregular.cards.contains { reviews[$0.id] != nil }
        let next = irregular.sets.first { Irregular.progress($0, reviews: reviews).stars < 2 } ?? irregular.sets.first
        List {
            Section {
                HStack(spacing: 14) {
                    MascotActor(pose: .think, size: 84)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Onregelmatig").font(.game(26, .black))
                        Text("Wat je uit je hoofd leert. Eerst kies je, daarna typ je. Wat je fout had, komt terug.").font(.footnote).foregroundStyle(.secondary)
                    }
                }
                VStack(alignment: .leading, spacing: 8) {
                    HStack { Text("Gekend").font(.headline); Spacer(); Text("\(known) / \(irregular.cards.count)").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary).monospacedDigit() }
                    ThickProgress(value: Double(known) / Double(max(1, irregular.cards.count)), color: .butter, height: 12)
                    Persian(text: irregular.intro, font: .footnote)
                }
                .padding(.vertical, 4)
            }
            Section("Sterke werkwoorden") { rows(irregular.sets.filter { $0.group == "werkwoorden" }, reviews: reviews) }
            Section("Ook onregelmatig") { rows(irregular.sets.filter { $0.group != "werkwoorden" }, reviews: reviews) }
        }
        .navigationTitle("Onregelmatig")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            Group {
                if due > 0 {
                    Button { session.start(irregular: "all", label: "Onregelmatig") } label: { Label("Herhaal · \(min(due, 10))", systemImage: "arrow.counterclockwise") }
                } else if let next {
                    Button { session.start(irregular: next.id, label: next.title) } label: { Label("\(practised ? "Ga verder" : "Begin"): \(next.title)", systemImage: "bolt.fill").lineLimit(1) }
                }
            }
            .buttonStyle(GameButtonStyle()).padding().background(.bar)
        }
        .feedbackScreen("Onregelmatig")
    }

    private func rows(_ sets: [IrregularData.Set], reviews: [String: Review]) -> some View {
        ForEach(sets) { set in
            let item = Irregular.progress(set, reviews: reviews)
            NavigationLink(value: IrregularSetLink(id: set.id)) {
                HStack(spacing: 12) {
                    Text(set.level).font(.caption.weight(.bold)).frame(width: 34, height: 24).background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 6))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(set.title).font(.body.weight(.semibold)).lineLimit(1)
                        Text(set.pattern).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    }
                    Spacer()
                    if item.done > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            StarsView(count: item.stars)
                            Text(item.due > 0 ? "\(item.due) te herhalen" : "\(item.known)/\(item.total)").font(.caption2).foregroundStyle(.secondary).monospacedDigit()
                        }
                    } else {
                        Text("\(item.total) vormen").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

/// One set: the pattern, the rule, the rows to read through, and a round of ten.
struct IrregularSetView: View {
    let setId: String
    @State private var progress = Learner.shared
    private let session = PracticeSession.shared

    var body: some View {
        if let set = Content.shared.irregularSet(setId) {
            let reviews = progress.reviews
            let item = Irregular.progress(set, reviews: reviews)
            let cards = Content.shared.irregularCards(in: set)
            List {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(set.level).font(.caption.weight(.bold)).foregroundStyle(.secondary)
                        Text(set.title).font(.game(26, .black))
                        Text(set.pattern).font(.system(.footnote, design: .monospaced)).padding(10).frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 10))
                        Persian(text: set.rule, font: .body)
                    }
                    HStack {
                        StarsView(count: item.stars, size: .body)
                        Text("\(item.known) van \(item.total) gekend").font(.subheadline.weight(.semibold)).monospacedDigit()
                        Spacer()
                        if item.due > 0 { Text("\(item.due) te herhalen").font(.caption.weight(.bold)).padding(.horizontal, 8).padding(.vertical, 3).background(Color.butterSoft, in: Capsule()).foregroundStyle(Color.goldInk) }
                    }
                }
                Section {
                    ForEach(set.rows, id: \.id) { row in
                        let rowCards = cards.filter { $0.title == row.cells[0] && (set.kind != "present" || ($0.prompt ?? "").replacingOccurrences(of: "___", with: $0.answer ?? "") == row.cells[1]) }
                        let all = !rowCards.isEmpty && rowCards.allSatisfy { Irregular.known(reviews[$0.id]) }
                        HStack(alignment: .top, spacing: 10) {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(row.cells.joined(separator: " · ")).font(.body.weight(.semibold))
                                Persian(text: row.fa, font: .footnote).frame(maxWidth: .infinity, alignment: .leading)
                            }
                            if all { Image(systemName: "checkmark").foregroundStyle(Color.success).accessibilityLabel("Gekend") }
                        }
                        .padding(.vertical, 2)
                    }
                } header: {
                    Text(set.kind == "verb" ? "Werkwoord · verleden tijd · voltooid (met hij)" : set.kind == "compare" ? "Woord · meer · meest" : set.kind == "plural" ? "Eén · meer" : "Zo zeg je het")
                }
                NeededInSection(themes: LearningPath.themes(forIrregular: set.id))
            }
            .navigationTitle(set.title)
            .navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                Button { session.start(irregular: set.id, label: set.title) } label: {
                    Label("\(item.due > 0 ? "Herhaal" : item.done < item.total ? "Oefen" : "Nog een keer") · \(min(10, item.total))", systemImage: "bolt.fill")
                }
                .buttonStyle(GameButtonStyle()).padding().background(.bar)
            }
            .feedbackScreen("Onregelmatig: \(set.title)")
        }
    }
}
