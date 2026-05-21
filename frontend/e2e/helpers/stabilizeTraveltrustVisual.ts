/**
 * TT-PH1-182 · 视觉回归截图前稳定化（①）
 * 遮罩全页 WebGL 层，避免线框地球帧间像素差导致假红。
 */
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { traveltrustNetworkPageShell } from "./pageShells";

const LOW_PREFS_KEY = "tt-traveltrust-cinematic-low-prefs";
const LOW_KEY = "tt-traveltrust-cinematic-low";

/** 在首次导航前注入：低画质 + 与 reduced-motion 一致。 */
export async function installTraveltrustVisualStability(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    ([prefsKey, lowKey]) => {
      sessionStorage.setItem(prefsKey, "on");
      sessionStorage.setItem(lowKey, "1");
    },
    [LOW_PREFS_KEY, LOW_KEY] as const,
  );
}

export function traveltrustCinematicScreenshotMask(page: Page): Locator[] {
  return [page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]')];
}

export async function waitTraveltrustHeroSettled(page: Page, timeoutMs = 20_000): Promise<void> {
  const shell = traveltrustNetworkPageShell(page);
  await expect(shell).toHaveAttribute("data-tt-traveltrust-ia-version", "v6", { timeout: timeoutMs });
  await expect(shell.locator('[data-tt-traveltrust-hero-copy-card="1"]')).toBeVisible({ timeout: timeoutMs });
  await page.waitForTimeout(500);
}
