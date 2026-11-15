import AuthenticationServices
import SwiftUI

/// Ik: your progress. The gear in the top right opens Instellingen.
struct IkView: View {
    @State private var progress = Learner.shared
    @State private var cloud = Cloud.shared
    @State private var showSignIn = false

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        let practised = stats.themes.filter { $0.done > 0 }
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    ScreenTitle("Ik", eyebrow: cloud.user == nil ? "Je voortgang" : "Je account") {
                        NavigationLink { SettingsView() } label: {
                            Image(systemName: "gearshape.fill").font(.system(size: 17, weight: .bold)).foregroundStyle(.secondary).frame(width: 40, height: 40)
                        }
                        .buttonStyle(PressableTile(radius: 20))
                        .accessibilityLabel("Instellingen")
                    }
                    .padding(.horizontal, 20)
                    profile(stats).padding(.horizontal, 20)
                    HStack(spacing: 10) {
                        tile("\(stats.streak.count)", stats.streak.count == 1 ? "dag op rij" : "dagen op rij", color: .brand)
                        tile(stats.xp.formatted(), "XP totaal", color: .goldInk)
                        tile("\(stats.known)", "onthouden", color: .success)
                    }
                    .padding(.horizontal, 20)
                    week(stats).padding(.horizontal, 20)
                    VStack(alignment: .leading, spacing: 12) {
                        SectionTitle("Stempels") { Text("\(stats.earned.count) van \(Content.shared.stamps.count)").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary) }
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 16) {
                            ForEach(Content.shared.stamps) { stamp in
                                let earned = stats.earned.contains(stamp.id)
                                VStack(spacing: 6) {
                                    Art(name: "stamps/\(stamp.id)", size: 74, corner: 22)
                                        .saturation(earned ? 1 : 0).opacity(earned ? 1 : 0.4)
                                        .tile(radius: 22, depth: earned ? 5 : 2)
                                        .padding(.bottom, earned ? 0 : 3) // same height, earned or not
                                    // Always room for two lines, so one- and two-line titles keep the badges in one row.
                                    Text(stamp.title).font(.game(12, .heavy)).multilineTextAlignment(.center).lineLimit(2, reservesSpace: true).foregroundStyle(earned ? .primary : .secondary)
                                }
                                .frame(maxWidth: .infinity, alignment: .top)
                                .accessibilityElement(children: .combine)
                                .accessibilityLabel("\(stamp.title), \(earned ? "verdiend" : "nog niet verdiend: \(stamp.description)")")
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    if !practised.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionTitle("Jouw thema’s")
                            VStack(spacing: 0) {
                                ForEach(Array(practised.enumerated()), id: \.element.theme.id) { index, item in
                                    NavigationLink(value: item.theme) {
                                        HStack {
                                            PictureRow(picture: "themes/\(item.theme.id)", title: item.theme.title, detail: "\(item.done) van \(item.total) · \(item.known) onthouden")
                                            Spacer()
                                            StarsView(count: item.stars)
                                        }
                                        .foregroundStyle(Color.primary)
                                        .padding(.vertical, 6)
                                    }
                                    if index < practised.count - 1 { Divider() }
                                }
                            }
                            .card(padding: 14)
                            .padding(.horizontal, 20)
                        }
                    }
                }
                .padding(.vertical, 12)
            }
            .feedbackScreen("Ik")
            .statusBarScrim()
            .gameBackground()
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Theme.self) { ThemeDetailView(theme: $0) }
            .sheet(isPresented: $showSignIn) { SignInSheet() }
        }
    }

    @ViewBuilder private func profile(_ stats: Stats) -> some View {
        HStack(spacing: 16) {
            Mascot(mood: stats.streak.today ? .cheer : .wave, size: 84, motion: .idle)
            VStack(alignment: .leading, spacing: 6) {
                if let user = cloud.user {
                    Text(user.name.isEmpty ? "Mijn account" : user.name).font(.game(22, .black)).lineLimit(1)
                } else {
                    Text("Gast").font(.game(22, .black))
                }
                Text("Niveau \(stats.level.number) · \(stats.level.name)").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                ThickProgress(value: stats.level.progress, color: .butter, height: 12)
                Text(stats.level.next.map { "\(stats.level.toNext) XP tot \($0.name)" } ?? "Het hoogste niveau. Knap!").font(.caption.weight(.bold)).foregroundStyle(Color.goldInk)
                if cloud.user == nil, cloud.status != .unavailable {
                    Button("Inloggen om je voortgang te bewaren") { showSignIn = true }.font(.caption.weight(.bold)).foregroundStyle(Color.brand)
                } else if cloud.user != nil {
                    Text(cloud.status.text).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .card(padding: 18, radius: 28)
    }

    private func week(_ stats: Stats) -> some View {
        HStack {
            ForEach(stats.week) { day in
                VStack(spacing: 6) {
                    ZStack {
                        Circle().fill(day.count > 0 ? Color.brand : Color.track)
                            .background(Circle().fill(day.count > 0 ? Color.brandEdge : .clear).offset(y: 3))
                        if day.count > 0 { Image(systemName: "flame.fill").font(.caption.bold()).foregroundStyle(.white) }
                    }
                    .frame(width: 34, height: 34)
                    Text(day.label).font(.caption2.weight(.semibold)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .card(padding: 14, radius: 24)
    }

    private func tile(_ value: String, _ label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.game(24, .black)).foregroundStyle(color).monospacedDigit().minimumScaleFactor(0.6).lineLimit(1)
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 72)
        .tile(radius: 20)
    }
}

/// Instellingen: grouped rows like the iPhone's own Settings.
struct SettingsView: View {
    @State private var preferences = Preferences.shared
    @State private var cloud = Cloud.shared
    @State private var showSignIn = false
    @State private var confirmDelete = false
    @State private var confirmSignOut = false
    @State private var showLevelTest = false
    @State private var reminderOn = Preferences.shared.reminderHour != nil
    @State private var statsOn = Analytics.shared.enabled
    @State private var reminderDenied = false

    var body: some View {
        Form {
            Section("Oefenen") {
                Picker("Dagdoel", selection: $preferences.goal) { ForEach(Preferences.goals, id: \.self) { Text("\($0) kaartjes").tag($0) } }
                Picker("Stem", selection: $preferences.voice) { ForEach(Content.shared.audio.voices) { Text($0.name).tag($0.id) } }
                Picker("Snelheid", selection: $preferences.speed) { ForEach(Audio.speeds, id: \.self) { Text("\(String(format: "%.2g", $0).replacingOccurrences(of: ".", with: ","))×").tag($0) } }
                Button("Luister naar een voorbeeld") { Audio.shared.play("Goedemorgen! Ik leer Nederlands. Op woensdag werk ik thuis. Hoe gaat het met je?") }
            }
            Section {
                Toggle("Dagelijkse herinnering", isOn: $reminderOn)
                if reminderOn {
                    Picker("Hoe laat?", selection: Binding(get: { preferences.reminderHour ?? 19 }, set: { preferences.reminderHour = $0 })) {
                        ForEach([7, 8, 9, 12, 17, 18, 19, 20, 21], id: \.self) { Text("\($0):00").tag($0) }
                    }
                }
            } header: { Text("Herinnering") } footer: { if reminderDenied { Text("Zet meldingen aan voor Nedfa in Instellingen › Meldingen.") } }
            .onChange(of: reminderOn) { _, on in
                if on && preferences.reminderHour == nil { preferences.reminderHour = 19 }
                if !on { preferences.reminderHour = nil }
            }
            .onChange(of: preferences.reminderHour) { _, hour in
                Task { let ok = await Reminder.set(hour: hour); reminderDenied = !ok; if !ok { reminderOn = false; preferences.reminderHour = nil } }
            }
            Section("Niveau") {
                Button { showLevelTest = true } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(preferences.level.map { "\($0) · \(LevelPlan.info[$0]?.name ?? "")" } ?? "Nog geen niveau").foregroundStyle(Color.primary)
                        Text(preferences.level == nil ? "Doe de niveautest (± 3 min)" : "Thema’s voor dit niveau staan bovenaan. Tik om de test opnieuw te doen.").font(.caption).foregroundStyle(Color(.secondaryLabel))
                    }
                }
            }
            Section("Weergave") {
                Picker("Weergave", selection: $preferences.appearance) {
                    Text("Licht").tag("light"); Text("Donker").tag("dark"); Text("Systeem").tag("system")
                }
                .pickerStyle(.segmented)
            }
            Section("Account") {
                if let user = cloud.user {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(user.email.isEmpty ? user.name : user.email).font(.body.weight(.medium))
                        Text(cloud.status.text).font(.footnote).foregroundStyle(.secondary)
                    }
                    SignInMethodRow(provider: "apple", user: user)
                    SignInMethodRow(provider: "google", user: user)
                    Button("Uitloggen") { confirmSignOut = true }
                } else if cloud.status != .unavailable {
                    Button("Inloggen met Apple of Google") { showSignIn = true }
                }
                Button(cloud.user == nil ? "Wis mijn voortgang" : "Account verwijderen", role: .destructive) { confirmDelete = true }
            }
            Section("Meer") {
                Button { Feedback.shared.present(kind: .idee) } label: {
                    HStack {
                        Label { VStack(alignment: .leading, spacing: 1) { Text("Feedback geven").foregroundStyle(Color.primary); Text("Of schud je iPhone, op elk scherm").font(.caption).foregroundStyle(Color(.secondaryLabel)) } } icon: { Image(systemName: "bubble.left.and.text.bubble.right.fill") }
                        Spacer()
                    }
                }
                NavigationLink { ResourcesView() } label: { PictureRow(picture: "themes/bronnen", title: "Websites & boeken", size: 36) }
                Toggle(isOn: Binding(get: { statsOn }, set: { statsOn = $0; Analytics.shared.enabled = $0 })) {
                    Label { VStack(alignment: .leading, spacing: 1) { Text("Anonieme statistieken"); Text("Welke schermen gebruikt worden, zonder naam").font(.caption).foregroundStyle(Color(.secondaryLabel)) } } icon: { Image(systemName: "chart.bar.fill") }
                }
                Link(destination: URL(string: "https://nedfa.nl/privacy")!) { Label("Privacy", systemImage: "hand.raised") }
                Link(destination: URL(string: "https://nedfa.nl")!) { Label("nedfa.nl", systemImage: "globe") }
            }
        }
        .navigationTitle("Instellingen")
        .feedbackScreen("Instellingen")
        .sheet(isPresented: $showSignIn) { SignInSheet() }
        .sheet(isPresented: $showLevelTest) { LevelTestView() }
        .confirmationDialog("Uitloggen?", isPresented: $confirmSignOut, titleVisibility: .visible) {
            Button("Uitloggen", role: .destructive) { Task { await cloud.signOut() } }
            Button("Annuleren", role: .cancel) {}
        } message: {
            Text("Je voortgang blijft opgeslagen in je account. Op deze iPhone oefen je daarna als gast, tot je weer inlogt.")
        }
        .confirmationDialog(cloud.user == nil ? "Je voortgang wissen?" : "Je account verwijderen?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button(cloud.user == nil ? "Wis alles" : "Verwijder mijn account", role: .destructive) { Task { _ = await cloud.deleteAccount() } }
            Button("Annuleren", role: .cancel) {}
        } message: {
            Text(cloud.user == nil ? "Alles op deze iPhone wordt gewist: je oefeningen, planning, reeks, records en instellingen. Dit kun je niet ongedaan maken." : "Je account en alles wat erbij is opgeslagen worden definitief verwijderd, online en op deze iPhone. Dit kun je niet ongedaan maken.")
        }
    }
}

struct ResourcesView: View {
    var body: some View {
        List(Content.shared.resources) { resource in
            NavigationLink {
                List {
                    Section {
                        Text(resource.description)
                        LabeledContent("Niveau", value: resource.level)
                        LabeledContent("Kosten", value: resource.cost)
                        if let time = resource.time { LabeledContent("Tijd", value: time) }
                        if let note = resource.note { Text(note).font(.footnote).foregroundStyle(.secondary) }
                    }
                    Section("Zo gebruik je het") { ForEach(Array(resource.steps.enumerated()), id: \.offset) { Text("\($0 + 1). \($1)") } }
                    if let url = URL(string: resource.url) { Section { Link("Open \(resource.name)", destination: url) } }
                }
                .navigationTitle(resource.name)
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Text(resource.name).font(.body.weight(.semibold))
                    Text("\(resource.level) · \(resource.categories.joined(separator: ", ")) · \(resource.cost)").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Websites & boeken")
    }
}

// MARK: Sign in

/// Apple or Google on the account: linked, or a button to add it so both open the same progress.
struct SignInMethodRow: View {
    let provider: String
    let user: Cloud.User
    @State private var cloud = Cloud.shared
    @State private var confirmUnlink = false
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let linked = user.has(provider)
        let name = provider == "apple" ? "Apple" : "Google"
        HStack(spacing: 12) {
            Group {
                if provider == "apple" { Image(systemName: "apple.logo").font(.title3) } else { GoogleLogo(size: 17) }
            }
            .frame(width: 28)
            VStack(alignment: .leading, spacing: 1) {
                Text(name).font(.body.weight(.medium))
                Text(linked ? "Gekoppeld" : "Koppel \(name) om ook daarmee in te loggen").font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            if linked {
                if user.providers.count > 1 { Button("Ontkoppel") { confirmUnlink = true }.font(.subheadline).foregroundStyle(.secondary).buttonStyle(.borderless) }
                else { Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.success) }
            } else if provider == "apple" {
                SignInWithAppleButton(.continue) { cloud.appleRequest($0, link: true) } onCompletion: { result in Task { await cloud.appleCompletion(result) } }
                    .signInWithAppleButtonStyle(scheme == .dark ? .white : .black)
                    .frame(width: 120, height: 34)
                    .clipShape(Capsule())
                    .accessibilityLabel("Koppel Apple")
            } else {
                Button("Koppelen") { Task { await cloud.signInWithGoogle(link: true) } }.buttonStyle(.bordered).buttonBorderShape(.capsule)
            }
        }
        .confirmationDialog("\(name) ontkoppelen?", isPresented: $confirmUnlink, titleVisibility: .visible) {
            Button("Ontkoppel \(name)", role: .destructive) { Task { await cloud.unlink(provider) } }
            Button("Annuleren", role: .cancel) {}
        } message: {
            Text("Je kunt dan niet meer met \(name) inloggen op dit account. Je voortgang blijft bewaard en je kunt \(name) later opnieuw koppelen.")
        }
    }
}

/// Google's own multicolour "G", as in their sign-in branding (no circle).
struct GoogleLogo: View {
    var size: CGFloat = 20
    var body: some View { Image("GoogleG").resizable().scaledToFit().frame(width: size, height: size).accessibilityHidden(true) }
}

struct SignInButtons: View {
    var done: () -> Void = {}
    @State private var cloud = Cloud.shared
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        VStack(spacing: 12) {
            SignInWithAppleButton(.continue) { cloud.appleRequest($0) } onCompletion: { result in
                Task { await cloud.appleCompletion(result); if cloud.user != nil { done() } }
            }
            .signInWithAppleButtonStyle(scheme == .dark ? .white : .black)
            .frame(height: 52)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            Button { Task { await cloud.signInWithGoogle(); done() } } label: {
                HStack(spacing: 8) { GoogleLogo(size: 16); Text("Ga door met Google") }
                    .font(.system(size: 19, weight: .medium)).frame(maxWidth: .infinity, minHeight: 52)
            }
            .foregroundStyle(.primary)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color(.separator)))
        }
    }
}

struct SignInReasons: View {
    var body: some View {
        // Icons in one fixed column, so every line of text starts at the same place.
        VStack(alignment: .leading, spacing: 10) {
            row("Op je telefoon in de app", "iphone")
            row("Op je laptop op nedfa.nl", "laptopcomputer")
            row("Je reeks, XP en planning gaan mee", "icloud")
        }
        .font(.subheadline)
    }

    private func row(_ text: String, _ icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.body.weight(.semibold)).foregroundStyle(Color.brand).frame(width: 28, alignment: .center)
            Text(text)
        }
    }
}

struct SignInSheet: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        FittedSheet {
        VStack(spacing: 20) {
            Mascot(mood: .wave, size: 110).padding(.top, 24)
            Text("Log in en ga overal verder").font(.title2.weight(.bold)).multilineTextAlignment(.center)
            SignInReasons().frame(maxWidth: .infinity, alignment: .leading)
            SignInButtons { dismiss() }
            Text("Je kunt je account altijd verwijderen bij Ik › Instellingen.").font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .padding(24)
        }
    }
}

struct WelcomeView: View {
    @State private var preferences = Preferences.shared
    @State private var cloud = Cloud.shared
    var body: some View {
        VStack(spacing: 18) {
            Spacer()
            Mascot(mood: .wave, size: 150, motion: .hopThenIdle)
            Text("NEDFA · NEDERLANDS VAN NUL TOT B1").font(.caption.weight(.bold)).foregroundStyle(Color.brand).tracking(1)
            Text("Elke dag een beetje Nederlands.").font(.largeTitle.weight(.heavy)).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            Text("Thema’s met audio, spellen en slim herhalen. Een paar minuten per dag is genoeg.").foregroundStyle(.secondary).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            Spacer()
            if cloud.status != .unavailable {
                SignInReasons().padding().frame(maxWidth: .infinity, alignment: .leading).background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 18))
                if cloud.status == .starting { ProgressView("Even kijken of je al bent ingelogd…") } else { SignInButtons() }
            }
            Button(cloud.status == .unavailable ? "Begin" : "Eerst proberen zonder account") { preferences.welcomeDone = true }.font(.headline).padding(.top, 4)
            Text("Je kunt later altijd nog inloggen. Je voortgang gaat dan mee.").font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
        }
        .padding(24)
    }
}
