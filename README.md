# AffirmEaze

Daily affirmations with voice practice, favorites, streaks, and a personal library — built for calm self-belief.

**Premium subscription app** — users subscribe after onboarding to access the full app.

## Features

- **Today** — focus-based daily affirmation, streak tracking, pin, share, voice
- **Library** — browse by category, search, custom affirmations, AI generator
- **Favorites** — speak, share, and send to Today
- **Settings** — voice style, notifications, focus areas, subscription management

## Development

```bash
npm install
npm run dev          # web dev server
npm run test.unit    # unit tests
npm run build:ios    # production build + Capacitor sync
npm run open:ios     # open Xcode
```

### Local simulator testing (no Apple account)

Copy `.env.example` to `.env.local` and enable:

```
VITE_SUBSCRIPTION_DEV_BYPASS=true
```

See [docs/local-testing.md](docs/local-testing.md) for the full test flow.

### Optional AI generation

Add `VITE_OPENAI_API_KEY` to `.env.local` for live OpenAI generation. Without it, the AI Generator uses local templates.

### Subscriptions (App Store)

When your Apple Developer account is ready:

```
VITE_REVENUECAT_APPLE_API_KEY=appl_your_key_here
```

Remove `VITE_SUBSCRIPTION_DEV_BYPASS` for production builds. See [docs/app-store-checklist.md](docs/app-store-checklist.md).

## Pre-ship docs (free tasks)

| Doc | Purpose |
|-----|---------|
| [pre-ship-free-tasks.md](docs/pre-ship-free-tasks.md) | Master checklist while waiting for $99 account |
| [local-testing.md](docs/local-testing.md) | Simulator build & test |
| [app-store-metadata.md](docs/app-store-metadata.md) | Copy-paste App Store description & keywords |
| [screenshots-guide.md](docs/screenshots-guide.md) | Capture App Store screenshots |
| [host-privacy-policy.md](docs/host-privacy-policy.md) | Free privacy policy hosting |
| [revenuecat-prep.md](docs/revenuecat-prep.md) | RevenueCat setup (free tier) |
| [app-store-checklist.md](docs/app-store-checklist.md) | Full submission checklist |

## iOS build notes

- Node is available at `.tools/node-v22.14.0-darwin-x64/bin`
- If Xcode is in Downloads: `export DEVELOPER_DIR="$HOME/Downloads/Xcode.app/Contents/Developer"`
- CocoaPods via user gem: `export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"`

## App info

| Field | Value |
|-------|-------|
| **App name** | AffirmEaze |
| **Bundle ID** | com.affirmationflow.app |
| **Support email** | support@affirmeaze.app |
| **Privacy policy** | https://affirmeaze.netlify.app/privacy |
| **Marketing / support URL** | https://affirmeaze.netlify.app |
| **Version** | 1.0.0 |
