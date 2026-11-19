import SwiftUI

/// The coordinate space of an OrderCard: tiles, the sentence and the finger are all measured in it.
private let orderSpace = "order-card"

/// Zinnen bouwen and the "order" exercise of a round: put the word tiles in the right order.
/// Tap a word in the bank to add it at the end, tap a word in the sentence to send it back (the accessible way).
/// Or drag: from the bank to any place in the sentence (the other words move aside and an orange slot shows where
/// it lands), within the sentence to reorder, and out of the sentence to send it back.
struct OrderCard: View {
    let card: Card
    let outcome: Outcome?
    let answer: (Outcome) -> Void
    /// The tiles in the sentence, in order (indices into `order.tiles`).
    @State private var chosen: [Int] = []
    /// Where every tile is now, in the card's coordinate space.
    @State private var frames: [Int: CGRect] = [:]
    @State private var sentenceFrame: CGRect = .zero
    @State private var drag: TileDrag?
    /// True only while a finger is down: a drag the system cancels never leaves a tile hanging.
    @GestureState private var dragging = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// The tile being dragged: where it was picked up, where the finger holds it, and where the finger is now.
    struct TileDrag: Equatable {
        let tile: Int
        let fromSentence: Bool
        let frame: CGRect
        let grab: CGSize
        var location: CGPoint
        /// The middle of the lifted tile, which decides where it lands.
        var center: CGPoint { CGPoint(x: location.x - grab.width + frame.width / 2, y: location.y - grab.height + frame.height / 2) }
    }

    private enum Item: Hashable { case tile(Int), slot }

    var body: some View {
        if let order = card.order {
            let active = dragging ? drag : nil
            let slot = active.flatMap(insertion)
            VStack(alignment: .leading, spacing: 20) {
                Text("Zet de woorden in de goede volgorde").font(.headline).foregroundStyle(.secondary)
                if let translation = card.translation { Persian(text: translation, font: .title3, color: .primary) }
                sentence(order, active: active, slot: slot)
                FlowLayout {
                    ForEach(order.tiles.indices.filter { !chosen.contains($0) }, id: \.self) { index in
                        movable(bankTile(order.tiles[index]), tile: index, fromSentence: false) { chosen.append(index) }
                            .opacity(active?.tile == index ? 0.3 : 1)
                            .accessibilityHint("Zet in de zin")
                    }
                }
                if outcome == nil {
                    HStack {
                        Button("Terug") { _ = chosen.popLast() }.buttonStyle(.bordered).disabled(chosen.isEmpty)
                        Button("Controleer") {
                            let words = chosen.map { order.tiles[$0] }
                            let right = Answer.normalize(words.joined(separator: " ")) == Answer.normalize(order.answer.joined(separator: " "))
                            answer(Outcome(grade: right ? 4 : 1, correct: right, result: right ? .correct : .wrong, why: order.why))
                        }
                        .buttonStyle(GameButtonStyle()).disabled(chosen.count < order.tiles.count)
                    }
                }
            }
            .coordinateSpace(.named(orderSpace))
            .overlay(alignment: .topLeading) {
                if let active {
                    // The lifted tile: a little larger, a little tilted, with a shadow.
                    Group { if active.fromSentence { sentenceTile(order.tiles[active.tile]) } else { bankTile(order.tiles[active.tile]) } }
                        .background(Color.surface.opacity(0.001))
                        .scaleEffect(1.08)
                        .rotationEffect(.degrees(3))
                        .shadow(color: .black.opacity(0.22), radius: 10, y: 6)
                        .position(active.center)
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }
            .onChange(of: dragging) { _, now in if !now { drag = nil } }
        }
    }

    // MARK: Parts

    private func sentence(_ order: Card.Order, active: TileDrag?, slot: Int?) -> some View {
        // The dragged tile stays in the view tree (collapsed and invisible) so its drag keeps going.
        let others = chosen.filter { $0 != active?.tile }
        var items: [Item] = others.map { .tile($0) }
        if let slot { items.insert(.slot, at: min(slot, items.count)) }
        if let active, active.fromSentence { items.append(.tile(active.tile)) }
        return FlowLayout {
            Text(order.first).font(.headline).padding(.horizontal, 12).padding(.vertical, 8).background(Color.navy, in: RoundedRectangle(cornerRadius: 10)).foregroundStyle(.white)
            ForEach(items, id: \.self) { item in
                switch item {
                case .slot:
                    // Where the word lands: an orange dashed space the size of the word.
                    sentenceTile(active.map { order.tiles[$0.tile] } ?? "").hidden()
                        .overlay(RoundedRectangle(cornerRadius: 10).fill(Color.brand.opacity(0.08)))
                        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(Color.brand, style: StrokeStyle(lineWidth: 2, dash: [5])))
                        .accessibilityHidden(true)
                case .tile(let index):
                    let lifted = active?.tile == index
                    movable(sentenceTile(order.tiles[index]), tile: index, fromSentence: true) { chosen.removeAll { $0 == index } }
                        .opacity(lifted ? 0 : 1)
                        .layoutValue(key: FlowCollapsed.self, value: lifted)
                        .accessibilityHint("Zet terug")
                }
            }
            if !order.ending.isEmpty { Text(order.ending).font(.title3.bold()).foregroundStyle(.secondary) }
        }
        .animation(reduceMotion ? nil : .snappy(duration: 0.2), value: slot)
        .padding(12).frame(maxWidth: .infinity, minHeight: 80, alignment: .topLeading)
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(outcome.map { $0.correct ? Color.success : Color.danger } ?? (slot != nil ? Color.brand : Color(.separator)), style: StrokeStyle(lineWidth: 2, dash: [6])))
        .onGeometryChange(for: CGRect.self) { $0.frame(in: .named(orderSpace)) } action: { sentenceFrame = $0 }
    }

    private func sentenceTile(_ word: String) -> some View {
        Text(word).font(.headline).padding(.horizontal, 12).padding(.vertical, 8)
            .foregroundStyle(outcome == nil ? Color.brand : Color.secondary)
            .background(Color.brand.opacity(0.15), in: RoundedRectangle(cornerRadius: 10))
    }

    private func bankTile(_ word: String) -> some View {
        Text(word).font(.title3.weight(.semibold)).padding(.horizontal, 14).padding(.vertical, 10)
            .foregroundStyle(.primary)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
    }

    /// A tile you can tap and drag. Only one tile moves at a time.
    private func movable(_ tile: some View, tile index: Int, fromSentence: Bool, tap: @escaping () -> Void) -> some View {
        tile
            .contentShape(RoundedRectangle(cornerRadius: 12))
            .onGeometryChange(for: CGRect.self) { $0.frame(in: .named(orderSpace)) } action: { frames[index] = $0 }
            .onTapGesture { if outcome == nil, drag == nil { tap() } }
            .gesture(
                DragGesture(minimumDistance: 6, coordinateSpace: .named(orderSpace))
                    .updating($dragging) { _, state, _ in state = true }
                    .onChanged { value in
                        guard outcome == nil else { return }
                        if let current = drag, current.tile == index {
                            drag?.location = value.location
                        } else {
                            let frame = frames[index] ?? CGRect(origin: value.startLocation, size: .zero)
                            drag = TileDrag(tile: index, fromSentence: fromSentence, frame: frame,
                                            grab: CGSize(width: value.startLocation.x - frame.minX, height: value.startLocation.y - frame.minY),
                                            location: value.location)
                            Haptics.tap()
                        }
                    }
                    .onEnded { value in
                        guard var current = drag, current.tile == index else { return }
                        current.location = value.location
                        drop(current)
                    }
            )
            .allowsHitTesting(outcome == nil && (drag == nil || drag?.tile == index))
            .accessibilityAddTraits(.isButton)
            .accessibilityAction { if outcome == nil { tap() } }
    }

    // MARK: Dragging

    /// Where in the sentence a tile held at its middle would land: the number of words before that point.
    /// Nil when the tile is not over the sentence.
    private func insertion(for drag: TileDrag) -> Int? {
        let point = drag.center
        guard sentenceFrame.width > 0, sentenceFrame.insetBy(dx: -16, dy: -30).contains(point) else { return nil }
        return chosen.filter { $0 != drag.tile }.filter { index in
            guard let frame = frames[index] else { return false }
            // On a line above the point, or on the same line and left of it.
            return point.y > frame.maxY + 4 || (point.y >= frame.minY - 4 && point.x > frame.midX)
        }.count
    }

    private func drop(_ drag: TileDrag) {
        let target = insertion(for: drag)
        var words = chosen.filter { $0 != drag.tile }
        if let target { words.insert(drag.tile, at: min(target, words.count)) }
        Haptics.tap()
        // Dropped outside the sentence: a word from the bank stays there, a word from the sentence goes back.
        if target == nil && !drag.fromSentence { self.drag = nil; return }
        withAnimation(reduceMotion ? nil : .snappy(duration: 0.2)) {
            chosen = words
            self.drag = nil
        }
    }
}

/// A tile that is being dragged out of the sentence: it takes no room, so the other words close up.
struct FlowCollapsed: LayoutValueKey {
    static let defaultValue = false
}
