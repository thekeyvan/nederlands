import SwiftUI
import UIKit

/// Shake the iPhone (or tap Feedback geven in Instellingen) to send an idea or a problem to nedfa.nl.
/// Every report carries the screen it came from, the app version and the device, and optionally a
/// screenshot, so it can be acted on without asking follow-up questions.
@MainActor
final class Feedback {
    static let shared = Feedback()

    /// The screen the learner is looking at, set with `.feedbackScreen("…")`.
    var screen = "Vandaag"
    /// Extra details for the current screen (e.g. the card id), set with `.feedbackScreen(_:details:)`.
    var details: [String: String] = [:]
    private var presenting = false

    enum Kind: String, CaseIterable, Identifiable {
        case probleem, idee, compliment
        var id: String { rawValue }
        var title: String { switch self { case .probleem: "Probleem"; case .idee: "Idee"; case .compliment: "Compliment" } }
        var icon: String { switch self { case .probleem: "ladybug.fill"; case .idee: "lightbulb.fill"; case .compliment: "heart.fill" } }
        var color: Color { switch self { case .probleem: .danger; case .idee: .butter; case .compliment: .brand } }
        var prompt: String {
            switch self {
            case .probleem: "Wat ging er mis? Wat verwachtte je?"
            case .idee: "Wat zou de app beter of leuker maken?"
            case .compliment: "Wat vind je fijn?"
            }
        }
    }

    static var appVersion: String {
        let info = Bundle.main.infoDictionary
        return "\(info?["CFBundleShortVersionString"] as? String ?? "?") (\(info?["CFBundleVersion"] as? String ?? "?"))"
    }

    /// Opens the feedback sheet on top of whatever is showing, with a screenshot taken just before.
    func present(kind: Kind = .probleem) {
        guard !presenting, let top = Self.topController() else { return }
        presenting = true
        Haptics.tap()
        let screenshot = Self.screenshot()
        let sheet = UIHostingController(rootView: FeedbackSheet(kind: kind, screen: screen, details: details, screenshot: screenshot) { [weak self] in
            self?.presenting = false
        })
        sheet.view.backgroundColor = .clear
        // Presented by UIKit so it also opens over a running round or another sheet.
        if let controller = sheet.sheetPresentationController {
            controller.detents = [.custom(identifier: .init("feedback")) { min(660, $0.maximumDetentValue) }, .large()]
            controller.prefersGrabberVisible = true
            controller.preferredCornerRadius = 32
        }
        sheet.presentationController?.delegate = DismissWatcher.shared
        DismissWatcher.shared.onDismiss = { [weak self] in self?.presenting = false }
        top.present(sheet, animated: true)
    }

    struct Report: Encodable {
        let kind: String; let message: String; let screen: String
        let context: [String: String]; let platform: String; let appVersion: String; let screenshot: String?
    }

    func send(_ report: Report) async -> Bool {
        var request = URLRequest(url: URL(string: "https://nedfa.nl/api/feedback")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = Keychain.read() { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        request.httpBody = try? JSONEncoder().encode(report)
        guard let (_, response) = try? await URLSession.shared.data(for: request) else { return false }
        return (response as? HTTPURLResponse)?.statusCode == 201
    }

    // MARK: UIKit helpers

    private static func keyWindow() -> UIWindow? {
        UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first
    }

    private static func topController() -> UIViewController? {
        var top = keyWindow()?.rootViewController
        while let next = top?.presentedViewController { top = next }
        return top
    }

    private static func screenshot() -> UIImage? {
        guard let window = keyWindow() else { return nil }
        return UIGraphicsImageRenderer(bounds: window.bounds).image { _ in window.drawHierarchy(in: window.bounds, afterScreenUpdates: false) }
    }
}

private final class DismissWatcher: NSObject, UIAdaptivePresentationControllerDelegate {
    @MainActor static let shared = DismissWatcher()
    var onDismiss: (() -> Void)?
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { onDismiss?() }
}

// MARK: Shake

extension Notification.Name { static let deviceDidShake = Notification.Name("nedfa.deviceDidShake") }

extension UIWindow {
    open override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        super.motionEnded(motion, with: event)
        if motion == .motionShake { NotificationCenter.default.post(name: .deviceDidShake, object: nil) }
    }
}

extension View {
    /// Names this screen in feedback reports, e.g. `.feedbackScreen("Thema: Werk")`.
    /// In a sheet, pass `restoresOnClose: true` so the screen underneath is named again when it closes
    /// (a pushed screen needs nothing: the screen below sets its name again when it reappears).
    func feedbackScreen(_ name: String, details: [String: String] = [:], restoresOnClose: Bool = false) -> some View {
        modifier(FeedbackScreen(name: name, details: details, restores: restoresOnClose))
    }

    /// Lets the learner shake the iPhone anywhere in the app to give feedback.
    func shakeForFeedback() -> some View {
        onReceive(NotificationCenter.default.publisher(for: .deviceDidShake)) { _ in Feedback.shared.present() }
    }
}

/// Sets the screen while it is visible; a sheet gives the previous one back when it closes.
private struct FeedbackScreen: ViewModifier {
    let name: String
    let details: [String: String]
    let restores: Bool
    @State private var previous: (String, [String: String])?
    // `Self.Content`: the app has its own `Content` type (the lessons).
    func body(content: Self.Content) -> some View {
        content
            .onAppear { previous = (Feedback.shared.screen, Feedback.shared.details); Feedback.shared.screen = name; Feedback.shared.details = details; Analytics.shared.screen(name) }
            .onDisappear { if restores, Feedback.shared.screen == name, let previous { Feedback.shared.screen = previous.0; Feedback.shared.details = previous.1 } }
    }
}

// MARK: Sheet

struct FeedbackSheet: View {
    @State var kind: Feedback.Kind
    let screen: String
    let details: [String: String]
    let screenshot: UIImage?
    var onClose: () -> Void = {}

    @State private var message = ""
    @State private var attach = true
    @State private var sending = false
    @State private var sent = false
    @State private var failed = false
    @FocusState private var focused: Bool
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FittedSheet(title: sent ? nil : "Feedback") {
            if sent { thanks } else { form }
        }
        .onDisappear(perform: onClose)
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                ForEach(Feedback.Kind.allCases) { option in
                    Button { kind = option; Haptics.tap() } label: {
                        VStack(spacing: 6) {
                            Image(systemName: option.icon).font(.title3).foregroundStyle(option.color)
                            Text(option.title).font(.footnote.weight(.semibold)).foregroundStyle(Color.primary)
                        }
                        .frame(maxWidth: .infinity, minHeight: 66)
                        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(kind == option ? option.color.opacity(0.18) : Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(kind == option ? option.color : .clear, lineWidth: 2))
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(kind == option ? .isSelected : [])
                }
            }
            ZStack(alignment: .topLeading) {
                if message.isEmpty { Text(kind.prompt).foregroundStyle(.tertiary).padding(.horizontal, 5).padding(.vertical, 8) }
                TextEditor(text: $message).focused($focused).scrollContentBackground(.hidden).frame(height: 120)
            }
            .padding(10)
            .background(Color.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            if let screenshot {
                Toggle(isOn: $attach) {
                    HStack(spacing: 12) {
                        Image(uiImage: screenshot).resizable().scaledToFit().frame(height: 56).clipShape(RoundedRectangle(cornerRadius: 6)).opacity(attach ? 1 : 0.35)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Schermafbeelding meesturen").font(.subheadline.weight(.semibold))
                            Text("Van het scherm waar je net was").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                .tint(Color.brand)
            }
            Text("We sturen ook mee: \(screen) · versie \(Feedback.appVersion) · \(UIDevice.current.model) iOS \(UIDevice.current.systemVersion)")
                .font(.caption).foregroundStyle(.secondary)
            if failed { Text("Versturen lukt nu niet. Controleer je verbinding en probeer het opnieuw.").font(.footnote).foregroundStyle(Color.danger) }
            Button { Task { await send() } } label: {
                HStack { Text(sending ? "Versturen…" : "Verstuur"); Image(systemName: "paperplane.fill") }
            }
            .buttonStyle(GameButtonStyle())
            .disabled(sending || message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            Text("Tip: schud je iPhone op elk scherm om feedback te geven.").font(.caption).foregroundStyle(.secondary).frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
        .onAppear { focused = true }
    }

    private var thanks: some View {
        VStack(spacing: 14) {
            Mascot(mood: .cheer, size: 110).padding(.top, 20)
            Text("Dank je wel!").font(.game(26, .black))
            Text("We lezen alles en gebruiken het om Nedfa beter te maken.").font(.body).foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button("Klaar") { dismiss() }.buttonStyle(GameButtonStyle()).padding(.top, 6)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 16)
    }

    private func send() async {
        sending = true; failed = false
        var context = details
        context["device"] = "\(UIDevice.current.model) iOS \(UIDevice.current.systemVersion)"
        context["locale"] = Locale.current.identifier
        let image = attach ? screenshot.flatMap { Self.jpeg($0) } : nil
        let report = Feedback.Report(kind: kind.rawValue, message: message.trimmingCharacters(in: .whitespacesAndNewlines), screen: screen,
                                     context: context, platform: "ios", appVersion: Feedback.appVersion, screenshot: image)
        let ok = await Feedback.shared.send(report)
        sending = false
        if ok { Haptics.success(); Analytics.shared.event("feedback", ["soort": kind.rawValue]); withAnimation(.snappy) { sent = true } } else { failed = true }
    }

    /// A screenshot at most 1000 px tall as JPEG, well under the server's limit.
    private static func jpeg(_ image: UIImage) -> String? {
        let scale = min(1, 1000 / max(image.size.height * image.scale, 1))
        let size = CGSize(width: image.size.width * image.scale * scale, height: image.size.height * image.scale * scale)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let small = UIGraphicsImageRenderer(size: size, format: format).image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
        return small.jpegData(compressionQuality: 0.6)?.base64EncodedString()
    }
}
