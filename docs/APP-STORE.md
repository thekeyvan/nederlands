# App Store listing

The iOS app is the same React app, bundled with Capacitor (`npm run build:ios`, then archive in Xcode).

- **Bundle ID:** com.keyvanmahmoudi.nederlands · **Team:** K&S Apps (95YDC2AP63)
- **Primary language:** Dutch · **Category:** Education (secondary: Games / Word) · **Price:** free
- **Privacy policy:** https://nedfa.nl/privacy.html
- **Support / marketing URL:** https://nedfa.nl

## Name and subtitle

- Name: Nedfa
- Subtitle: Nederlands leren als een spel

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

The app works without an account ("Eerst proberen zonder account" on the first screen). Sign in with Apple or Google is optional and only syncs learning progress. Account deletion: Ik tab → gear icon (Instellingen) → Account verwijderen. Audio is bundled in the app.

## Privacy (App Store nutrition label)

- Collected only when signed in, linked to the user, not used for tracking: Contact info (email, name — from Apple/Google sign-in), User content / Other usage data (review progress and settings) for App Functionality.
- No analytics, no ads, no tracking.

## Release steps

1. `npm run build:ios` builds the web app into the Xcode project (`ios/App`).
2. Raise `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`.
3. Archive and upload:
   `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath /tmp/Nedfa.xcarchive -allowProvisioningUpdates archive`
   `xcodebuild -exportArchive -archivePath /tmp/Nedfa.xcarchive -exportOptionsPlist ios/ExportOptions.plist -exportPath /tmp/export -allowProvisioningUpdates`

## Sign in with Apple

- The app uses the native Apple sheet; Supabase checks the token against the client IDs
  `com.keyvanmahmoudi.nederlands` (app) and `com.keyvanmahmoudi.nederlands.web` (website Services ID).
- The website flow also needs Supabase's **Secret Key (for OAuth)**: a JWT signed with the
  Sign in with Apple key (Key ID 964J6WBXRJ, team 95YDC2AP63). It expires every 6 months.
  After pasting it in Supabase, set `PUBLIC_APPLE_WEB_SIGNIN=1` in Vercel so the website shows the Apple button.
