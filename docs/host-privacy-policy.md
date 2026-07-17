# Host privacy policy (free options)

App Store Connect requires a **public URL** for your privacy policy. The file is ready at `public/privacy.html`.

Pick one free option:

## Option A — Netlify Drop (easiest, ~2 minutes)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag `public/privacy.html` onto the page
3. Netlify gives you a URL like `https://random-name.netlify.app/privacy.html`
4. Rename/custom domain later if you want

## Option B — GitHub Pages (if repo is public)

1. Push repo or only `public/privacy.html` to a public repo
2. Settings → Pages → deploy from `main` / `/public`
3. URL: `https://yourusername.github.io/affirmation-flow/privacy.html`

Your repo is **private**, so Pages won’t work unless you make a small public repo just for the policy.

## Option C — Cloudflare Pages (free)

1. Sign up at [pages.cloudflare.com](https://pages.cloudflare.com)
2. Create project → upload `public/` folder
3. Use `https://your-project.pages.dev/privacy.html`

## Option D — Use support email only (not enough)

Apple requires a **URL**, not just email. Use Option A for now.

## After hosting

1. Open the URL in a browser and confirm it loads
2. Save URL for App Store Connect → **App Privacy** → Privacy Policy URL
3. Update `README.md` and App Store metadata with the live link

## Keep in sync

If you change `src/pages/Privacy.tsx`, also update `public/privacy.html` before submission.
