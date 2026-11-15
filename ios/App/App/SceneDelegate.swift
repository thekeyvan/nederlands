import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = NedfaViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

/// The Capacitor web view with the standard iOS gesture: swipe from the left edge to go back.
/// The web app decides where "back" goes (see onNativeBack in src/lib/native.ts).
class NedfaViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        let edge = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(swipeBack(_:)))
        edge.edges = .left
        view.addGestureRecognizer(edge)
        // iOS 26+ fades scrolled content under the status bar with a light blur. The app draws its own
        // status bar background, and the system effect shows as a grey band in dark mode, so turn it off.
        if #available(iOS 26.0, *), let scrollView = webView?.scrollView {
            scrollView.topEdgeEffect.isHidden = true
            scrollView.bottomEdgeEffect.isHidden = true
        }
    }

    @objc private func swipeBack(_ gesture: UIScreenEdgePanGestureRecognizer) {
        guard gesture.state == .ended, gesture.translation(in: view).x > 60 else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('native-back'))")
    }
}
