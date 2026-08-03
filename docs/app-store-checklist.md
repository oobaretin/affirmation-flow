# App Store Connect checklist

# Free phase (no $99 account yet)

See [pre-ship-free-tasks.md](./pre-ship-free-tasks.md) for the full free checklist.

- [ ] `.env.local` with `VITE_SUBSCRIPTION_DEV_BYPASS=true`
- [ ] Test full app flow in simulator ([local-testing.md](./local-testing.md))
- [ ] Finalize copy in [app-store-metadata.md](./app-store-metadata.md)
- [ ] Capture screenshots ([screenshots-guide.md](./screenshots-guide.md))
- [ ] Enable GitHub Pages ([host-privacy-policy.md](./host-privacy-policy.md))
- [ ] Create RevenueCat account ([revenuecat-prep.md](./revenuecat-prep.md))

## Before submission (requires Apple Developer Program)

- [ ] Confirm privacy URL loads: https://oobaretin.github.io/affirmation-flow/privacy/
- [ ] Add support email: support@affirmeaze.app
- [ ] Capture screenshots (6.7" iPhone 16 Pro Max): Paywall, Today, Library, Onboarding, Settings
- [ ] Complete App Privacy questionnaire (no tracking, local data, subscription via Apple)
- [ ] TestFlight beta with 2–3 testers
- [ ] Verify notifications on physical device
- [ ] Verify premium voice playback on physical device (ElevenLabs / soothing preset)
- [ ] Verify subscription purchase, restore, and paywall gate on physical device

## Subscription setup (required)

1. **App Store Connect**
   - Create subscription group: `AffirmEaze Premium`
   - Add products:
     - `com.affirmationflow.app.premium.monthly` — $4.99/month
     - `com.affirmationflow.app.premium.yearly` — $39.99/year
   - Submit subscription metadata for review with the app

2. **RevenueCat**
   - Create a free RevenueCat project
   - Add iOS app with bundle ID `com.affirmationflow.app`
   - Create entitlement: `premium`
   - Attach both products to the `premium` entitlement
   - Create offering `default` with monthly + annual packages
   - Copy the **public Apple API key** into `.env.local`:
     - `VITE_REVENUECAT_APPLE_API_KEY=appl_...`

3. **Xcode**
   - Enable **In-App Purchase** capability on the App target
   - Ensure Swift Language Version is **5.0+**
   - Use a StoreKit Configuration file for simulator testing if needed

4. **Production build**
   - Do **not** set `VITE_SUBSCRIPTION_DEV_BYPASS=true` in production
   - App must be **free to download**; subscription is required inside the app

## Suggested screenshot captions

1. **Paywall** — "Premium affirmations with voice and AI included"
2. **Today** — "Your daily affirmation, ready to speak"
3. **Library** — "Browse, search, and save affirmations"
4. **Voice** — "Soothing voice with mantra repeats"
5. **Streak** — "Build your daily practice"
6. **Settings** — "Personalize focus, voice, and reminders"

## Reviewer notes

> AffirmEaze is a subscription-only affirmation app. Users complete onboarding, then subscribe via the in-app paywall before accessing the app. No cloud account is required. Data is stored on-device. Subscriptions are managed through Apple In-App Purchase (RevenueCat). Restore Purchases is available on the paywall and in Settings. "Lock App" pauses the session on device; it is not cloud sign-out.
