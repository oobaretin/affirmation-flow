# AffirmEaze — React Native (Expo)

Experimental React Native port on the `react-native` branch. The Capacitor app on `main` is unchanged.

## Run on iOS Simulator

```bash
cd mobile-rn
cp .env.example .env
# Add your keys to .env (especially EXPO_PUBLIC_SUBSCRIPTION_DEV_BYPASS=true for local testing)

npm install
npm run ios
```

Or from repo root after switching to this branch:

```bash
git checkout react-native
npm run ios:rn
```

Press `i` in the Expo CLI if the simulator does not open automatically.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_ELEVENLABS_API_KEY` | Premium voice (ElevenLabs) |
| `EXPO_PUBLIC_OPENAI_API_KEY` | “Another line” AI generation |
| `EXPO_PUBLIC_SUBSCRIPTION_DEV_BYPASS=true` | Skip paywall in simulator |

## What's ported

- Onboarding (focus → listen → ready)
- Today with auto-play, pause, favorites, another line
- Saved (filters, custom affirmations)
- Settings hub summary
- Shared services: affirmations, streak, AI, ElevenLabs voice (expo-av)

## Not yet ported

- RevenueCat purchases (paywall uses dev bypass for now)
- Local notifications scheduling
- Full Settings drill-in pages

## Switch back to Capacitor

```bash
git checkout main
npm run build:ios
```
