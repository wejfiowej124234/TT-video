/**
 * P2FC Track E · staging cross-browser/mobile corridor (public pages only · no local webServer)
 */
import { test, expect } from "@playwright/test";
import { gotoSmoke } from "./helpers/smoke-nav";

test("P2FC · 首页可访问", async ({ page }) => {
  await gotoSmoke(page, "/");
  await expect(page.locator("body")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /发现|Discover|市场|Market|Community|社区/i }).first(),
  ).toBeVisible({ timeout: 45_000 });
});

test("P2FC · 社区 Feed 可访问", async ({ page }) => {
  await gotoSmoke(page, "/community");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible();
});

test("P2FC · 市场发现可访问", async ({ page }) => {
  await gotoSmoke(page, "/market");
  await expect(page.locator("body")).toBeVisible();
});
