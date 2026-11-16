# Nedfa for Android

The native Android app: Kotlin + Jetpack Compose, a port of the SwiftUI app in `ios-native/` with the same rules
(`app/src/main/java/nl/nedfa/data`) and the same content file. Package and Play Console app: `nl.nedfa`
("Nedfa: Nederlands leren", K&S Apps developer account).

- Content: `content.json` (exported from `content/` by `npm run build:native`) and `src/assets/illustrations` are copied
  into the app's assets at build time (`nedfaAssets` task). New content is also downloaded from `https://nedfa.nl/api/v1`.
- Audio is not bundled: clips stream from `https://nedfa.nl/assets/audio/<voice>/<key>.mp3` and are kept on the phone.
  This keeps the bundle under 10 MB.
- Sign-in: Google only (Custom Tab → nedfa.nl → `nl.nedfa://auth?code=…`), the same accounts as the website and iPhone.
  People who use Apple on their iPhone link Google there first.

## Build

Needs JDK 21 (`brew install openjdk@21`) and the Android SDK (`~/Library/Android/sdk`, platform 37).

```sh
npm run build:android          # exports content, then builds the signed release bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` (upload this to Play Console).
For each new upload raise `versionCode` in `app/build.gradle.kts`.

## Upload key

Release builds are signed with the upload key `~/.android/nedfa-upload.jks` (alias `upload`); its passwords are in
`android/keystore.properties`. Neither is in git. **Keep a backup of both** (for example in a password manager).
Google Play App Signing holds the real app signing key; if the upload key is lost, request an upload key reset in
Play Console › Test and release › App integrity.
