# RevenueCat prep (free — do now)

You can set up RevenueCat **before** paying for the Apple Developer Program. Full IAP testing waits until both are ready.

## Step 1 — Create account

1. Go to [app.revenuecat.com/signup](https://app.revenuecat.com/signup)
2. Create a free project, e.g. **AffirmEaze**

## Step 2 — Note your bundle ID

```
com.affirmationflow.app
```

You’ll link this when Apple Developer is active.

## Step 3 — Plan entitlements & products (don’t connect yet)

| Item | ID |
|------|-----|
| Entitlement | `premium` |
| Monthly product | `com.affirmationflow.app.premium.monthly` |
| Yearly product | `com.affirmationflow.app.premium.yearly` |
| Introductory offer | **7-day free trial** on both products |

These IDs must **exactly match** App Store Connect and `src/constants/subscription.ts`.

## Step 4 — When Apple Developer is active

1. Create subscription group + products in **App Store Connect**
2. On **each** subscription (monthly and annual), add an **Introductory Offer**:
   - Type: **Free Trial**
   - Duration: **7 days**
   - Set the paid price that applies after the trial ends
3. In RevenueCat: **Project Settings → Apps → Add iOS app**
3. Add App Store Connect Shared Secret / App Store Connect API key (RevenueCat wizard)
4. Create entitlement `premium` and attach both products
5. Create offering **default** with Monthly + Annual packages
6. Copy **Public Apple API Key** (`appl_...`) to `.env.local`:

   ```
   VITE_REVENUECAT_APPLE_API_KEY=appl_your_key_here
   VITE_SUBSCRIPTION_DEV_BYPASS=false
   ```

7. Rebuild iOS app and test on a **real device** with a Sandbox Apple ID

## Step 5 — Xcode (when testing IAP)

1. Open `ios/App/App.xcworkspace`
2. Target **App** → **Signing & Capabilities** → **+ Capability** → **In-App Purchase**
3. Optional: add **StoreKit Configuration** file for simulator sandbox testing

## RevenueCat free tier

Free up to $2,500/month tracked revenue — plenty for launch.

## Docs

- [RevenueCat Capacitor install](https://www.revenuecat.com/docs/getting-started/installation/capacitor)
- [iOS subscription setup](https://www.revenuecat.com/docs/getting-started/making-purchases)
