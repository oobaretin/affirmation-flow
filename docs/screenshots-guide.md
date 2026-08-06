# Screenshot guide (App Store)

Apple requires **6.7" iPhone** screenshots (iPhone 16 Pro Max). Capture these before submission.

## Simulator setup

1. On **`main`**: `npm run build:ios` → open `ios/App/App.xcworkspace` in Xcode
2. Run on **iPhone 16 Pro Max** simulator
3. Use a clean state: complete onboarding, dev bypass on, sample favorites loaded
4. **Device → Appearance → Light** (matches app best)

## Recommended shots (6–8 total)

| # | Screen | How to get there | Caption idea |
|---|--------|------------------|--------------|
| 1 | Paywall | Set `VITE_SUBSCRIPTION_DEV_BYPASS=false`, rebuild, open app after onboarding | Natural premium voices — hear the difference |
| 2 | Today | Today tab (auto-play or Listen active) | Your daily affirmation, ready to speak |
| 3 | Today (listening) | Pause button visible while voice plays | Soothing voice with mantra repeats |
| 4 | Saved | Saved tab — add 2 favorites first | Keep the lines that resonate |
| 5 | Settings hub | Settings tab | Personalize focus, voice, and reminders |
| 6 | Settings → Voice | Settings → Your Practice → Voice | Calm, clear voice options |
| 7 | Onboarding | Settings → Advanced → Redo Onboarding (step 1: focus) | Personalize in minutes |
| 8 | Today + streak | Practice 2+ days or seed streak in dev tools | Build your daily practice |

**Tab names today:** Today · **Saved** · Settings (not Library/Favorites).

## How to capture

### Automated (recommended)

```bash
npm run screenshots
```

This saves PNGs at **1290×2796** (iPhone 16 Pro Max / App Store 6.7") to `docs/screenshots/`:

| File | Screen |
|------|--------|
| `01-paywall.png` | Paywall (bypass off) |
| `02-today.png` | Today with greeting + affirmation |
| `03-saved.png` | Saved tab with filters |
| `05-settings-voice.png` | Settings → Voice |
| `06-onboarding.png` | Onboarding step 1 (focus areas) |

Re-run after any UI change before TestFlight or App Store submission.

### Manual (Xcode simulator)

**Simulator:** `File → Save Screen` or `Cmd + S`

Save files as:

```
docs/screenshots/01-paywall.png
docs/screenshots/02-today.png
docs/screenshots/03-saved.png
...
```

## Tips

- Use a real name in onboarding (“Alex”) for a warmer Today greeting
- Pick 2 focus categories during onboarding so Today shows a strong line
- Heart 1–2 affirmations on Today before capturing Saved
- Keep status bar clean (9:41 AM simulator default is fine)
- For paywall shot: turn bypass off, rebuild (`npm run build:ios`), capture once, then turn bypass back on

## App Store Connect upload

When your developer account is ready:

1. App Store Connect → your app → **App Store** tab
2. **Screenshots** → iPhone 6.7"
3. Upload PNGs in order (first image is most important in search)

See also [testflight-prep.md](./testflight-prep.md) for the full submission order.
