import SwiftUI

/// Vandaag: today's newest news video, matched to the learner's level. The learner ticks it off,
/// because the app can't see what happens in YouTube.
struct NewsCard: View {
    let level: String?
    @State private var news = NewsToday.shared
    @Environment(\.openURL) private var openURL

    var body: some View {
        let show = NewsShow.forLevel(level)
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle("Nieuws van vandaag")
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    tile
                    VStack(alignment: .leading, spacing: 2) {
                        switch news.state {
                        case .idle:
                            Text(show.title).font(.game(16))
                            Text("\(show.detail) · \(show.minutes) min").font(.caption).foregroundStyle(.secondary)
                        case .asked:
                            Text("Heb je het gekeken?").font(.game(16))
                            Text("Vertel in 3 zinnen wat er gebeurde.").font(.caption).foregroundStyle(.secondary)
                        case .done:
                            Text("Gekeken").font(.game(16))
                            Text("Twee keer kijken helpt. Morgen is er weer nieuw nieuws.").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Spacer(minLength: 0)
                }
                switch news.state {
                case .idle:
                    Text(NewsShow.tip)
                        .font(.subheadline)
                        .foregroundStyle(Color.goldInk)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .multilineTextAlignment(.trailing)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Color.butterSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    Button { open(show) } label: { Label("Kijk het nieuws", systemImage: "arrow.up.right") }
                        .buttonStyle(GameButtonStyle(height: 50))
                    HStack(spacing: 6) {
                        Text("Ook:")
                        ForEach(Array(NewsShow.all.filter { $0 != show }.enumerated()), id: \.element.id) { index, other in
                            if index > 0 { Text("·") }
                            Button(other.short) { open(other) }.fontWeight(.semibold)
                        }
                    }
                    .font(.caption).foregroundStyle(.secondary).tint(.secondary)
                    .frame(maxWidth: .infinity)
                case .asked:
                    HStack(spacing: 10) {
                        Button("Ja, gekeken") { Haptics.success(); news.mark(.done) }
                            .buttonStyle(GameButtonStyle(color: .mint, edge: .mintEdge, height: 50))
                        Button("Nog niet") { news.mark(.idle) }
                            .font(.game(17, .bold)).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, minHeight: 50)
                    }
                case .done:
                    // Watching again stays possible; the card stays ticked off.
                    Button { open(show) } label: { Label("Nog een keer kijken", systemImage: "arrow.up.right") }
                        .buttonStyle(GameButtonStyle(color: .surface, edge: .edge, foreground: .primary, height: 46))
                }
            }
            .card(padding: 14)
            .padding(.horizontal, 20)
        }
        .task { await NewsLinks.load() }
    }

    private var tile: some View {
        let done = news.state == .done
        return Image(systemName: done ? "checkmark" : "tv")
            .font(.system(size: 20, weight: .bold))
            .foregroundStyle(done ? Color.success : Color.butter)
            .frame(width: 44, height: 44)
            .background(done ? Color.mintSoft : Color.navy, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .accessibilityHidden(true)
    }

    /// Opens today's newest video (in the YouTube app when it's installed), with the channel's videos as playlist.
    private func open(_ show: NewsShow) {
        Haptics.tap()
        Analytics.shared.event("nieuws", ["journaal": show.id])
        if news.state != .done { news.mark(.asked) }
        Task { openURL(await NewsLinks.url(for: show)) }
    }
}
