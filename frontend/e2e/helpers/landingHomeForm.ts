import { expect, type Page } from "@playwright/test";

/** 选国家 + 城市（`LandingHeroCityField` 文本框 + 药丸 SSOT） */
export async function fillLandingHeroChinaCities(page: Page, cities: string[]) {
  const form = page.locator("#landing-hero-form");
  await expect(form).toBeVisible({ timeout: 20_000 });
  await form.getByRole("button", { name: /中国|China/i }).click();
  const cityInput = form.getByTestId("landing-cities-input");
  await expect(cityInput).toBeEnabled({ timeout: 15_000 });
  await cityInput.fill(cities.join("、"));
}

/** 首页 Hero 表单：选中国 + 北京 */
export async function fillLandingHeroChinaBeijing(page: Page) {
  await fillLandingHeroChinaCities(page, ["北京"]);
}

/** 多城（与 `landing_cities_placeholder` 分隔符一致） */
export async function fillLandingHeroChinaMultiCity(page: Page, cities: string[]) {
  await fillLandingHeroChinaCities(page, cities);
}

export async function fillLandingHeroBudget(page: Page, amount: string) {
  const form = page.locator("#landing-hero-form");
  const budgetInput = form.getByRole("textbox", { name: /预算|Budget/i });
  await expect(budgetInput).toBeVisible({ timeout: 15_000 });
  await budgetInput.fill(amount);
}

export async function submitLandingHeroForm(page: Page) {
  await page.locator("#landing-hero-form button[type='submit']").click();
}

/** 避免 localStorage / 旧 sessionStorage 残留导致 E2E 误判已解锁 / 旧卡 */
export async function clearLandingItinerarySession(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("tt_landing_result_order_ids_v1");
    localStorage.removeItem("tt_landing_unlocked_order_ids_v1");
    localStorage.removeItem("tt_landing_favorite_order_ids_v1");
    sessionStorage.removeItem("tt_landing_result_order_ids_v1");
    sessionStorage.removeItem("tt_landing_unlocked_order_ids_v1");
  });
}
