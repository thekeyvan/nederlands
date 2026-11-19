# Feedback

Learners send feedback by **shaking the iPhone** on any screen, or with **Instellingen → Feedback geven** in the app and on the website. Everything lands in the `feedback` table in Railway Postgres.

## What a report contains

| Field | From |
| --- | --- |
| `kind` | `probleem`, `idee` or `compliment` (chosen in the sheet) |
| `message` | the learner's text (max. 4000 characters) |
| `screen` | where it was sent from, e.g. `Thema: Werk`, `Kaartje: de baan`, `Rondje: Dagrondje`, `Website /leren#woorden` |
| `context` | details of that screen (`card`, `theme`, `game`), device and locale |
| `platform`, `app_version` | `ios` / `web`, e.g. `1.0 (12)` |
| `screenshot` | a JPEG of the screen just before the sheet opened, only if the learner leaves it on |
| `user_id` | the account, when signed in (the report is deleted with the account) |
| `status` | `nieuw` → `gezien` → `gepland` → `opgelost` or `niet doen` |

## Reading it

- Dashboard: [nedfa.nl/beheer](https://nedfa.nl/beheer) — feedback by status (change it on the page), plus learners, activity, themes and retention. Sign in on /leren or with Google.
- Only user ids in `ADMINS` on Railway (comma-separated) see data.
- Quick look without the dashboard: Railway → Postgres → Database → Data, table `feedback`.
- API behind it (admins only):
  - `GET /api/admin/overview` — counts for the dashboard (no progress per learner)
  - `GET /api/feedback?status=nieuw` — the latest 200 reports with the sender's email
  - `GET /api/feedback/:id/screenshot` — the screenshot
  - `PATCH /api/feedback/:id` with `{"status": "gepland"}`

## Building on it

- In the app, name a screen with `.feedbackScreen("Naam", details: ["card": id])`; sheets give the previous name back when they close.
- `Feedback.shared.present(kind:)` opens the sheet from anywhere, also over a running round.
- The server limits reports to 10 per hour per address. See `server/api.mjs` and `ios-native/Nedfa/Services/Feedback.swift`.
