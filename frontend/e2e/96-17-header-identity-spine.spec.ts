/**
 * 96-17 §0.3.5：顶栏登录用户菜单按钮的 **`aria-label`/`title`** 与四脊签 **`meIdentitySpineActiveCount`**
 * 同源（默认 zh：`用户菜单，已开通身份：旅行者`）。须 **API + Next** 同栈；无种子或登录失败时 **skip**。
 *
 * **不经** **`setup-meta-chain`**：使用 **`--project=chromium-96-17-identity`**（见 **`playwright.config.ts`**）。
 * 本地入口：**`npm run e2e:96-17-identity-local`**（**`scripts/run-e2e-96-17-identity-local.mjs`**，强制 **`PLAYWRIGHT_FULL_STACK=1`**）。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";

test.describe("96-17 · Header identity spine disclosure", () => {
  test("tourist session: user menu exposes 旅行者 in aria-label and title", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");
    await gotoWithBearerSession(page, "/", creds);
    const want = "用户菜单，已开通身份：旅行者";
    const btn = page.locator('[data-tt-header-user-menu="1"]');
    await expect(btn).toBeVisible({ timeout: 60_000 });
    await expect(btn).toHaveAttribute("aria-label", want);
    await expect(btn).toHaveAttribute("title", want);
    await expect(page.getByRole("button", { name: want })).toBeVisible();
  });
});
