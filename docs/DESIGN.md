# Learning experience

Mijn Nederlands should feel like a small game you want to come back to, without pretending to measure language level. The app opens on **Vandaag**: a mascot with one clear sentence, one big daily mission, the route, a theme to continue and the game cards (streak, level, missions, stamps).

## Screens

| Screen | Purpose |
| --- | --- |
| Vandaag (`#vandaag`) | Daily mission ring and one start button, route strip, continue card, recommended themes and the game cards |
| Thema’s (`#woorden`) | Illustrated theme cards with stars; a theme page with words, practical sentences and a chat-style dialogue with role-play mode |
| Spellen (`#spellen`, `?spel=`) | Seven study games with personal bests; `?thema=` plays with one theme’s content |
| Oefenen (`#oefenen`) | Setup, then a full-screen round (navigation hidden), then a reward screen with an optional pairs bonus game |
| De route (`#route`) | The eight classroom steps as stops on an illustrated canal map, with each step’s review, grammar and speaking task |
| Zinsbouw (`#zinnen`) | Searchable grammar patterns; `?regel=` opens one |
| Ik (`#voortgang`) | Level, streak, stats, stamp card, last 7 days, theme progress, recent answers, settings and account |
| Bronnen (`#bronnen`, `#week`) | Daily idea, 20-minute timer with speaking prompts, filterable resources with bookmarks, and the weekly plan |

On laptops a shadcn-style sidebar holds navigation and the right rail on Vandaag keeps motivation in view. On phones a slim top bar shows the streak and XP, and a bottom bar has a large centre **Oefen** button. During a round, feedback appears in a bottom panel within thumb reach. Word details and resource details use a dialog on laptops and a drawer on phones.

## Practice modes

Each card gets a mode when it appears, based on its review state:

- New words: **Kiezen**, pick the translation out of four.
- Words in progress: **Luisteren** (hear the clip, pick the spelling) or reverse **Kiezen** (translation to Dutch).
- Well-known words: **Typen**. Small typos and a missing de/het count as “bijna”.
- Practical sentences: **Luisteren**, later the classic **Kaartje**.
- Grammar patterns: **Zinsbouw**, type the missing word.

Answers map onto the existing SM-2 grades: right first time 4, right with a hint or a small slip 3, wrong 1. The flashcard keeps the learner’s four ratings, including 5. Distractors come from the same theme first. Space replays audio or reveals a flashcard, 1–4 choose, Enter continues.

## Study games

| Game | Skill | How it works |
| --- | --- | --- |
| De of het? | Words | 60 seconds of articles; keys D/H or arrows |
| Zinnen bouwen | Word order | Tap the words into order; the first word is given and the full stop stays apart. A wrong answer shows the most common order and says other orders can exist |
| Werkwoorden | Grammar | Choose the imperfectum or perfectum. Wrong options are typical learner mistakes: hebben/zijn swapped (never for verbs of movement), t/d swapped, ge- added or dropped, the past instead of the participle, or a regular form for a strong verb |
| Zinnen aanvullen | Sentences and grammar | One word missing from a practical sentence or grammar pattern; distractors are content words or other grammar answers, capitalised to fit the gap |
| Luisterdictee | Listening and spelling | Hear a word or sentence and type it; small slips count as “bijna” |
| Gesprekken | Speaking | The setting is shown, the other person speaks, and you pick your reply from three |
| Tijdrace | Words | As many translations as possible in 60 seconds |

Games never change the SM-2 schedule and do not add XP. Personal bests stay in the browser. After a game, missed cards can be sent to a normal practice round.

## Game rules

Everything is derived from saved reviews; nothing extra is stored or synced.

- **XP**: 10 per attempt from the per-card review counts, minus 5 for each wrong answer in the event log. Because the local log is capped, XP can only grow when old events are trimmed.
- **Levels**: Toerist, Nieuwkomer, Buurtbewoner, Fietser, Collega, Kletskous, Grachtenkenner, Polderkampioen (0 to 4000 XP). These are fun names, not CEFR levels.
- **Streak**: consecutive local calendar days with at least one answer. Yesterday’s practice keeps the streak alive until today ends.
- **Daily goal**: 5, 10 or 20 cards, saved with the synced preferences.
- **Missions**: today’s old cards reviewed, new cards learned and practical sentences practised.
- **Stars per theme**: 1 at half practised, 2 when every card is practised, 3 at 80% well remembered.
- **Stamps**: first 10 cards, first starred theme, a 7-day streak, 100 cards practised, 50 cards well remembered and the full route.

There are no hearts or lives: a wrong answer never blocks practice.

## Visual language

shadcn/ui components (new-york style) with the Dutch identity: cream, orange and navy, plus green for correct, red for “nog niet”, yellow for rewards and light blue for audio. Buttons used for game actions have a `game` variant with a solid bottom edge that sinks on press. The radius is 1rem. Geist is the interface font and Vazirmatn the Persian font, both self-hosted. Illustrations, the mascot, stamps and the route map were generated with Codex in one flat style with navy outlines; sources are in `docs/design/img/` and the first concept is `docs/design/redesign-mockup.html`. Light and dark themes follow the device, with a manual choice under Ik.

## Installable app (PWA)

The manifest, mascot icons (any and maskable), shortcuts to Oefenen, Spellen and Thema’s, and a Workbox service worker (`src/sw.ts`) make the site installable on Android, iOS and desktop. The app shell, fonts and illustrations are precached, so the app opens offline; every app URL (including `/leren.html` and the sign-in callback) uses the cached shell. Audio clips are cached the first time they play, or all at once per voice under Ik → De app. Audio players request byte ranges: the service worker fetches the whole clip once and answers ranges from the cache (206), which Safari needs. New versions wait until the learner taps “Vernieuwen”, so a practice round is never interrupted. Ik shows an install button where the browser supports it, and instructions for Safari on iPhone and iPad.

## Code

`src/core/` holds the plain-JavaScript domain logic used by both the UI and the Node tests: content and translations, SM-2, sessions, `game.js` and `practice.js`. Declaration files next to them give the React UI its types. `src/hooks/` connects that logic to React (progress, routing, audio, practice session, theme, preferences, cloud sync). Routing uses the URL hash and query, so existing links such as `/leren.html?thema=werk#woorden` keep working.

Audio uses the bundled Dutch Netherlands MP3 clips. There is no browser voice fallback, speech-service request or microphone recording. Audio stops on navigation and when a new clip starts.
