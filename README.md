# AffirmEaze

Daily affirmations with voice practice, favorites, streaks, and a personal library — built for calm self-belief.

## Features

- **Today** — focus-based daily affirmation, streak tracking, pin, share, voice
- **Library** — browse by category, search, custom affirmations, AI generator
- **Favorites** — speak, share, and send to Today
- **Settings** — voice style, notifications, focus areas, local-only storage

## Development

```bash
npm install
npm run dev          # web dev server
npm run test.unit    # unit tests
npm run build:ios    # production build + Capacitor sync
npm run open:ios     # open Xcode
```

### Optional AI generation

Copy `.env.example` to `.env.local` and add `VITE_OPENAI_API_KEY` for live OpenAI generation. Without it, the AI Generator uses local templates.

## iOS build notes

- Node is available at `.tools/node-v22.14.0-darwin-x64/bin`
- If Xcode is in Downloads: `export DEVELOPER_DIR="$HOME/Downloads/Xcode.app/Contents/Developer"`
- CocoaPods via user gem: `export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"`

## App Store metadata (draft)

| Field | Value |
|-------|-------|
| **App name** | AffirmEaze |
| **Subtitle** | Daily affirmations, your way |
| **Category** | Health & Fitness |
| **Privacy policy URL** | Host `public/privacy.html` or use in-app Privacy Policy |
| **Support email** | support@affirmeaze.app |
| **Description** | AffirmEaze helps you build a daily affirmation practice with soothing voice playback, personalized focus areas, favorites, streaks, and a growing library of custom affirmations. Everything stays on your device — no account required. |
| **Keywords** | affirmation, mindfulness, self-love, mantra, daily motivation, gratitude, meditation |
| **Age rating** | 4+ |
| **Encryption** | Uses only standard HTTPS (ITSAppUsesNonExemptEncryption = false) |

## Version

Current release: **1.0.0**
