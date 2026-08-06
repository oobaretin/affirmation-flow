# TestFlight prep checklist

Ordered steps for the **Capacitor app on `main`**. Do not use the experimental `react-native` branch for TestFlight until device QA is done on that port.

---

## Phase 1 — Free (before Apple Developer $99)

Do these now; no paid account required.

| # | Task | Doc / command |
|---|------|----------------|
| 1 | Full simulator walkthrough: onboarding → paywall (bypass) → Today → Saved → Settings drill-ins | [local-testing.md](./local-testing.md) |
| 2 | Add `VITE_ELEVENLABS_API_KEY` to `.env.local`, rebuild, test voice on Today + Paywall + Settings → Voice | [pre-ship-free-tasks.md](./pre-ship-free-tasks.md) |
| 3 | Run on **physical iPhone** via Xcode free provisioning (voice + notifications) | Xcode → your device |
| 4 | Finalize App Store copy | [app-store-metadata.md](./app-store-metadata.md) |
| 5 | Regenerate screenshots | `npm run screenshots` → [screenshots-guide.md](./screenshots-guide.md) |
| 6 | Verify URLs on phone: privacy + support pages load | [host-privacy-policy.md](./host-privacy-policy.md) |
| 7 | RevenueCat project ready (entitlement `premium`, product IDs noted) | [revenuecat-prep.md](./revenuecat-prep.md) |

**Env for local testing** (`.env.local`):

```bash
VITE_SUBSCRIPTION_DEV_BYPASS=true
VITE_ELEVENLABS_API_KEY=your-key
# VITE_REVENUECAT_APPLE_API_KEY=   # add after Apple account
```

**Rebuild after env changes:**

```bash
npm run build:ios
```

---

## Phase 2 — Apple Developer enrollment day

| # | Task | Where |
|---|------|--------|
| 1 | Enroll in [Apple Developer Program](https://developer.apple.com/programs/) | Apple |
| 2 | Create app in **App Store Connect** | Bundle ID: `com.affirmationflow.app` |
| 3 | Create subscription group **AffirmEaze Premium** | App Store Connect → Subscriptions |
| 4 | Add products (7-day free trial on both): | |
| | • `com.affirmationflow.app.premium.monthly` — $4.99/mo | |
| | • `com.affirmationflow.app.premium.yearly` — $39.99/yr | |
| 5 | Link App Store Connect to **RevenueCat** | [revenuecat-prep.md](./revenuecat-prep.md) |
| 6 | Add `VITE_REVENUECAT_APPLE_API_KEY=appl_...` to `.env.local` | RevenueCat dashboard |
| 7 | Xcode → App target → **Signing & Capabilities** → add **In-App Purchase** | `ios/App/App.xcworkspace` |
| 8 | Set **Release** scheme signing to your Team | Xcode |

---

## Phase 3 — TestFlight build

| # | Task | Notes |
|---|------|--------|
| 1 | Set `VITE_SUBSCRIPTION_DEV_BYPASS=false` for release testing | Or use a separate `.env.production.local` |
| 2 | `npm run build:ios` | Syncs web + native |
| 3 | Xcode → **Product → Archive** | Release configuration |
| 4 | **Distribute App → App Store Connect** | Upload build |
| 5 | App Store Connect → **TestFlight** → add internal testers | You + 1–2 friends |
| 6 | Test on device: subscribe (Sandbox Apple ID), restore, voice, reminders | |
| 7 | Paste metadata from [app-store-metadata.md](./app-store-metadata.md) | |
| 8 | Upload screenshots from `docs/screenshots/` | 6.7" slot |
| 9 | Complete **App Privacy** questionnaire | No tracking; on-device data; IAP |
| 10 | Submit for **App Review** when TestFlight looks good | |

---

## Phase 4 — Reviewer essentials

Paste into **App Review Information** (full text in [app-store-metadata.md](./app-store-metadata.md)):

- Subscription-only app after 7-day trial
- No cloud login; data on device
- Restore Purchases on paywall and Settings → Account
- Sandbox product IDs: `com.affirmationflow.app.premium.monthly` / `.yearly`

**Support:** support@affirmeaze.app  
**Privacy:** https://oobaretin.github.io/affirmation-flow/privacy/

---

## Parallel track — React Native (`react-native` branch)

Experimental only. **Do not merge** until:

- [ ] Xcode **16.1+** (RN 0.86 requirement)
- [ ] `cd mobile-rn && npm run ios:dev` succeeds
- [ ] Voice + paywall verified on physical iPhone

Keep shipping TestFlight from **`main`**.

---

## Quick reference

| Item | Value |
|------|--------|
| App name | AffirmEaze |
| Bundle ID | `com.affirmationflow.app` |
| Entitlement (RevenueCat) | `premium` |
| Monthly | $4.99/mo, 7-day trial |
| Annual | $39.99/yr, 7-day trial |
| Xcode workspace | `ios/App/App.xcworkspace` |
| Build command | `npm run build:ios` |
