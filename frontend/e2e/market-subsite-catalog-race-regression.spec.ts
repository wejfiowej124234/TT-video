/**
 * Market Subsite Frontend Race Fix · browser regression (provider + acquisition).
 * Classification: frontend race — NOT DDG / OCS / SOPCP defect.
 *
 * Staging Phase②:
 *   MARKET_SUBSITE_RACE_TARGET=staging STAGING_WEB_BASE=... STAGING_API_BASE=...
 *
 * Local Phase① (staging_mirror API + local Next):
 *   MARKET_SUBSITE_RACE_TARGET=local LOCAL_WEB_BASE=http://127.0.0.1:3000 LOCAL_API_BASE=http://127.0.0.1:8080
 */
import { test, expect } from "@playwright/test";

const TARGET = (process.env.MARKET_SUBSITE_RACE_TARGET ?? "staging").toLowerCase();
const WEB = (
  TARGET === "local"
    ? (process.env.LOCAL_WEB_BASE ?? "http://127.0.0.1:3000")
    : (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev")
).replace(/\/$/, "");
const API = (
  TARGET === "local"
    ? (process.env.LOCAL_API_BASE ?? "http://127.0.0.1:8080")
    : (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev")
).replace(/\/$/, "");
const OUT_DIR = process.env.MARKET_SUBSITE_RACE_EVIDENCE_DIR;
const TAG = TARGET === "local" ? "@local_mirror" : "@staging";

type Subsite = "provider" | "acquisition";

const EXPECTED_ALL = 10;
const EXPECTED_PROVIDER_JP = 2;
const EXPECTED_ACQUISITION_JP = 0;

async function gotoWeb(page: import("@playwright/test").Page, url: string) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => undefined);
      return;
    } catch (e) {
      lastErr = e;
      await page.waitForTimeout(2000 * attempt);
    }
  }
  throw lastErr;
}

async function apiListingIds(
  request: import("@playwright/test").APIRequestContext,
  subsite: Subsite,
  search = "",
): Promise<string[]> {
  const path =
    subsite === "provider"
      ? `/api/v1/market/provider/listings?limit=50${search ? `&${search}` : ""}`
      : `/api/v1/market/acquisition/listings?limit=50${search ? `&${search}` : ""}`;
  let lastRes: import("@playwright/test").APIResponse | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await request.get(`${API}${path}`);
    lastRes = res;
    if (res.ok()) {
      const json = await res.json();
      return ((json.items ?? []) as { id: string }[]).map((r) => r.id).filter(Boolean);
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  expect(lastRes?.ok()).toBeTruthy();
  return [];
}

async function uiListingIds(page: import("@playwright/test").Page, minCount = 0): Promise<string[]> {
  if (minCount > 0) {
    await page.waitForFunction(
      (n) => new Set(
        Array.from(document.querySelectorAll("[data-listing-id]"))
          .map((el) => el.getAttribute("data-listing-id")?.trim() ?? "")
          .filter(Boolean),
      ).size >= n,
      minCount,
      { timeout: 30_000 },
    );
  } else {
    await page.waitForTimeout(800);
  }
  const raw = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-listing-id]"))
      .map((n) => n.getAttribute("data-listing-id")?.trim() ?? "")
      .filter(Boolean),
  );
  return [...new Set(raw)];
}

async function assertUiMatchesApi(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  subsite: Subsite,
  query = "",
  label = "",
  opts?: { allowEmpty?: boolean },
) {
  const apiIds = await apiListingIds(request, subsite, query);
  if (!opts?.allowEmpty) {
    expect(apiIds.length).toBeGreaterThan(0);
  }
  const uiIds = await uiListingIds(page, apiIds.length);
  expect(uiIds.length, `${label} ui count`).toBe(apiIds.length);
  const apiSet = new Set(apiIds);
  expect(uiIds.filter((id) => !apiSet.has(id)), `${label} unknown ids`).toEqual([]);
  return { apiIds, uiIds };
}

async function clearSubsiteCountryPrefs(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    localStorage.removeItem("tt_market_subsite_country_pref_provider");
    localStorage.removeItem("tt_market_subsite_country_pref_acquisition");
  });
}

async function setSubsiteCountryPref(page: import("@playwright/test").Page, subsite: Subsite, country: string) {
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    {
      key: subsite === "provider" ? "tt_market_subsite_country_pref_provider" : "tt_market_subsite_country_pref_acquisition",
      value: country,
    },
  );
}

test.describe(`Market Subsite Catalog Race ${TAG}`, () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await gotoWeb(page, `${WEB}/market`);
    await clearSubsiteCountryPrefs(page);
  });

  for (const subsite of ["provider", "acquisition"] as const) {
    const path = `/market/${subsite}`;

    test(`${subsite}: first SPA entry matches API (all countries)`, async ({ page, request }) => {
      await page.locator(`a[href="${path}"]`).first().click();
      await page.waitForURL(`**${path}**`, { timeout: 30_000 });
      await page.waitForTimeout(1200);
      const { apiIds } = await assertUiMatchesApi(page, request, subsite, "", "first-entry");
      expect(apiIds.length).toBe(EXPECTED_ALL);
      if (OUT_DIR) {
        await page.screenshot({ path: `${OUT_DIR}/${TARGET}-${subsite}-first-entry.png`, fullPage: true });
      }
    });

    test(`${subsite}: sub-nav switch then back matches API`, async ({ page, request }) => {
      await page.locator(`a[href="${path}"]`).first().click();
      await page.waitForURL(`**${path}**`, { timeout: 30_000 });
      const other = subsite === "provider" ? "/market/acquisition" : "/market/provider";
      await page.locator(`a[href="${other}"]`).first().click();
      await page.waitForURL(`**${other}**`, { timeout: 30_000 });
      await page.locator(`a[href="${path}"]`).first().click();
      await page.waitForURL(`**${path}**`, { timeout: 30_000 });
      await page.waitForTimeout(1200);
      const { apiIds } = await assertUiMatchesApi(page, request, subsite, "", "subnav");
      expect(apiIds.length).toBe(EXPECTED_ALL);
    });

    test(`${subsite}: country=all explicit matches API (${EXPECTED_ALL})`, async ({ page, request }) => {
      await gotoWeb(page, `${WEB}${path}?country=all`);
      await page.waitForTimeout(1000);
      const { apiIds } = await assertUiMatchesApi(page, request, subsite, "", "country-all");
      expect(apiIds.length).toBe(EXPECTED_ALL);
    });

    test(`${subsite}: country=jp matches API`, async ({ page, request }) => {
      const query = "country=jp";
      await gotoWeb(page, `${WEB}${path}?country=jp`);
      await page.waitForTimeout(1000);
      const expected = subsite === "provider" ? EXPECTED_PROVIDER_JP : EXPECTED_ACQUISITION_JP;
      const { apiIds } = await assertUiMatchesApi(page, request, subsite, query, "country-jp", {
        allowEmpty: subsite === "acquisition",
      });
      expect(apiIds.length).toBe(expected);
      if (OUT_DIR) {
        await page.screenshot({ path: `${OUT_DIR}/${TARGET}-${subsite}-country-jp.png`, fullPage: true });
      }
    });

    test(`${subsite}: hard refresh (cleared localStorage) matches API all`, async ({ page, request }) => {
      await clearSubsiteCountryPrefs(page);
      await gotoWeb(page, `${WEB}${path}`);
      await page.waitForTimeout(1000);
      const before = await assertUiMatchesApi(page, request, subsite, "", "pre-refresh");
      expect(before.apiIds.length).toBe(EXPECTED_ALL);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => undefined);
      await page.waitForTimeout(1000);
      const after = await assertUiMatchesApi(page, request, subsite, "", "post-refresh");
      expect(after.apiIds.length).toBe(EXPECTED_ALL);
      expect(after.uiIds.length).toBe(before.uiIds.length);
    });

    test(`${subsite}: localStorage jp hydration matches API jp`, async ({ page, request }) => {
      await setSubsiteCountryPref(page, subsite, "jp");
      await gotoWeb(page, `${WEB}${path}`);
      await page.waitForTimeout(1500);
      const expected = subsite === "provider" ? EXPECTED_PROVIDER_JP : EXPECTED_ACQUISITION_JP;
      const { apiIds, uiIds } = await assertUiMatchesApi(page, request, subsite, "country=jp", "ls-hydrate-jp", {
        allowEmpty: subsite === "acquisition",
      });
      expect(apiIds.length).toBe(expected);
      expect(uiIds.length).toBe(expected);
      await expect(page).toHaveURL(/country=jp/i);
    });
  }
});
