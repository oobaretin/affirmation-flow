# Free pre-ship tasks (no Apple Developer account needed)

Use this checklist while you build and test locally. Check items off as you go.

**Last updated:** August 2026 — reflects Saved tab, Settings hub drill-ins, 3-step onboarding, and Today auto-play.

---

## Do next (before paying $99 for Apple)

Follow the ordered checklist in [testflight-prep.md](./testflight-prep.md) **Phase 1**. Highest-value items:

1. [ ] **Full app walkthrough** — simulator, then physical iPhone ([local-testing.md](./local-testing.md))
2. [ ] **ElevenLabs** — add `VITE_ELEVENLABS_API_KEY` to `.env.local`, rebuild, test voice on Today / Saved / Paywall / Settings → Voice
3. [ ] **Estimate ElevenLabs cost** per active user (voice is your main ongoing expense)
4. [ ] **Finalize App Store copy** — review [app-store-metadata.md](./app-store-metadata.md)
5. [ ] **Verify URLs on your phone** — privacy policy + support page load cleanly
6. [ ] **Support email** — confirm `support@affirmeaze.app` works (or update copy everywhere)
7. [ ] **Regenerate screenshots** if needed after UI changes: `npm run screenshots`

---

## Setup (one time)

- [x] `.env.local` created with `VITE_SUBSCRIPTION_DEV_BYPASS=true`
- [x] Xcode installed and moved to `/Applications/Xcode.app`
- [x] CocoaPods installed (`~/.gem/ruby/2.6.0/bin/pod`)
- [x] Shell env in `~/.zshrc` (`DEVELOPER_DIR`, CocoaPods `PATH`, `LANG`)
- [x] `npm run build:ios` succeeds (web build + cap sync + pod install)
- [x] `npm run open:ios` opens Xcode workspace
- [ ] Walk through onboarding → Today → Saved → Settings (Account, Practice, Voice)
- [ ] Confirm paywall is **skipped** in simulator (dev bypass active)
- [ ] Preview paywall UI once (set bypass `false`, rebuild, then turn bypass back on)

## Premium voice (ElevenLabs)

- [ ] Create ElevenLabs account and API key
- [ ] Add `VITE_ELEVENLABS_API_KEY=...` to `.env.local` (never commit)
- [ ] Rebuild: `npm run build:ios`
- [ ] Test voice preview on Paywall, Settings, and Today
- [ ] Test on **physical device** (simulator TTS/network behavior differs)

## App Store copy (ready to paste later)

- [ ] Review and approve text in [app-store-metadata.md](./app-store-metadata.md)
- [ ] Save final subtitle and description in App Store Connect when you have the $99 account

## Screenshots

- [x] Follow [screenshots-guide.md](./screenshots-guide.md)
- [x] Capture 6.7" iPhone 16 Pro Max shots: Paywall, Today, Saved, Settings (Voice), Onboarding
- [x] Store PNGs in `docs/screenshots/` (run `npm run screenshots` to regenerate)
- [ ] Re-capture after major UI changes (`npm run screenshots`)

## Privacy policy URL

- [x] Update `public/privacy.html` (aligned with in-app policy)
- [x] GitHub Pages live — deploy from `main` → `/docs` ([host-privacy-policy.md](./host-privacy-policy.md))
- [x] Privacy policy URL configured in app: `https://oobaretin.github.io/affirmation-flow/privacy/`
- [ ] Open URL on your phone and confirm it loads (required for App Store Connect)

## RevenueCat (free account — prep only)

- [x] Create account at [revenuecat.com](https://www.revenuecat.com)
- [x] Project **AffirmEaze** — Capacitor, entitlement `premium`, Monthly + Yearly
- [x] SDK already installed in app (`@revenuecat/purchases-capacitor`)
- [x] Read [revenuecat-prep.md](./revenuecat-prep.md)
- [ ] **Wait** to link iOS products until Apple Developer Program is active
- [ ] Add `VITE_REVENUECAT_APPLE_API_KEY=appl_...` when Apple account is ready

## Code & backup

- [x] Project backed up on GitHub
- [x] Premium voice + UX improvements shipped (`main`)
- [x] Settings simplified (Account / Practice / About / Advanced accordion)
- [ ] Tag release `v1.0.0` before first TestFlight build

## Physical device only (no Apple account still OK for most)

- [ ] Run app on your iPhone via Xcode (free provisioning for personal device)
- [ ] Daily reminder notification fires at chosen time
- [ ] Premium voice plays reliably on device
- [ ] Haptics and share sheet feel correct

---

## When you have the $99 Apple Developer account

Continue with [testflight-prep.md](./testflight-prep.md) and [app-store-checklist.md](./app-store-checklist.md):

1. Enroll in Apple Developer Program
2. Create app record + subscription products in App Store Connect
3. Link RevenueCat + add `VITE_REVENUECAT_APPLE_API_KEY`
4. Enable In-App Purchase capability in Xcode
5. Remove `VITE_SUBSCRIPTION_DEV_BYPASS` from production builds
6. TestFlight with 2–3 testers
7. Verify purchase, restore, and paywall gate on device
8. App Store review submission

**Subscription pricing (already defined in code):**

| Plan | Price | Trial |
|------|-------|-------|
| Monthly | $4.99/mo | 7 days |
| Annual | $39.99/yr | 7 days |

Product IDs: `com.affirmationflow.app.premium.monthly` and `.yearly`
