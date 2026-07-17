# Local testing (simulator, no Apple account)

## 1. Environment file

`.env.local` should contain:

```
VITE_SUBSCRIPTION_DEV_BYPASS=true
```

This skips the subscription paywall so you can test the full app in the simulator.

**Important:** Remove or disable this before TestFlight and App Store builds.

## 2. Build and run

```bash
export PATH="/Users/osagieobaretin/affirmation-flow/.tools/node-v22.14.0-darwin-x64/bin:$PATH"
export DEVELOPER_DIR="$HOME/Downloads/Xcode.app/Contents/Developer"
export LANG=en_US.UTF-8
export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"

cd /Users/osagieobaretin/affirmation-flow
npm run build:ios
open ios/App/App.xcworkspace
```

In Xcode: pick an iPhone simulator → press **Run** (▶).

## 3. Test checklist

- [ ] Onboarding (all 4 steps)
- [ ] Today — daily affirmation, voice, pin, share, streak
- [ ] Library — browse, search, add custom, AI generator
- [ ] Favorites — add, speak, share
- [ ] Settings — voice style, notifications, focus areas, Lock App
- [ ] Privacy Policy link opens

## 4. Test paywall UI (optional)

To preview the paywall without subscribing:

1. Set `VITE_SUBSCRIPTION_DEV_BYPASS=false` in `.env.local` (or comment it out)
2. Rebuild: `npm run build:ios`
3. Run again — after onboarding you should see the paywall
4. Purchase button will be disabled in simulator until RevenueCat + App Store products exist
5. Turn bypass back on when done

## 5. Unit tests

```bash
npm run test.unit
```

Tests auto-enable subscription bypass in test mode.
