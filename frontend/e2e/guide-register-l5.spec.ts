import { test, expect } from "@playwright/test";
import { guideRegisterPageShell } from "./helpers/pageShells";
import {
  defaultApiBase,
  gotoWithBearerSession,
  seedAndLoginTouristTestCredentials,
} from "./helpers/apiSession";

test.describe("guide register L5 @guide-register", () => {
  test("guest: login gate visible", async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto("/guide/register?step=1");
    await expect(guideRegisterPageShell(page)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("alert").filter({ hasText: /登录后才能提交|log in to submit/i })).toBeVisible();
  });

  test("logged-in: merged banners and wallet verify CTA", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const creds = await seedAndLoginTouristTestCredentials(request, apiBase);
    test.skip(!creds, "seed/login tourist@test.com failed (API / SEED_TEST_ACCOUNTS)");

    await page.addInitScript(() => {
      localStorage.removeItem("traveltrust_guide_wallet_verified_v1");
    });
    await gotoWithBearerSession(page, "/guide/register?step=1", creds!);
    await expect(guideRegisterPageShell(page)).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText(/申请须知|Application notes/i)).toBeVisible();
    await page.locator('[data-tt-guide-register-wallet-input="1"]').fill(`0x${"c".repeat(40)}`);
    await expect(
      page.getByRole("button", { name: /签名验证钱包|Verify wallet by signature/i }),
    ).toBeVisible();
  });
});
