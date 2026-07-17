# Free pre-ship tasks (no Apple Developer account needed)

Use this checklist while you build and test locally. Check items off as you go.

## Setup (one time)

- [x] `.env.local` created with `VITE_SUBSCRIPTION_DEV_BYPASS=true`
- [ ] Run `npm run build:ios` and test in Xcode simulator
- [ ] Walk through onboarding → Today → Library → Settings → Voice preview
- [ ] Confirm paywall is **skipped** in simulator (dev bypass active)

## App Store copy (ready to paste later)

- [ ] Review and approve text in [app-store-metadata.md](./app-store-metadata.md)
- [ ] Save final subtitle and description in App Store Connect when you have the $99 account

## Screenshots

- [x] Follow [screenshots-guide.md](./screenshots-guide.md)
- [x] Capture 6.7" iPhone 16 Pro Max simulator shots: Paywall, Today, Library, Favorites, Settings (Voice), Onboarding
- [x] Store PNGs in `docs/screenshots/` (run `npm run screenshots` to regenerate)

## Privacy policy URL

- [x] Update `public/privacy.html` if needed (already aligned with in-app policy)
- [x] Hosted at [AffirmEaze](https://affirmeaze.netlify.app)
- [x] Privacy policy URL: `https://affirmeaze.netlify.app/privacy`

## RevenueCat (free account — prep only)

- [x] Create account at [revenuecat.com](https://www.revenuecat.com)
- [x] Project **AffirmEaze** — Capacitor, entitlement `premium`, Monthly + Yearly
- [x] SDK already installed in app (`@revenuecat/purchases-capacitor`)
- [x] Read [revenuecat-prep.md](./revenuecat-prep.md)
- [ ] **Wait** to link iOS products until Apple Developer Program is active
- [ ] Add `VITE_REVENUECAT_APPLE_API_KEY=appl_...` when Apple account is ready

## Code & backup

- [x] Project backed up on GitHub (private repo)
- [ ] Commit subscription + docs changes when ready
- [ ] Tag release `v1.0.0` before first TestFlight build

## When you have the $99 Apple Developer account

Continue with [app-store-checklist.md](./app-store-checklist.md):

1. Enroll in Apple Developer Program
2. Create subscription products in App Store Connect
3. Link RevenueCat + add `VITE_REVENUECAT_APPLE_API_KEY`
4. Remove `VITE_SUBSCRIPTION_DEV_BYPASS` from production builds
5. TestFlight → App Store review
