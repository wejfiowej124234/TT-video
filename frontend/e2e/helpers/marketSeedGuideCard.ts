/**
 * 市场 E2E：种子向导卡片与 **`GET /api/v1/guides`** 对齐（仅 **`status=active`** 入目录；与 chain_off **`guides_list_impl`** 一致）。
 * 使用 **`/market?view=guides`** 清掉地址栏里可能残留的 **country/city/language** 筛选，避免 **`guide@test`**（杭州）被客户端 `matchGuide` 滤掉。
 */
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

import { requestGetWith429Retry } from "./playwright429Backoff";
import { marketPageShell } from "./pageShells";
import { gotoSmoke } from "./smoke-nav";

export async function assertSeedGuideInPublicGuidesCatalog(
  request: APIRequestContext,
  apiBase: string,
  guideId: string,
): Promise<void> {
  const res = await requestGetWith429Retry(request, `${apiBase}/api/v1/guides`, {});
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { items?: { id?: string }[] };
  const ids = (body.items ?? []).map((x) => String(x.id ?? "").trim()).filter(Boolean);
  expect(
    ids.includes(guideId),
    `guide@test must appear in GET /api/v1/guides (got ${ids.length} items). Non-active guides are omitted from the market list; fix seed / DB state.`,
  ).toBeTruthy();
}

/** 在 **`main[data-tt-market-page]`** 内定位种子向导 **`article`**（与顶栏 Header 无关）。 */
export async function marketGuidesTabSeedGuideArticle(page: Page, guideId: string): Promise<Locator> {
  await gotoSmoke(page, "/market?view=guides", { timeout: 90_000 });
  const marketShell = marketPageShell(page);
  await expect(marketShell).toBeVisible({ timeout: 90_000 });
  await marketShell.getByRole("tab", { name: /^Guides$|^向导$/ }).click();
  const title = marketShell.locator(`h3#guide-title-${guideId}`);
  await expect(title).toBeVisible({ timeout: 90_000 });
  await title.scrollIntoViewIfNeeded();
  const card = marketShell.locator(`article:has(#guide-title-${guideId})`);
  await expect(card).toBeVisible({ timeout: 90_000 });
  return card;
}
