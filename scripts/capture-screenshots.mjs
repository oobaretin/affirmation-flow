#!/usr/bin/env node
/**
 * Captures App Store screenshots at iPhone 16 Pro Max size (1290×2796).
 * Uses the Vite dev server + Playwright (same UI as the iOS app).
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs/screenshots');
const PORT = 5174;
const BASE = `http://127.0.0.1:${PORT}`;

const NODE_BIN = path.join(ROOT, '.tools/node-v22.14.0-darwin-x64/bin');
const ENV_PATH = `${NODE_BIN}${path.delimiter}${process.env.PATH ?? ''}`;

const IPHONE_16_PRO_MAX = {
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
};

const BASE_SETTINGS = {
  name: 'Alex',
  onboardingComplete: true,
  isLoggedIn: true,
  repeatMode: 'fixed',
  repeatCount: 7,
  voiceEnabled: true,
  voiceStyle: 'soothing',
  voiceURI: '',
  notificationsEnabled: true,
  notificationHour: 8,
  notificationMinute: 0,
  focusCategories: ['Self-Love', 'Confidence', 'Peace'],
};

const FAVORITES = [
  {
    id: 'sl-1',
    text: 'I am worthy of love and respect, exactly as I am.',
    category: 'Self-Love',
  },
  {
    id: 'cf-1',
    text: 'I trust my ability to handle whatever comes my way.',
    category: 'Confidence',
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function startDevServer(subscriptionBypass) {
  const env = {
    ...process.env,
    PATH: ENV_PATH,
    VITE_SUBSCRIPTION_DEV_BYPASS: subscriptionBypass ? 'true' : 'false',
  };

  return spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--host', '127.0.0.1'], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForServer(timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {
      // server still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  throw new Error('Dev server did not become ready in time');
}

async function seedStorage(page, payload) {
  await page.goto(BASE);
  await page.evaluate((data) => {
    localStorage.clear();
    sessionStorage.clear();
    if (data.settings) {
      localStorage.setItem('affirmation-flow-settings', JSON.stringify(data.settings));
    }
    if (data.favorites) {
      localStorage.setItem('affirmation-flow-favorites', JSON.stringify(data.favorites));
    }
    if (data.streak) {
      localStorage.setItem('affirmation-flow-streak', JSON.stringify(data.streak));
    }
  }, payload);
}

async function capture(page, filename, route, waitForText) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  if (waitForText) {
    await page.getByText(waitForText, { exact: false }).first().waitFor({ timeout: 15000 });
  }
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(OUT_DIR, filename),
    fullPage: false,
  });
  console.log(`  ✓ ${filename}`);
}

async function capturePaywall(page) {
  await seedStorage(page, {
    settings: { ...BASE_SETTINGS, onboardingComplete: true, isLoggedIn: true },
  });
  await page.goto(`${BASE}/paywall`, { waitUntil: 'networkidle' });
  await page.getByText('Hear the difference').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(OUT_DIR, '01-paywall.png'),
    fullPage: false,
  });
  console.log('  ✓ 01-paywall.png');
}

async function captureOnboarding(page) {
  await seedStorage(page, {
    settings: {
      ...BASE_SETTINGS,
      name: '',
      onboardingComplete: false,
      isLoggedIn: false,
      focusCategories: [],
    },
  });
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
  await page.getByText('What matters to you?').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(OUT_DIR, '06-onboarding.png'),
    fullPage: false,
  });
  console.log('  ✓ 06-onboarding.png');
}

async function captureSettingsVoice(page) {
  await seedStorage(page, {
    settings: BASE_SETTINGS,
    favorites: FAVORITES,
    streak: { lastPracticeDate: todayIso(), currentStreak: 5 },
  });
  await page.goto(`${BASE}/settings/voice`, { waitUntil: 'networkidle' });
  await page.getByText('Voice affirmations').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(OUT_DIR, '05-settings-voice.png'),
    fullPage: false,
  });
  console.log('  ✓ 05-settings-voice.png');
}

async function runCaptureSet({ subscriptionBypass, includePaywall, includeApp }) {
  const server = startDevServer(subscriptionBypass);
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const context = await browser.newContext(IPHONE_16_PRO_MAX);
    const page = await context.newPage();

    console.log(`\nCapturing (${subscriptionBypass ? 'app' : 'paywall'} mode)...`);

    if (includePaywall) {
      await capturePaywall(page);
    }

    if (includeApp) {
      await seedStorage(page, {
        settings: BASE_SETTINGS,
        favorites: FAVORITES,
        streak: { lastPracticeDate: todayIso(), currentStreak: 5 },
      });

      await capture(page, '02-today.png', '/today', 'Alex');
      await capture(page, '03-saved.png', '/my', 'Saved');
      await captureSettingsVoice(page);
      await captureOnboarding(page);
    }

    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Saving iPhone 16 Pro Max screenshots (1290×2796) to ${OUT_DIR}`);

  await runCaptureSet({ subscriptionBypass: true, includePaywall: false, includeApp: true });
  await runCaptureSet({ subscriptionBypass: false, includePaywall: true, includeApp: false });

  console.log('\nDone — 5 screenshots saved.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
