#!/usr/bin/env node
/**
 * CN ambient · runtime 探针（selectedCountry / tsUrl / runtimeUrl / shownSrc / img.currentSrc）
 *   WEB=https://tt-web-staging.fly.dev node scripts/dev/probe-cms-ambient-cn-runtime.cjs
 */
const { chromium } = require('../../frontend/node_modules/playwright');

const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const CN_CATALOG_TAIL = process.env.CN_CATALOG_TAIL || 'da-hero-cn-home-v1.jpg';

async function gotoStable(page) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      return;
    } catch (e) {
      if (attempt >= 5) throw e;
      await page.waitForTimeout(10000);
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--disable-http2'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await gotoStable(page);
  const form = page.locator('#landing-hero-form');
  await form.waitFor({ state: 'visible', timeout: 45000 });
  await page.waitForSelector('[data-tt-home-ambient-country="default"]', { timeout: 30000 });
  await page.waitForTimeout(5000);

  // 首屏首次 pill click 在 Playwright/staging 上常 noop；warmup 一次后再测 CN
  await form.getByRole('button', { name: '日本', exact: true }).click();
  await page.waitForTimeout(4000);

  await form.getByRole('button', { name: '中国', exact: true }).click();
  await page.waitForTimeout(6000);

  const probe = await page.evaluate(() => {
    const host = document.querySelector('[data-tt-home-ambient-phase="A"]');
    const img = host?.querySelector('img');
    return {
      selectedCountry: host?.getAttribute('data-tt-home-ambient-country') || '',
      tsUrl: host?.getAttribute('data-tt-home-ambient-ts-url') || '',
      runtimeUrl: host?.getAttribute('data-tt-home-ambient-runtime-url') || '',
      shownSrc: host?.getAttribute('data-tt-home-ambient-src') || '',
      imgCurrentSrc: img?.currentSrc || img?.src || '',
    };
  });

  console.log('TT_CN_AMBIENT_RUNTIME_PROBE:');
  console.log(JSON.stringify(probe, null, 2));

  const wiringOk =
    probe.selectedCountry === '中国' &&
    probe.shownSrc &&
    probe.runtimeUrl &&
    probe.shownSrc.split('?')[0] === probe.runtimeUrl.split('?')[0] &&
    !/unsplash|pexels/i.test(probe.shownSrc) &&
    probe.shownSrc.includes(CN_CATALOG_TAIL);

  console.log(`TT_CN_AMBIENT_RUNTIME_PROBE: ${wiringOk ? 'PASS' : 'GAPS_OPEN'}`);
  await browser.close();
  process.exit(wiringOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
