import { expect, type Page } from "@playwright/test";

import {
  assertItineraryNewDataReadyGate,
  gotoItineraryNewReady,
  gotoItineraryNewReadyAuthed,
  pickItineraryCountryAndCity,
  submitItineraryFormWaitResult,
  waitForCatalogCitiesResponse,
  waitForCatalogCountriesResponse,
} from "./dataReadyGate";
import { escrowDetailPageShell, marketPageShell, ordersNewPageShell } from "./pageShells";
import { gotoSmoke } from "./smoke-nav";
import { expectUiShellVisible, UI_CONTRACT_TIMEOUT_MS } from "./uiContractLayer";

export {
  assertItineraryNewDataReadyGate,
  gotoItineraryNewReady,
  gotoItineraryNewReadyAuthed,
  pickItineraryCountryAndCity,
  submitItineraryFormWaitResult,
  waitForCatalogCitiesResponse,
  waitForCatalogCountriesResponse,
};

export function itineraryCountryPill(page: Page, country = "中国") {
  return page.locator(`[data-tt-itinerary-country-pill="${country}"]`);
}

export function itineraryCityPill(page: Page, city = "北京") {
  return page.locator(`[data-tt-itinerary-city-pill="${city}"]`);
}

export async function gotoHomePlanFormReady(page: Page): Promise<void> {
  await gotoSmoke(page, "/", { waitUntil: "domcontentloaded", timeout: UI_CONTRACT_TIMEOUT_MS });
  await expect(page.locator("#form")).toBeAttached();
  await expect(page.locator('[data-tt-home-first-task="plan"]')).toBeAttached();
}

export async function gotoMarketReady(page: Page): Promise<void> {
  await gotoSmoke(page, "/market", { waitUntil: "domcontentloaded", timeout: UI_CONTRACT_TIMEOUT_MS });
  await expectUiShellVisible(marketPageShell(page));
}

export async function gotoOrdersNewReady(page: Page): Promise<void> {
  await gotoSmoke(page, "/orders/new", { waitUntil: "domcontentloaded", timeout: UI_CONTRACT_TIMEOUT_MS });
  await expectUiShellVisible(ordersNewPageShell(page));
}

export async function gotoEscrowDetailReady(page: Page, orderId: string): Promise<void> {
  const orderReady = page
    .waitForResponse(
      (res) => {
        if (res.request().method() !== "GET" || !res.ok()) return false;
        try {
          return new URL(res.url()).pathname.includes(`/api/v1/orders/${orderId}`);
        } catch {
          return false;
        }
      },
      { timeout: UI_CONTRACT_TIMEOUT_MS },
    )
    .catch(() => undefined);
  await gotoSmoke(page, `/escrow/${encodeURIComponent(orderId)}`, {
    waitUntil: "domcontentloaded",
    timeout: UI_CONTRACT_TIMEOUT_MS,
  });
  await orderReady;
  await expectUiShellVisible(escrowDetailPageShell(page));
}
