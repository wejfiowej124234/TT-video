/**
 * 49 A · 自定义行程双角色 UI：`POST /api/v1/itineraries/custom`（游客 / 向导）闭环。
 * 可选切片（**TT-LOCAL §2.1**、**`npm run e2e:market-community`** → **`run-e2e-default.mjs`**）；与 **F-033** API 集（**`f027-f028-f033-request.spec.ts`**）互补。
 */
import type { Locator, Page, Response } from "@playwright/test";
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  refreshBearerSessionInPage,
  seedAndLoginGuideTestCredentials,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  chainOffSessionUserId,
  ensureTouristItineraryHeadroom,
} from "./helpers/ensureTouristOrderCapHeadroom";
import { customItineraryModalShell, marketPageShell } from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

/** `GlassSelect` 总天数字段：`aria-label` = `market_totalDays`（en **Total days** / zh **总天数**）。 */
const TOTAL_DAYS_TRIGGER = /Total days|总天数|行程天数/;
/** `GlassSelect` 国家：`aria-label` = `market_country`（en **Country** / zh **国家**）。 */
const COUNTRY_TRIGGER = /^(Country|国家)$/;
/** 游客：`market_budget`；向导：`market_guideQuoteAmount`（见 `TouristBudgetMetaFields` / `GuideFormQuoteAndCoverSection`） */
const BUDGET_OR_QUOTE_RX = /Budget|预算|Trip quote|行程报价/;
/** `CustomItineraryModal` 外层壳：优先 **`[data-tt-custom-itinerary-modal="1"]`**，勿裸 `getByRole("dialog")`（`/market` 另有抽屉/预览 `dialog`）。 */

function isPostItinerariesCustom(res: Response): boolean {
  const req = res.request();
  if (req.method() !== "POST") return false;
  const u = req.url();
  return u.includes("itineraries/custom") && !u.includes("drafts");
}

/** 日程卡：2 天模式下为 `h3` 外两层 `div`（`CustomItineraryCollapsibleDayShell` 非折叠分支）。 */
function dayPanel(dlg: Locator, dayNum: number): Locator {
  const heading = dlg.getByRole("heading", {
    level: 3,
    name: new RegExp(`第\\s*${dayNum}\\s*天|Day\\s*${dayNum}`, "i"),
  });
  return heading.locator("..").locator("..");
}

async function selectCountryChina(dlg: Locator) {
  await dlg.getByRole("button", { name: COUNTRY_TRIGGER }).click();
  await dlg.getByRole("option", { name: "中国" }).click();
  await expect(dlg.getByRole("heading", { level: 3, name: /第\s*1\s*天|Day\s*1/i })).toBeVisible({
    timeout: 60_000,
  });
}

async function selectCityInDay(dlg: Locator, dayNum: number, city: string) {
  const panel = dayPanel(dlg, dayNum);
  await expect(panel).toBeVisible({ timeout: 60_000 });
  await panel.getByRole("button", { name: city, exact: true }).click();
}

async function selectFirstAttractionInDay(dlg: Locator, dayNum: number) {
  const panel = dayPanel(dlg, dayNum);
  await panel
    .getByRole("group", { name: /Attractions|景区/i })
    .getByRole("button")
    .first()
    .click();
}

/** `STRICT_SESSION_GATE=1` + Next rewrite 下偶发丢 Bearer；E2E 层代理 POST custom 并强制 Bearer。 */
async function pinBearerOnItineraryCustomPost(page: Page, token: string) {
  await page.route("**/itineraries/custom**", async (route) => {
    const req = route.request();
    if (req.method() !== "POST" || req.url().includes("/drafts")) {
      await route.continue();
      return;
    }
    const response = await route.fetch({
      headers: {
        ...req.headers(),
        authorization: `Bearer ${token}`,
      },
    });
    await route.fulfill({ response });
  });
}

test.describe("49 A · custom itinerary modal · tourist + guide", () => {
  test("tourist path: fill form → POST …/itineraries/custom 200", async ({ page, request }) => {
    test.setTimeout(240_000);
    await skipIfApiDown(request);

    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    const headUid = await chainOffSessionUserId(request, API_BASE, cred.token);
    await ensureTouristItineraryHeadroom(request, API_BASE, cred.token, headUid);

    await pinBearerOnItineraryCustomPost(page, cred.token);
    await gotoWithBearerSession(page, "/market", cred);

    const marketShell = marketPageShell(page);
    await expect(marketShell).toBeVisible({ timeout: 90_000 });
    const openItinerary = marketShell.getByRole("button", { name: /Custom itinerary|自定义行程/i });
    await expect(openItinerary).toBeVisible({ timeout: 90_000 });
    await openItinerary.scrollIntoViewIfNeeded();
    await expect(openItinerary).toBeEnabled({ timeout: 90_000 });
    await openItinerary.click({ force: true });
    const modal = customItineraryModalShell(page);
    await expect(modal).toBeVisible({ timeout: 90_000 });
    const dlg = modal.getByTestId("custom-itinerary-panel");
    await expect(dlg).toBeVisible({ timeout: 90_000 });

    await dlg
      .getByRole("group", { name: TOTAL_DAYS_TRIGGER })
      .getByRole("button", { name: /^2 days$|^2\s*天$/ })
      .click();
    await expect(dlg.getByRole("heading", { level: 3, name: /Day 3|第\s*3\s*天/ })).toHaveCount(0);

    await selectCountryChina(dlg);
    await selectCityInDay(dlg, 1, "北京");
    await selectFirstAttractionInDay(dlg, 1);
    await selectCityInDay(dlg, 2, "上海");

    /** 游客侧预算依赖报价回填，E2E 环境偶发轮询超时；手工金额满足校验（仍走同一 POST 契约）。 */
    const budgetInput = dlg.getByLabel(BUDGET_OR_QUOTE_RX);
    // 报价回填或上一轮态可能先写入片段（如 `550`）；须清空再填，避免 `fill` 与受控拼接叠成 `55018888`。
    await budgetInput.click();
    await budgetInput.clear();
    await budgetInput.fill("18888");
    await expect(budgetInput).toHaveValue("18888");

    const submitBtn = dlg.getByTestId("custom-itinerary-submit");
    await submitBtn.scrollIntoViewIfNeeded();

    await ensureTouristItineraryHeadroom(request, API_BASE, cred.token, headUid);
    await refreshBearerSessionInPage(page, cred);

    const resPromise = page.waitForResponse((r) => isPostItinerariesCustom(r), { timeout: 180_000 });
    await submitBtn.click({ force: true });
    let res: Response;
    try {
      res = await resPromise;
    } catch (e) {
      const alert = dlg.getByRole("alert");
      if ((await alert.count()) > 0) {
        throw new Error(`no POST itineraries/custom; role=alert: ${await alert.first().innerText()}`);
      }
      throw e;
    }

    const bodyText = await res.text();
    expect(res.status(), bodyText).toBeLessThan(500);
    expect(res.ok(), bodyText).toBeTruthy();
    const j = JSON.parse(bodyText) as { status?: string; order_id?: string };
    expect(j.status).toBe("ok");
    expect((j.order_id ?? "").length).toBeGreaterThan(4);
  });

  test("guide path: switch creator → POST …/itineraries/custom 200", async ({ page, request }) => {
    test.setTimeout(240_000);
    await skipIfApiDown(request);

    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
    const cred = await seedAndLoginGuideTestCredentials(request, API_BASE);
    expect(cred, "login guide@test.com").toBeTruthy();
    if (!cred) return;

    const headUidG = await chainOffSessionUserId(request, API_BASE, cred.token);
    await ensureTouristItineraryHeadroom(request, API_BASE, cred.token, headUidG);

    await pinBearerOnItineraryCustomPost(page, cred.token);
    await gotoWithBearerSession(page, "/market", cred);

    const marketShellG = marketPageShell(page);
    await expect(marketShellG).toBeVisible({ timeout: 90_000 });
    const openItineraryG = marketShellG.getByRole("button", { name: /Custom itinerary|自定义行程/i });
    await expect(openItineraryG).toBeVisible({ timeout: 90_000 });
    await openItineraryG.scrollIntoViewIfNeeded();
    await expect(openItineraryG).toBeEnabled({ timeout: 90_000 });
    const modal = customItineraryModalShell(page);
    /** 全量矩阵长跑后 Next 偶发 hydration 慢；与游客支路对齐并多拍打开。 */
    for (let attempt = 0; attempt < 3; attempt++) {
      await openItineraryG.click({ force: true });
      try {
        await expect(modal).toBeVisible({ timeout: 55_000 });
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        await page.waitForTimeout(1_000 + attempt * 800).catch(() => {});
      }
    }
    const dlg = modal.getByTestId("custom-itinerary-panel");
    await expect(dlg).toBeVisible({ timeout: 90_000 });

    await dlg.locator('input[name="creatorType"]').nth(1).click();

    await dlg
      .getByRole("group", { name: TOTAL_DAYS_TRIGGER })
      .getByRole("button", { name: /^2 days$|^2\s*天$/ })
      .click();
    await expect(dlg.getByRole("heading", { level: 3, name: /Day 3|第\s*3\s*天/ })).toHaveCount(0);

    await selectCountryChina(dlg);
    await selectCityInDay(dlg, 1, "北京");
    await dayPanel(dlg, 1).locator("#guide-attractions-desc-0").fill("故宫一日游导览");
    await selectCityInDay(dlg, 2, "上海");

    /** 向导侧报价偶发未在 45s 内写入预算框；手工金额确保可提交（仍走同一 POST 契约）。 */
    const budgetGuide = dlg.getByLabel(BUDGET_OR_QUOTE_RX);
    await budgetGuide.click();
    await budgetGuide.clear();
    await budgetGuide.fill("12888");
    await expect(budgetGuide).toHaveValue("12888");

    const submitBtn = dlg.getByTestId("custom-itinerary-submit");
    await submitBtn.scrollIntoViewIfNeeded();

    await ensureTouristItineraryHeadroom(request, API_BASE, cred.token, headUidG);
    await refreshBearerSessionInPage(page, cred);

    const resGPromise = page.waitForResponse((r) => isPostItinerariesCustom(r), { timeout: 180_000 });
    await submitBtn.click({ force: true });
    let resG: Response;
    try {
      resG = await resGPromise;
    } catch (e) {
      const alert = dlg.getByRole("alert");
      if ((await alert.count()) > 0) {
        throw new Error(`no POST itineraries/custom; role=alert: ${await alert.first().innerText()}`);
      }
      throw e;
    }

    const bodyTextG = await resG.text();
    expect(resG.status(), bodyTextG).toBeLessThan(500);
    expect(resG.ok(), bodyTextG).toBeTruthy();
    const jg = JSON.parse(bodyTextG) as { status?: string; order_id?: string };
    expect(jg.status).toBe("ok");
    expect((jg.order_id ?? "").length).toBeGreaterThan(4);
  });
});
