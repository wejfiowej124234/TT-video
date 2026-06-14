/**
 * ① Publish Hub L5 Full · `/me/publish` 探针走廊（tourist@test.com）
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("Publish hub full L5 probes (① local)", () => {
  test("logged-in user sees publish hub shell, filters, and rails container", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request.post(`${API_BASE}/auth/seed-test-accounts`, {
      data: {},
      headers: { "Content-Type": "application/json" },
    });

    await page.goto("/auth/login?returnUrl=%2Fme%2Fpublish", { timeout: 60_000 });
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByRole("textbox", { name: /password|密码/i }).fill("Test123!");
    await page.getByRole("button", { name: /sign in|登录/i }).click();
    await page.waitForURL(/\/me\/publish/, { timeout: 60_000 });

    const shell = page.locator('[data-tt-publish-hub="1"]');
    await expect(shell).toBeVisible({ timeout: 30_000 });
    await expect(shell).toHaveAttribute("data-tt-publish-hub-ui-frozen", "1");
    await expect(shell).toHaveAttribute("data-tt-publish-hub-l5-closure-probe", "publish-hub-full-v1");
    await expect(shell).toHaveAttribute("data-tt-ui-frozen", "publish-hub-l5-20260612");

    await expect(page.locator('[data-tt-publish-hub-filters="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-publish-hub-rails="1"]')).toBeVisible();
    await expect(page.getByRole("tab", { name: /全部|All/i })).toBeVisible();

    await page.getByRole("tab", { name: /行程|Trips/i }).click();
    await expect(page.locator('[data-tt-publish-hub-rail="trip"]')).toBeVisible();
  });
});

test.describe("Publish hub Wave1 workspace context (① · multi-demo)", () => {
  test("E1/E3: operating spine + context switch opens merchant workbench path", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request.post(`${API_BASE}/auth/seed-test-accounts`, {
      data: {},
      headers: { "Content-Type": "application/json" },
    });

    await page.goto("/auth/login?returnUrl=%2Fme%2Fpublish", { timeout: 60_000 });
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("multi-demo@test.com");
    await page.getByRole("textbox", { name: /password|密码/i }).fill("Test123!");
    await page.getByRole("button", { name: /sign in|登录/i }).click();
    await page.waitForURL(/\/me\/publish/, { timeout: 60_000 });

    const spine = page.locator("[data-tt-publish-hub-operating-spine]");
    await expect(spine).toBeVisible({ timeout: 30_000 });
    await expect(spine).toContainText(/产出总览|Publish overview/i);

    await page.getByRole("button", { name: /User menu|用户菜单/i }).click();
    const contextSwitcher = page.locator('[data-tt-header-workspace-context="1"]');
    const switcherVisible = await contextSwitcher.isVisible().catch(() => false);
    if (!switcherVisible) {
      test.skip(true, "multi-demo 无多槽 Workspace Context switcher（需 seed-publish-hub-multi-demo-local.sh）");
    }

    await contextSwitcher.getByRole("button", { name: /当前经营身份|Operating as/i }).click();
    await contextSwitcher.getByRole("option", { name: /商家|Merchant/i }).click();
    await page.waitForURL(/identity=merchant/, { timeout: 30_000 });
    await expect(spine).toHaveAttribute("data-tt-publish-hub-operating-spine", "merchant");

    await page.getByRole("button", { name: /User menu|用户菜单/i }).click();
    const workbenchLink = page.locator('[data-tt-header-workspace-context-workbench="1"]');
    await expect(workbenchLink).toBeVisible();
    await expect(workbenchLink).toHaveAttribute("href", /\/provider/);
  });
});
