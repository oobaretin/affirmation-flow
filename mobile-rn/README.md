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
| `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` | RevenueCat iOS (App Store purchases) |
| `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` | RevenueCat Android (Play Store) |
| `EXPO_PUBLIC_SUBSCRIPTION_DEV_BYPASS=true` | Skip paywall in simulator |

## RevenueCat / purchases

RevenueCat **does not work in Expo Go**. Use a development build:

```bash
cd mobile-rn
npx expo run:ios
```

For simulator testing without StoreKit, keep `EXPO_PUBLIC_SUBSCRIPTION_DEV_BYPASS=true`.

## Dev build prerequisites

RevenueCat and local notifications need a native dev build (`npm run ios:dev` / `npx expo run:ios`), not Expo Go.

- **CocoaPods 1.16+** (RN 0.86 podspecs use `visionos`): `gem install cocoapods -v 1.16.2 --user-install`
- **Xcode** must meet React Native 0.86 minimum (currently **16.1+**; `xcodebuild -version` on your Mac shows 16.0 — update via App Store if `expo run:ios` fails with “Please upgrade XCode”)

Quick simulator smoke test without a dev build:

```bash
npm run ios
```

## What's ported

- Onboarding (focus → listen → ready)
- Paywall with RevenueCat purchase + restore
- Today with auto-play, pause, favorites, another line
- Saved (filters, custom affirmations)
- Settings hub with drill-ins (Account, Practice, Voice, Reminders, Focus)
- Daily local notifications (expo-notifications)
- Shared services: affirmations, streak, AI, ElevenLabs voice (expo-av)

## Not yet ported

- Physical device QA for voice + paywall

## Switch back to Capacitor

```bash
git checkout main
npm run build:ios
```
