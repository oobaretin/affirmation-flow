# App Store Connect checklist

Start with the ordered guide: [testflight-prep.md](./testflight-prep.md).

## Free phase (no $99 account yet)

See [pre-ship-free-tasks.md](./pre-ship-free-tasks.md) for the full free checklist.

- [x] `.env.local` with `VITE_SUBSCRIPTION_DEV_BYPASS=true`
- [x] iOS build pipeline (`npm run build:ios` + Xcode workspace)
- [ ] Test full app flow in simulator ([local-testing.md](./local-testing.md))
- [ ] Test on physical iPhone (voice + notifications)
- [ ] ElevenLabs API key in `.env.local` + voice tested end-to-end
- [ ] Finalize copy in [app-store-metadata.md](./app-store-metadata.md)
- [x] Capture screenshots ([screenshots-guide.md](./screenshots-guide.md))
- [x] Enable GitHub Pages ([host-privacy-policy.md](./host-privacy-policy.md))
- [x] Create RevenueCat account ([revenuecat-prep.md](./revenuecat-prep.md))

## Before submission (requires Apple Developer Program)

- [ ] Confirm privacy URL loads: https://oobaretin.github.io/affirmation-flow/privacy/
- [ ] Confirm support URL loads: https://oobaretin.github.io/affirmation-flow/
- [ ] Support email works: support@affirmeaze.app
- [ ] Re-capture screenshots if UI changed since last capture
- [ ] Complete App Privacy questionnaire (no tracking, local data, subscription via Apple)
- [ ] TestFlight beta with 2–3 testers
- [ ] Verify notifications on physical device
- [ ] Verify premium voice playback on physical device (ElevenLabs)
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

1. **Paywall** — "Natural premium voices — hear the difference"
2. **Today** — "Your daily affirmation, ready to speak"
3. **Saved** — "Keep the lines that resonate"
4. **Settings** — "Personalize focus, voice, and reminders"
5. **Onboarding** — "Start with calm, spoken affirmations"

## Reviewer notes

> AffirmEaze is a subscription-only affirmation app. Users complete onboarding, then subscribe via the in-app paywall before accessing the app. No cloud account is required. Data is stored on-device. Subscriptions are managed through Apple In-App Purchase (RevenueCat). Restore Purchases is available on the paywall and in Settings. "Lock App" pauses the session on device; it is not cloud sign-out.
