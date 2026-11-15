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
                                    Text(stamp.title).font(.game(12, .heavy)).multilineTextAlignment(.center).lineLimit(2).foregroundStyle(earned ? .primary : .secondary)
                                }
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
            .gameBackground()
            .navigationTitle("Ik")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink { SettingsView() } label: { Image(systemName: "gearshape.fill") }.accessibilityLabel("Instellingen")
                }
            }
            .navigationDestination(for: Theme.self) { ThemeDetailView(theme: $0) }
            .sheet(isPresented: $showSignIn) { SignInSheet() }
        }
    }

    @ViewBuilder private func profile(_ stats: Stats) -> some View {
        HStack(spacing: 16) {
            Mascot(mood: stats.streak.today ? .cheer : .wave, size: 84)
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
    @State private var reminderOn = Preferences.shared.reminderHour != nil
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
            Section("Weergave") {
                Picker("Weergave", selection: $preferences.appearance) {
                    Text("Licht").tag("light"); Text("Donker").tag("dark"); Text("Systeem").tag("system")
                }
                .pickerStyle(.segmented)
            }
            Section("Account") {
                if let user = cloud.user {
                    LabeledContent("Ingelogd met \(user.provider == "apple" ? "Apple" : "Google")", value: user.email)
                    Text(cloud.status.text).font(.footnote).foregroundStyle(.secondary)
                    Button("Uitloggen") { Task { await cloud.signOut() } }
                } else if cloud.status != .unavailable {
                    Button("Inloggen met Apple of Google") { showSignIn = true }
                }
                Button(cloud.user == nil ? "Wis mijn voortgang" : "Account verwijderen", role: .destructive) { confirmDelete = true }
            }
            Section("Meer") {
                NavigationLink { ResourcesView() } label: { PictureRow(picture: "themes/bronnen", title: "Websites & boeken", size: 36) }
                Link(destination: URL(string: "https://nedfa.nl/privacy.html")!) { Label("Privacy", systemImage: "hand.raised") }
                Link(destination: URL(string: "https://nedfa.nl")!) { Label("nedfa.nl", systemImage: "globe") }
            }
        }
        .navigationTitle("Instellingen")
        .sheet(isPresented: $showSignIn) { SignInSheet() }
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
                Label("Doorgaan met Google", systemImage: "g.circle.fill").font(.headline).frame(maxWidth: .infinity, minHeight: 52)
            }
            .foregroundStyle(.primary)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color(.separator)))
        }
    }
}

struct SignInReasons: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Op je telefoon in de app", systemImage: "iphone")
            Label("Op je laptop op nedfa.nl", systemImage: "laptopcomputer")
            Label("Je reeks, XP en planning gaan mee", systemImage: "icloud")
        }
        .font(.subheadline)
    }
}

struct SignInSheet: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        VStack(spacing: 20) {
            Mascot(mood: .wave, size: 110).padding(.top, 24)
            Text("Log in en ga overal verder").font(.title2.weight(.bold)).multilineTextAlignment(.center)
            SignInReasons().frame(maxWidth: .infinity, alignment: .leading)
            SignInButtons { dismiss() }
            Text("Je kunt je account altijd verwijderen bij Ik › Instellingen.").font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .padding(24)
        .presentationDetents([.medium, .large])
    }
}

struct WelcomeView: View {
    @State private var preferences = Preferences.shared
    @State private var cloud = Cloud.shared
    var body: some View {
        VStack(spacing: 18) {
            Spacer()
            Mascot(mood: .wave, size: 150)
            Text("NEDFA · NEDERLANDS A2 → B1").font(.caption.weight(.bold)).foregroundStyle(Color.brand).tracking(1)
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
