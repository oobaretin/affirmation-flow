# Screenshot guide (App Store)

Apple requires **6.7" iPhone** screenshots (iPhone 16 Pro Max). Capture these before submission.

## Simulator setup

1. Open Xcode → run app on **iPhone 16 Pro Max**
2. Use a clean state: complete onboarding, subscribe bypass on, sample data loaded
3. Hide simulator chrome if needed: **Device → Appearance → Light** (matches app best)

## Recommended shots (6–8 total)

| # | Screen | How to get there | Caption idea |
|---|--------|------------------|--------------|
| 1 | Paywall | Turn off dev bypass temporarily | Premium affirmations with voice and AI included |
| 2 | Today | Main tab | Your daily affirmation, ready to speak |
| 3 | Today (speaking) | Tap voice icon | Soothing voice with mantra repeats |
| 4 | Library | Library tab | Browse, search, and save affirmations |
| 5 | Favorites | Favorites tab | Keep what resonates close |
| 6 | Onboarding | Redo onboarding in Settings | Personalize in minutes |
| 7 | Settings — Voice | Settings → Voice section | Calm, clear voice options |
| 8 | Streak | Today with 2+ day streak | Build your daily practice |

## How to capture

### Automated (recommended)

```bash
npm run screenshots
```

This saves 6 PNGs at **1290×2796** (iPhone 16 Pro Max / App Store 6.7") to `docs/screenshots/`.

### Manual (Xcode simulator)

**Simulator:** `File → Save Screen` or `Cmd + S`

Save files as:

```
docs/screenshots/01-paywall.png
docs/screenshots/02-today.png
...
```

Add `docs/screenshots/.gitkeep` if you want the folder in git but ignore PNGs — optional.

## Tips

- Use a real name in onboarding (“Alex”) for a warmer feel
- Pick 2–3 focus categories so Today shows a good affirmation
- Add 1–2 favorites before capturing Favorites tab
- Keep status bar clean (9:41 AM is fine — simulator default)

## App Store Connect upload

When your developer account is ready:

1. App Store Connect → your app → **App Store** tab
2. **Screenshots** → iPhone 6.7"
3. Upload PNGs in order (first image is most important in search)
