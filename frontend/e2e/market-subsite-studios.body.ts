/**
 * 94/31 · 市场子站 **Provider / Acquisition** 工作室与封面预览。
 * 入口：`market-subsite-studio-and-community-publish.spec.ts`。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { marketAcquisitionPageShell, marketProviderPageShell } from "./helpers/pageShells";
import {
  openAcquisitionCarryStudioFromAcquisitionRoot,
  openMerchantShowcaseStudioFromProviderRoot,
} from "./helpers/marketStudioOpen";
import { requestGetExpectOkWith429Backoff } from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { reloadSmoke } from "./helpers/smoke-nav";
import { API_BASE, E2E_PNG_1X1 } from "./market-subsite-shared";

test.describe("94/31 · market subsite studios (provider + acquisition)", () => {
  test.describe.configure({ retries: 2 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("provider studio: POST catalog + GET payload.title + title on masonry after reload", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    const title = `e2e-prov-${Date.now()}`;

    await gotoWithBearerSession(page, "/market/provider", cred);
    const providerShell = marketProviderPageShell(page);
    await expect(providerShell).toBeVisible({ timeout: 90_000 });
    const merchantStudio = await openMerchantShowcaseStudioFromProviderRoot(page, providerShell);

    await merchantStudio.locator("#m-studio-title").fill(title);
    await merchantStudio.locator("#m-studio-price").fill("199");
    await merchantStudio.getByRole("checkbox").check();

    const postListing = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/market/provider/listings") &&
        !r.url().includes("/drafts") &&
        r.status() === 200,
      { timeout: 120_000 },
    );

    await merchantStudio.getByRole("button", { name: /Save draft|保存草稿/ }).click();
    const res = await postListing;
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as { listing_id?: string; status?: string };
    const listingId = (body.listing_id ?? "").trim();
    expect(listingId.length, "listing_id").toBeGreaterThan(4);

    const getRes = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/market/provider/listings/${encodeURIComponent(listingId)}`,
    );
    expect(getRes.ok(), await getRes.text()).toBeTruthy();
    const row = (await getRes.json()) as { listing?: { payload?: { title?: string } } };
    expect(row.listing?.payload?.title).toBe(title);

    await reloadSmoke(page, { timeout: 90_000 });
    await page.waitForResponse(
      (r) => {
        if (r.request().method() !== "GET" || r.status() !== 200) return false;
        try {
          const p = new URL(r.url()).pathname.replace(/\/+$/, "");
          return p.endsWith("/market/provider/listings");
        } catch {
          return false;
        }
      },
      { timeout: 120_000 },
    );
    const providerShellAfterReload = marketProviderPageShell(page);
    await expect(providerShellAfterReload).toBeVisible({ timeout: 90_000 });
    const titleCell = providerShellAfterReload.getByText(title, { exact: true }).first();
    await titleCell.scrollIntoViewIfNeeded();
    await expect(titleCell).toBeVisible({
      timeout: 90_000,
    });
  });

  test("acquisition studio: POST catalog + GET payload.title + title on masonry after reload", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    const title = `e2e-acq-${Date.now()}`;

    await gotoWithBearerSession(page, "/market/acquisition", cred);
    const acquisitionShell = marketAcquisitionPageShell(page);
    await expect(acquisitionShell).toBeVisible({ timeout: 90_000 });
    const acquisitionStudioDraft = await openAcquisitionCarryStudioFromAcquisitionRoot(page, acquisitionShell);

    await acquisitionStudioDraft.locator("#a-studio-title").fill(title);
    await acquisitionStudioDraft.locator("#a-studio-min").fill("50");
    await acquisitionStudioDraft.locator("#a-studio-max").fill("200");
    await acquisitionStudioDraft.locator("#a-studio-iso").selectOption("CN");
    await acquisitionStudioDraft.getByRole("checkbox").check();

    const postListing = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/market/acquisition/listings") &&
        !r.url().includes("/drafts") &&
        r.status() === 200,
      { timeout: 120_000 },
    );

    await acquisitionStudioDraft.getByRole("button", { name: /Save acquisition draft|保存收购草稿|保存草稿/ }).click();
    const res = await postListing;
    expect(res.ok(), await res.text()).toBeTruthy();
    const pub = (await res.json()) as { listing_id?: string };
    const listingId = (pub.listing_id ?? "").trim();
    expect(listingId.length).toBeGreaterThan(4);

    const getRes = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/market/acquisition/listings/${encodeURIComponent(listingId)}`,
    );
    expect(getRes.ok(), await getRes.text()).toBeTruthy();
    const row = (await getRes.json()) as { listing?: { payload?: { title?: string } } };
    expect(row.listing?.payload?.title).toBe(title);

    await reloadSmoke(page, { timeout: 90_000 });
    await page.waitForResponse(
      (r) => {
        if (r.request().method() !== "GET" || r.status() !== 200) return false;
        try {
          const p = new URL(r.url()).pathname.replace(/\/+$/, "");
          return p.endsWith("/market/acquisition/listings");
        } catch {
          return false;
        }
      },
      { timeout: 120_000 },
    );
    const acquisitionShellAfterReload = marketAcquisitionPageShell(page);
    await expect(acquisitionShellAfterReload).toBeVisible({ timeout: 90_000 });
    const acqTitleCell = acquisitionShellAfterReload.getByText(title, { exact: true }).first();
    await acqTitleCell.scrollIntoViewIfNeeded();
    await expect(acqTitleCell).toBeVisible({
      timeout: 90_000,
    });
  });

  test("provider studio: 1×1 PNG cover shows preview (setInputFiles)", async ({ page, request }) => {
    test.setTimeout(180_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    await gotoWithBearerSession(page, "/market/provider", cred);
    const providerShellPng = marketProviderPageShell(page);
    await expect(providerShellPng).toBeVisible({ timeout: 90_000 });
    const merchantStudio = await openMerchantShowcaseStudioFromProviderRoot(page, providerShellPng);

    await merchantStudio.locator("#m-studio-cover").setInputFiles({
      name: "e2e-cover.png",
      mimeType: "image/png",
      buffer: E2E_PNG_1X1,
    });
    await expect(merchantStudio.getByRole("img", { name: /Cover preview|封面预览/i })).toBeVisible({
      timeout: 90_000,
    });
  });

  test("acquisition studio: 1×1 PNG cover shows preview (setInputFiles)", async ({ page, request }) => {
    test.setTimeout(180_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    await gotoWithBearerSession(page, "/market/acquisition", cred);
    const acquisitionShellPng = marketAcquisitionPageShell(page);
    await expect(acquisitionShellPng).toBeVisible({ timeout: 90_000 });
    const acquisitionStudio = await openAcquisitionCarryStudioFromAcquisitionRoot(page, acquisitionShellPng);

    await acquisitionStudio.locator("#a-studio-cover").setInputFiles({
      name: "e2e-acq-cover.png",
      mimeType: "image/png",
      buffer: E2E_PNG_1X1,
    });
    await expect(acquisitionStudio.getByRole("img", { name: /Cover preview|封面预览/i })).toBeVisible({
      timeout: 90_000,
    });
  });
});

