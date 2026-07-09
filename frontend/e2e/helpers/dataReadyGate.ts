/**
 * 统一 data ready gate（① E2E · GATE-P1-01 / BOOK-P0-02 同源）
 *
 * 判定：导航前短 probe（5s）+ 页面 state commit（data-tt-*）。
 * 禁止 DOM 可见性轮询；禁止在 state commit 可断言时再叠 90s waitForResponse。
 */
import { expect, type APIRequestContext, type Page, type Response } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  hydrateBearerSessionAccepted,
  seedTestAccountsAndReleaseGuideSlot,
  type BearerSessionCredentials,
} from "./apiSession";
import { itineraryNewPageShell, traveltrustNetworkPageShell } from "./pageShells";
import { gotoSmoke } from "./smoke-nav";
import { assertTraveltrustV6HydrationContract } from "./traveltrustV6HydrationContract";
import { expectUiShellVisible, UI_CONTRACT_TIMEOUT_MS } from "./uiContractLayer";

export const ITINERARY_DEFAULT_COUNTRY = "中国";
export const ITINERARY_DEFAULT_CITY = "北京";

const RESPONSE_PROBE_MS = 5_000;

function isCatalogCountriesResponse(res: Response): boolean {
  return res.request().method() === "GET" && res.url().includes("/api/v1/catalog/countries") && res.ok();
}

function isCatalogCitiesResponse(res: Response): boolean {
  return res.request().method() === "GET" && res.url().includes("/api/v1/catalog/cities") && res.ok();
}

function isMeResponse(res: Response): boolean {
  return res.request().method() === "GET" && res.url().includes("/api/v1/me");
}

function isTraveltrustPageBriefResponse(res: Response): boolean {
  return (
    res.request().method() === "GET" &&
    res.url().includes("/api/v1/traveltrust/page-brief") &&
    res.ok()
  );
}

function isPostItineraryCreate(res: Response): boolean {
  const req = res.request();
  if (req.method() !== "POST") return false;
  try {
    const path = new URL(res.url()).pathname.replace(/\/$/, "");
    return path.endsWith("/api/v1/itineraries");
  } catch {
    return false;
  }
}

function waitForResponseProbe(page: Page, predicate: (res: Response) => boolean) {
  return page.waitForResponse(predicate, { timeout: RESPONSE_PROBE_MS }).catch(() => undefined);
}

export function waitForCatalogCountriesResponse(page: Page) {
  return waitForResponseProbe(page, isCatalogCountriesResponse);
}

export function waitForCatalogCitiesResponse(page: Page) {
  return waitForResponseProbe(page, isCatalogCitiesResponse);
}

export function waitForMeResponse(page: Page, acceptStatuses: number[] = [200, 401]) {
  return waitForResponseProbe(page, (res) => isMeResponse(res) && acceptStatuses.includes(res.status()));
}

export function waitForTraveltrustPageBriefResponse(page: Page) {
  return waitForResponseProbe(page, isTraveltrustPageBriefResponse);
}

function itineraryNewMain(page: Page) {
  return page.locator('[data-tt-itinerary-new-page="1"]');
}

async function assertItinerarySessionCommit(page: Page, require200: boolean): Promise<void> {
  if (!require200) return;
  const main = itineraryNewMain(page);
  await expect(main).toHaveAttribute("data-tt-itinerary-session-status", "200", {
    timeout: UI_CONTRACT_TIMEOUT_MS,
  });
}

/** catalog + session 单一 data-ready state commit */
export async function assertItineraryNewDataReadyGate(
  page: Page,
  options?: { requireSession200?: boolean },
): Promise<void> {
  const main = itineraryNewMain(page);
  await expect(main).toHaveAttribute("data-tt-itinerary-data-ready", "1", {
    timeout: UI_CONTRACT_TIMEOUT_MS,
  });
  await assertItinerarySessionCommit(page, !!options?.requireSession200);
}

export async function pickItineraryCountryAndCity(
  page: Page,
  country = ITINERARY_DEFAULT_COUNTRY,
  city = ITINERARY_DEFAULT_CITY,
): Promise<void> {
  await assertItineraryNewDataReadyGate(page);
  const main = itineraryNewMain(page);

  const currentCountry = (await main.getAttribute("data-tt-itinerary-geo-country")) ?? "";
  const currentCity = (await main.getAttribute("data-tt-itinerary-geo-city")) ?? "";
  if (currentCountry === country && currentCity === city) return;

  if (currentCountry !== country) {
    const citiesReady = waitForCatalogCitiesResponse(page);
    await page.locator(`[data-tt-itinerary-country-pill="${country}"]`).evaluate((el: HTMLElement) => {
      el.click();
    });
    await citiesReady;
    await expect(main).toHaveAttribute("data-tt-itinerary-geo-country", country, {
      timeout: UI_CONTRACT_TIMEOUT_MS,
    });
    await expect(main).toHaveAttribute("data-tt-itinerary-catalog-cities-ready", "1", {
      timeout: UI_CONTRACT_TIMEOUT_MS,
    });
  }

  if (((await main.getAttribute("data-tt-itinerary-geo-city")) ?? "") !== city) {
    await page.locator(`[data-tt-itinerary-city-pill="${city}"]`).evaluate((el: HTMLElement) => {
      el.click();
    });
    await expect(main).toHaveAttribute("data-tt-itinerary-geo-city", city, {
      timeout: UI_CONTRACT_TIMEOUT_MS,
    });
  }
}

export async function gotoItineraryNewReady(page: Page, path = "/itinerary/new"): Promise<void> {
  if (!page.url().includes("/itinerary/new")) {
    const countriesReady = waitForCatalogCountriesResponse(page);
    const meReady = waitForMeResponse(page, [200, 401]);
    await gotoSmoke(page, path, { waitUntil: "domcontentloaded", timeout: UI_CONTRACT_TIMEOUT_MS });
    await Promise.all([countriesReady, meReady]);
  }
  await expectUiShellVisible(itineraryNewPageShell(page));
  await assertItineraryNewDataReadyGate(page);
}

export async function gotoItineraryNewReadyAuthed(
  page: Page,
  request: APIRequestContext,
  path = "/itinerary/new",
): Promise<void> {
  const apiBase = defaultApiBase();
  await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
  const countriesReady = waitForCatalogCountriesResponse(page);
  const meReady = waitForMeResponse(page, [200]);
  if (creds?.token) {
    await gotoWithBearerSession(page, path, creds);
    await hydrateBearerSessionAccepted(page, creds as BearerSessionCredentials);
  } else {
    await gotoSmoke(page, path, { waitUntil: "domcontentloaded", timeout: UI_CONTRACT_TIMEOUT_MS });
  }
  await Promise.all([countriesReady, meReady]);
  await expectUiShellVisible(itineraryNewPageShell(page));
  await assertItineraryNewDataReadyGate(page, { requireSession200: !!creds?.token });
}

export async function submitItineraryFormWaitResult(page: Page): Promise<boolean> {
  const createDone = page.waitForResponse(isPostItineraryCreate, { timeout: UI_CONTRACT_TIMEOUT_MS });
  await page.getByRole("button", { name: /生成|Submit|提交/i }).click();
  const res = await createDone;
  if (!res.ok()) return false;
  await expect(page.locator('main [role="status"]').first()).toBeAttached({
    timeout: UI_CONTRACT_TIMEOUT_MS,
  });
  return true;
}

export async function gotoTraveltrustHashDataReady(page: Page, hash: string): Promise<void> {
  const normalized = hash.startsWith("#") ? hash : `#${hash}`;
  const briefReady = waitForTraveltrustPageBriefResponse(page);
  const meReady = waitForMeResponse(page, [200, 401]);
  await gotoSmoke(page, `/traveltrust${normalized}`, {
    waitUntil: "domcontentloaded",
    timeout: UI_CONTRACT_TIMEOUT_MS,
  });
  await Promise.all([briefReady, meReady]);
  await assertTraveltrustV6HydrationContract(page);
}

export async function assertTraveltrustRoleHydrationCommit(page: Page, roleId: string): Promise<void> {
  const shell = traveltrustNetworkPageShell(page);
  await expect(shell.locator("#roles")).toHaveAttribute("data-tt-traveltrust-active-role-id", roleId, {
    timeout: UI_CONTRACT_TIMEOUT_MS,
  });
  await expect(shell.locator("#roles")).toHaveAttribute("data-tt-traveltrust-role-hydration-ready", "1", {
    timeout: UI_CONTRACT_TIMEOUT_MS,
  });
}

export async function gotoTraveltrustRoleHashReady(page: Page, roleId: string): Promise<void> {
  await gotoTraveltrustHashDataReady(page, `#${roleId}`);
  await assertTraveltrustRoleHydrationCommit(page, roleId);
}
