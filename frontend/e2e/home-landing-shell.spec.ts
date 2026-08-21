/**
 * `/plan` AI 行程规划 · ① 壳层（原 `/` 表单迁此）
 * 取代未接线的 `home-landing-marketing-v2` / `home-landing-api-preflight` v2 契约用例。
 */
import { test, expect } from "@playwright/test";

import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

test.describe("PI-1 · home landing shell", () => {
  test("hero form, network CTA, and warm Action submit (§1.7)", async ({ page }) => {
    await gotoSmoke(page, "/plan");
    const main = page.locator("main[aria-label]");
    await expect(main).toBeVisible({ timeout: 20_000 });

    const form = page.locator("#landing-hero-form");
    await expect(form).toBeVisible();
    await expect(page.locator("#form")).toBeVisible();

    const network = main.getByRole("link", { name: /了解 TravelTrust 网络|TravelTrust network/i });
    await expect(network).toBeVisible({ timeout: 15_000 });
    const networkClass = (await network.getAttribute("class")) ?? "";
    expect(networkClass).toMatch(/from-\[#e8c96a\]|ref-sun/);
    expect(networkClass).not.toMatch(/bg-cta-gradient/);

    const submit = form.locator('button[type="submit"]');
    await expect(submit).toBeVisible();
    const submitClass = (await submit.getAttribute("class")) ?? "";
    expect(submitClass).toMatch(/from-\[#e8c96a\]|ref-sun/);
    expect(submitClass).not.toMatch(/bg-cta-gradient/);
  });

  test("submit FAB mostly in viewport on 375×812 after scroll", async ({ page, request }) => {
    await skipIfApiDown(request);
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoSmoke(page, "/plan");
    const submit = page.locator("#landing-hero-form button[type='submit']");
    await expect(submit).toBeVisible();
    await submit.scrollIntoViewIfNeeded();
    const box = await submit.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.y).toBeLessThan(812);
      expect(box.y + box.height).toBeLessThanOrEqual(812 + 120);
    }
  });

  test("ambient backdrop stable TS src on first paint (W1 · flag=0 default)", async ({ page }) => {
    await gotoSmoke(page, "/plan");
    const backdrop = page.locator('[data-tt-home-ambient-phase="A"]');
    await expect(backdrop).toBeVisible({ timeout: 20_000 });
    const src = await backdrop.getAttribute("data-tt-home-ambient-src");
    expect(src).toMatch(/^https:\/\//);
    await expect(page.locator("#landing-hero-form")).toBeVisible();
  });

  test("hero country pills visible from TS geo (W2 · flag=0 default)", async ({ page }) => {
    await gotoSmoke(page, "/plan");
    const form = page.locator("#landing-hero-form");
    await expect(form).toBeVisible({ timeout: 20_000 });
    const chinaPill = form.getByRole("button", { name: "中国" });
    await expect(chinaPill).toBeVisible();
    await chinaPill.click();
    await expect(page.getByTestId("landing-cities-input")).toBeEnabled();
    await expect(form.getByRole("button", { name: "北京" })).toBeVisible({ timeout: 10_000 });
  });
});
