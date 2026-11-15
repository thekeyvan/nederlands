import AuthenticationServices
import SwiftUI

/// Ik: your progress. The gear in the top right opens Instellingen.
struct IkView: View {
    @State private var progress = Learner.shared
    @State private var cloud = Cloud.shared
    @State private var showSignIn = false

    var body: some View {
        let stats = Stats(reviews: progress.reviews, events: progress.events)
        NavigationStack {
            List {
                Section {
                    if let user = cloud.user {
                        HStack(spacing: 14) {
                            Text(String(user.name.prefix(1)).uppercased()).font(.title3.bold()).frame(width: 48, height: 48).background(Color.navy.opacity(0.15), in: Circle())
                            VStack(alignment: .leading) { Text(user.name.isEmpty ? "Mijn account" : user.name).font(.headline); Text(cloud.status.text).font(.footnote).foregroundStyle(.secondary) }
                        }
                    } else if cloud.status != .unavailable {
                        Button { showSignIn = true } label: { PictureRow(picture: "mascot/wave", title: "Inloggen", detail: "Ga verder op je telefoon en de website") }.foregroundStyle(.primary)
                    }
                }
                Section {
                    HStack(spacing: 10) {
                        tile("\(stats.streak.count)", stats.streak.count == 1 ? "dag op rij" : "dagen op rij", icon: "flame.fill", color: .brand)
                        tile("\(stats.xp)", "XP", icon: "star.fill", color: .butter)
                        tile("\(stats.known)", "onthouden", icon: "checkmark.seal.fill", color: .success)
                    }
                    .listRowInsets(EdgeInsets()).listRowBackground(Color.clear)
                }
                Section {
                    HStack(spacing: 14) {
                        Mascot(mood: stats.streak.today ? .cheer : .wave, size: 64)
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Niveau \(stats.level.number) · \(stats.level.name)").font(.headline)
                            ProgressView(value: stats.level.progress).tint(.butter)
                            Text(stats.level.next.map { "Nog \(stats.level.toNext) XP tot \($0.name)" } ?? "Je hebt het hoogste niveau. Knap!").font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    HStack {
                        ForEach(stats.week) { day in
                            VStack(spacing: 4) {
                                ZStack {
                                    Circle().fill(day.count > 0 ? Color.brand : Color(.tertiarySystemFill))
                                    if day.count > 0 { Image(systemName: "checkmark").font(.caption.bold()).foregroundStyle(.white) }
                                }
                                .frame(width: 30, height: 30)
                                Text(day.label).font(.caption2).foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                } header: { Text("Jouw reeks en niveau") }
                Section("Vandaag") {
                    ForEach(stats.missions) { mission in
                        HStack(spacing: 12) {
                            Art(name: mission.picture, size: 44).overlay(alignment: .bottomTrailing) { if mission.done { Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.success).background(Circle().fill(.background)) } }
                            VStack(alignment: .leading, spacing: 6) {
                                Text(mission.title).font(.subheadline.weight(.medium)).strikethrough(mission.done)
                                ProgressView(value: Double(mission.count), total: Double(mission.target)).tint(mission.done ? .success : .brand)
                            }
                            Text("\(mission.count)/\(mission.target)").font(.footnote.bold()).monospacedDigit()
                        }
                    }
                }
                Section("Stempels · \(stats.earned.count) van \(Content.shared.stamps.count)") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 14) {
                        ForEach(Content.shared.stamps) { stamp in
                            let earned = stats.earned.contains(stamp.id)
                            VStack(spacing: 6) {
                                Art(name: "stamps/\(stamp.id)", size: 84).saturation(earned ? 1 : 0).opacity(earned ? 1 : 0.35)
                                Text(stamp.title).font(.caption2.weight(.medium)).multilineTextAlignment(.center).foregroundStyle(earned ? .primary : .secondary)
                            }
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("\(stamp.title), \(earned ? "verdiend" : "nog niet verdiend: \(stamp.description)")")
                        }
                    }
                    .padding(.vertical, 6)
                }
                let practised = stats.themes.filter { $0.done > 0 }
                if !practised.isEmpty {
                    Section("Jouw thema’s") {
                        ForEach(practised, id: \.theme.id) { item in
                            NavigationLink(value: item.theme) {
                                HStack { PictureRow(picture: "themes/\(item.theme.id)", title: item.theme.title, detail: "\(item.done) van \(item.total) · \(item.known) onthouden"); Spacer(); StarsView(count: item.stars) }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Ik")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { NavigationLink { SettingsView() } label: { Image(systemName: "gearshape") }.accessibilityLabel("Instellingen") } }
            .navigationDestination(for: Theme.self) { ThemeDetailView(theme: $0) }
            .sheet(isPresented: $showSignIn) { SignInSheet() }
        }
    }

    private func tile(_ value: String, _ label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Label(value, systemImage: icon).font(.title3.weight(.heavy)).foregroundStyle(color).monospacedDigit()
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 70)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
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
