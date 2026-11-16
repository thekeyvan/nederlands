# App Store listing

The iOS app is the native SwiftUI app in `ios-native/` (`npm run build:native`, then archive; see Release steps).

- **Bundle ID:** nl.nedfa · **App Store Connect app id:** 6835511181 · **SKU:** nl.nedfa (the first record, "Nedfa oud" 6834940847 with com.keyvanmahmoudi.nederlands, was withdrawn from review on 2026-11-16) · **Team:** K&S Apps (95YDC2AP63)
- **Primary language:** Dutch · **Category:** Education (secondary: Games / Word) · **Price:** free
- **Privacy policy:** https://nedfa.nl/privacy
- **Support / marketing URL:** https://nedfa.nl

## Name and subtitle

- Name: Nedfa: Nederlands leren
- Subtitle: Elke dag een beetje, als spel

## Promotional text

Elke dag een beetje Nederlands: thema’s met audio, zeven spellen en slim herhalen. Log in en ga verder op je telefoon of op de website.

## Description

Nedfa helpt je om na je taalcursus elke dag een beetje Nederlands te oefenen, van A2 naar B1. Een paar minuten per dag is genoeg.

THEMA’S MET AUDIO
Woorden, handige zinnen en korte gesprekken over het dagelijks leven: naar de huisarts, werk en privé, wonen, boodschappen en meer. Alles met Nederlandse audio, ook zonder internet.

SLIM HERHALEN
Kaartjes komen terug precies wanneer je ze bijna vergeet. Kies, luister, typ of vul aan.

ZEVEN SPELLEN
De of het, zinnen bouwen, werkwoorden, zinnen aanvullen, luisterdictee, gesprekken en een tijdrace. Verbeter je record.

ELKE DAG EEN BEETJE
Een dagdoel, een reeks, XP, stempels en een route met acht haltes van A2 naar B1. Zet een dagelijkse herinnering aan als je wilt.

OVERAL VERDER
Log in met Apple of Google en ga verder op je telefoon of op de website. Zonder account kan ook; je voortgang blijft dan op je telefoon. Je kunt je account en al je gegevens altijd verwijderen in de app.

## Keywords

nederlands,dutch,inburgering,taal,leren,A2,B1,woorden,grammatica,staatsexamen,NT2,uitspraak

## Review notes

Answer to Apple's "Guideline 2.1 – Information Needed" (15 Nov 2026). Paste into App Review Information → Notes (max 4000 characters) and attach or link the screen recording.

```
1. SCREEN RECORDING
A screen recording made on an iPhone with the latest iOS is attached [or: available at <link>]. It starts at the Home Screen with launching the app and shows: the first screen, trying the app without an account, a practice round, a game, the level test, Sign in with Apple, linking Google in Settings, giving feedback, signing out, and deleting the account (Ik tab → gear icon → Account verwijderen → confirm).

2. PURPOSE AND AUDIENCE
Nedfa helps adults who speak Persian (Farsi) learn Dutch from zero to level B1, mostly newcomers in the Netherlands preparing for the civic integration exam (inburgering) or daily life. Each Dutch word and sentence comes with a Persian translation and Dutch audio. A few minutes a day of spaced repetition, short games and themed lessons (doctor, work, municipality, housing) help them use Dutch in real situations. The app is free, has no ads and no in-app purchases.

3. HOW TO USE IT
No login is needed. On the first screen tap "Eerst proberen zonder account". On the Vandaag tab tap "Start" for a practice round; "Leren" has themes and grammar, "Arcade" has seven games, "Ik" shows progress. The level test is on the Vandaag tab ("Hoe goed ken je Nederlands al?"). Signing in with Apple or Google is optional and only syncs progress with the website nedfa.nl. Feedback: shake the iPhone, or Ik → gear icon → Feedback geven. Account deletion: Ik → gear icon → Account verwijderen; this deletes the account and all its data on our server immediately.

4. EXTERNAL SERVICES
- Sign in with Apple and Google Sign-In (optional login only).
- Our own server at nedfa.nl, hosted on Railway (EU, Netherlands): stores account, learning progress and feedback in a PostgreSQL database.
- Umami, self-hosted on the same Railway project: anonymous, cookieless usage statistics (no account id, can be switched off in Settings).
No AI services, payment processors or third-party data providers. The Dutch audio is bundled in the app.

5. REGIONS
The app works the same in all regions; there are no regional differences in features or content.

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Not applicable. All lessons, translations, pictures and audio are our own. Links to official Dutch websites (for example DUO and inburgeren.nl) only open those sites.
```

## Privacy (App Store nutrition label)

Published in App Store Connect on 2026-11-15. Privacy policy URL: https://nedfa.nl/privacy


- Collected only when signed in, linked to the user, not used for tracking: Contact info (email, name — from Apple/Google sign-in), User content / Other usage data (review progress and settings) for App Functionality.
- User Content → Customer Support (the feedback form): linked to the user when signed in, not used for tracking, purpose App Functionality.
- Usage Data → Product Interaction: collected, **not linked** to the user, **not used for tracking**, purpose Analytics (anonymous Umami screen and event counts on our own server; off-switch in Instellingen; see docs/ANALYTICS.md).
- No ads, no third-party tracking, no App Tracking Transparency prompt needed.

## Release steps

1. `npm run build:ios` builds the web app into the Xcode project (`ios/App`).
2. Raise `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`.
3. Archive and upload:
   `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath /tmp/Nedfa.xcarchive -allowProvisioningUpdates archive`
   `xcodebuild -exportArchive -archivePath /tmp/Nedfa.xcarchive -exportOptionsPlist ios/ExportOptions.plist -exportPath /tmp/export -allowProvisioningUpdates`

## Sign in with Apple

- The app uses the native Apple sheet; nedfa.nl (`server/auth.mjs`) checks the token against the client IDs
  `nl.nedfa` (app, primary App ID) and `nl.nedfa.web` (website Services ID, grouped under nl.nedfa).
  The old `com.keyvanmahmoudi.nederlands` IDs are still accepted for builds and sessions from before the switch.
- The website uses Sign in with Apple JS (a popup) with the Services ID, whose website URLs list
  `nedfa.nl` and the return URL `https://nedfa.nl/leren`. The token goes to `/api/auth/apple`,
  so no OAuth secret key is needed and nothing expires every 6 months.
  Apple gives all apps and Services IDs of one team the same user id, so the app and the website see the same Apple account.
- `PUBLIC_APPLE_WEB_SIGNIN=0` on Railway hides the Apple button on the website.
