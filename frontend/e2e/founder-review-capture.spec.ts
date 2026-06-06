/**
 * Founder Review — browser capture only (no assertions).
 * Run: cd frontend && npx playwright test e2e/founder-review-capture.spec.ts --config=playwright.founder-review.config.ts
 */
import { test } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), '../evidence/founder-review-20260531/screenshots');
mkdirSync(OUT, { recursive: true });

const routes = [
  '01-home-desktop:/',
  '02-traveltrust-desktop:/traveltrust',
  '03-market-desktop:/market',
  '04-did-rank-desktop:/did-rank',
  '05-community-feed-desktop:/community',
  '06-community-explore-desktop:/community/explore',
  '07-community-friends-desktop:/community/friends',
  '08-community-messages-desktop:/community/messages',
  '09-auth-login-desktop:/auth/login',
  '10-auth-register-desktop:/auth/register',
  '11-provider-register-desktop:/provider/register',
  '12-me-identities-desktop:/me/identities',
];

for (const entry of routes) {
  const [name, path] = entry.split(':');
  test(`capture ${name}`, async ({ page }) => {
    const url = path;
    const waitUntil = url === '/auth/register' ? 'domcontentloaded' : 'networkidle';
    await page.goto(url, {
      waitUntil,
      timeout: 90000,
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  });
}

test('capture 13-home-mobile', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, '13-home-mobile.png'), fullPage: true });
  await ctx.close();
});

test('capture 14-community-mobile', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto('/community', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, '14-community-mobile.png'), fullPage: true });
  await ctx.close();
});

test('capture 15-traveltrust-mobile', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto('/traveltrust', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, '15-traveltrust-mobile.png'), fullPage: true });
  await ctx.close();
});
