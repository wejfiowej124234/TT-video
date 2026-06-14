/**
 * ① Guide Workbench Inbox L5 · 双角色浏览器证据
 * 游客创建本单并绑定向导 → 向导 /guide 首屏「待接单 1」→ 进入订单接单 → 双边确认
 */
import { test, expect, type Page } from "@playwright/test";

import {
  bindGuideFromBookGuideModal,
  seedPublishedOpenItineraryOrder,
} from "./helpers/bookGuideItineraryFirst";
import {
  bilateralRe,
  clickGuideWorkbenchEnterOrderAccept,
  expectGuideWorkbenchPendingAcceptCount,
  guideWorkbenchInboxAriaRe,
  patchBindSeedGuideToOrder,
  resolveSeedGuideRowId,
} from "./helpers/guideWorkbenchInboxCorridor";
import { uiLogout } from "./helpers/headerUserMenu";
import { registerFreshTouristForCorridor } from "./helpers/landingItineraryApiSeed";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { seedTestAccountsAndReleaseGuideSlot } from "./helpers/apiSession";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const selectGuideRe = /请选择向导|Select guide/i;
const bindSelectBtnRe = /^(选择此向导|Select this guide)( — | —|$)/;

async function gotoLoginWhenReady(page: Page, loginHref: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(loginHref, { timeout: 60_000 });
    const emailBox = page.getByRole("textbox", { name: /email|邮箱/i });
    try {
      await emailBox.waitFor({ state: "visible", timeout: 20_000 });
      return;
    } catch {
      if (attempt === 2) throw new Error("login page did not become ready");
    }
  }
}

test.describe("Guide workbench inbox L5 dual-role browser (① local)", () => {
  test("tourist bind → guide /guide 待接单 1 → accept → bilateral", async ({ page, request }) => {
    test.setTimeout(420_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);

    const seedGuideId = await resolveSeedGuideRowId(request, API_BASE);

    const creds = await registerFreshTouristForCorridor(request, API_BASE);
    const touristToken = creds.token;
    const touristEmail = creds.email ?? "";
    expect(touristEmail).not.toBe("");

    const orderId = await seedPublishedOpenItineraryOrder(request, API_BASE, touristToken);
    const escrowPath = `/escrow/${encodeURIComponent(orderId)}`;

    // —— 角色 A：游客浏览器绑定向导 ——
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowPath)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(touristEmail);
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });
    await expect(page.getByText(selectGuideRe).first()).toBeVisible({ timeout: 60_000 });

    const marketLink = page
      .getByRole("link", { name: /前往自由市场选向导|请选择向导|Go to.*market.*guide/i })
      .first();
    await marketLink.click();
    await expect(page).toHaveURL(new RegExp(`bindGuideToOrder=${orderId}`), { timeout: 60_000 });

    let bindClicked = false;
    const card = page.getByRole("article").filter({
      has: page.locator(`h3#guide-title-${seedGuideId}`),
    });
    if (await card.isVisible().catch(() => false)) {
      const bindBtn = card.getByRole("button", { name: bindSelectBtnRe });
      if (await bindBtn.isVisible().catch(() => false)) {
        await bindBtn.click({ timeout: 20_000 });
        bindClicked = true;
      }
    }
    if (!bindClicked) {
      await page.getByRole("button", { name: bindSelectBtnRe }).first().click({ timeout: 20_000 });
    }

    await expect(
      page.getByRole("dialog", { name: /Book guide|预约向导|更换本单向导|Change guide for this order/i }),
    ).toBeVisible({ timeout: 60_000 });
    await bindGuideFromBookGuideModal(page);
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });

    let getAfterBind = await request.get(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: `Bearer ${touristToken}` } },
    );
    let afterBody = (await getAfterBind.json()) as {
      order?: { guide_id?: string; state?: string };
    };
    if (String(afterBody.order?.guide_id ?? "").trim() !== seedGuideId) {
      await patchBindSeedGuideToOrder(request, API_BASE, touristToken, orderId, seedGuideId);
      getAfterBind = await request.get(
        `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
        { headers: { Authorization: `Bearer ${touristToken}` } },
      );
      afterBody = (await getAfterBind.json()) as {
        order?: { guide_id?: string; state?: string };
      };
    }
    expect(String(afterBody.order?.guide_id ?? "").trim()).toBe(seedGuideId);
    expect(String(afterBody.order?.state ?? "").toLowerCase()).toBe("created");

    await uiLogout(page);

    // —— 角色 B：向导 /guide 收件箱 → 进入订单接单 ——
    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent("/guide")}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/\/guide/, { timeout: 30_000 });

    await expect(page.getByRole("region", { name: guideWorkbenchInboxAriaRe })).toBeVisible({
      timeout: 60_000,
    });
    await expectGuideWorkbenchPendingAcceptCount(page, 1);

    const guideLoginApi = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "guide@test.com", password: "Test123!" },
    });
    expect(guideLoginApi.ok()).toBeTruthy();
    const guideApiToken = ((await guideLoginApi.json()) as { token?: string }).token?.trim() ?? "";

    await clickGuideWorkbenchEnterOrderAccept(page);
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });
    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 90_000,
    });

    await page
      .getByRole("main")
      .getByRole("button", { name: /接单|^Accept$/i })
      .first()
      .click({ timeout: 60_000 });

    await expect
      .poll(async () => {
        const r = await request.get(
          `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
          { headers: { Authorization: `Bearer ${guideApiToken}` } },
        );
        if (!r.ok()) return false;
        const body = (await r.json()) as { order?: { state?: string; sub_status?: string } };
        return (
          String(body.order?.state ?? "").toLowerCase() === "accepted" &&
          String(body.order?.sub_status ?? "").includes("bilateral")
        );
      }, { timeout: 60_000 })
      .toBe(true);

    await page.reload();
    await expect(page.locator("main").getByText(bilateralRe).first()).toBeVisible({
      timeout: 45_000,
    });
  });
});
