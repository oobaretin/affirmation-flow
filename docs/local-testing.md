# Local testing (simulator, no Apple account)

## 1. Environment file

`.env.local` should contain:

```
VITE_SUBSCRIPTION_DEV_BYPASS=true
```

This skips the subscription paywall so you can test the full app in the simulator.

**Important:** Remove or disable this before TestFlight and App Store builds.

## 2. Build and run

Load your shell config once per terminal session (or paste the exports below):

```bash
source ~/.zshrc
```

Your `~/.zshrc` resolves **Xcode 16.1+** automatically (Downloads or `/Applications`):

```bash
export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"
export DEVELOPER_DIR="$(bash ~/affirmation-flow/scripts/resolve-developer-dir.sh)"
export LANG=en_US.UTF-8
```

Then build and open Xcode (uses **Xcode 16.1+** automatically when installed):

```bash
cd /Users/osagieobaretin/affirmation-flow
npm run build:ios
npm run open:ios
```

`npm run build:ios` picks the newest Xcode 16.1+ via `scripts/resolve-developer-dir.sh`. To install 16.1 into `/Applications` (recommended for Xcode GUI):

```bash
bash scripts/install-xcode-16.1.sh
```

In Xcode: pick **iPhone 16 Pro Max (iOS 18.1)** → press **Run** (▶).

Or boot the 18.1 simulator from the terminal first:

```bash
npm run simulator
```

## 3. Test checklist

- [ ] Onboarding (all 4 steps)
- [ ] Today — daily affirmation, voice, pin, share, streak
- [ ] Library — browse, search, add custom, AI generator
- [ ] Favorites — add, speak, share
- [ ] Settings — Account, Practice (voice, reminders, focus), About, Advanced (Lock App)
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
