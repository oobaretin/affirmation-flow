# Host privacy policy on GitHub Pages

App Store Connect requires a **public URL** for your privacy policy.

**Live URL (after setup):** https://oobaretin.github.io/affirmation-flow/privacy/

Source files live in `docs/privacy/index.html`. Keep this in sync with `public/privacy.html` and `src/pages/Privacy.tsx` when you change the policy.

## One-time GitHub setup

1. Push this repo to GitHub (`oobaretin/affirmation-flow`)
2. Open **Settings → Pages**
3. Under **Build and deployment**, set **Source** to **GitHub Actions**
4. Push to `main` (or run the **Deploy GitHub Pages** workflow manually)
5. Wait ~1 minute, then open https://oobaretin.github.io/affirmation-flow/privacy/

GitHub Pages works with a **private repo** when using GitHub Actions. The published site is public.

## App Store Connect

| Field | URL |
|-------|-----|
| **Privacy Policy URL** | https://oobaretin.github.io/affirmation-flow/privacy/ |
| **Support URL** | https://oobaretin.github.io/affirmation-flow/ |

The app opens the privacy URL in Safari from Paywall and Settings.

## Updating the policy

1. Edit `docs/privacy/index.html`
2. Copy the same content to `public/privacy.html`
3. Update `src/pages/Privacy.tsx` if the in-app view should match
4. Push to `main` — GitHub Actions redeploys automatically

## Troubleshooting

- **404:** Confirm Pages source is **GitHub Actions**, not “Deploy from branch”
- **Old content:** Hard-refresh the browser or wait a few minutes for CDN cache
- **Workflow failed:** Repo → **Actions** → open the failed run for logs
