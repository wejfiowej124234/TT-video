/**
 * PI-1 /traveltrust v6：等待 brief 与 Hero 就绪，降低入口闸与 below-fold 挂载 flake（①）。
 */
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { traveltrustNetworkPageShell } from "./pageShells";
import { gotoSmoke } from "./smoke-nav";

export async function waitTraveltrustV6Ready(page: Page, timeoutMs = 25_000): Promise<void> {
  const shell = traveltrustNetworkPageShell(page);
  await expect(shell).toHaveAttribute("data-tt-traveltrust-ia-version", "v6", { timeout: timeoutMs });
  await expect(shell).toHaveAttribute("data-tt-traveltrust-page-brief-ready", "1", { timeout: timeoutMs });
  await expect(shell.locator('[data-tt-traveltrust-hero-copy-card="1"]')).toBeVisible({ timeout: timeoutMs });
}

/** 桌面视口（≥lg）可见的 phase-1 roster（避免 mobile+desktop 双 nav strict 冲突） */
export function traveltrustDesktopPhase1Roster(shell: ReturnType<typeof traveltrustNetworkPageShell>): Locator {
  return shell.locator('[data-tt-traveltrust-phase1-region-roster-compact="1"]');
}

/** UNIFIED_PAGE_3D：letterbox / 2D copy-scrim 不挂载（TravelTrustCinematicHero · TravelTrustHeroFilmChrome） */
export async function expectTraveltrustUnifiedHeroChrome(shell: ReturnType<typeof traveltrustNetworkPageShell>) {
  await expect(shell).toHaveAttribute("data-tt-traveltrust-unified-3d", "1");
  await expect(shell.locator('[data-tt-traveltrust-hero-content-shell="1"]')).toBeAttached();
  await expect(shell.locator('[data-tt-traveltrust-hero-globe-viewport="1"]')).toBeVisible();
  await expect(shell.locator('[data-tt-traveltrust-hero-letterbox="top"]')).toHaveCount(0);
  await expect(shell.locator('[data-tt-traveltrust-hero-copy-scrim="1"]')).toHaveCount(0);
}

export async function scrollTraveltrustRolesStable(shell: ReturnType<typeof traveltrustNetworkPageShell>) {
  await scrollTraveltrustSectionStable(shell, "roles");
  await expect(shell.locator('[data-tt-traveltrust-theater-entered="1"]')).toBeAttached({ timeout: 20_000 });
}

export async function scrollTraveltrustSectionStable(
  shell: ReturnType<typeof traveltrustNetworkPageShell>,
  sectionId: string,
) {
  const el = shell.locator(`#${sectionId}`);
  await expect(el).toBeAttached({ timeout: 20_000 });
  await el.scrollIntoViewIfNeeded({ timeout: 20_000 });
  await el.evaluate((node) => {
    node.scrollIntoView({ block: "end", behavior: "instant" });
    window.scrollBy(0, 48);
  });
}

/**
 * P0：below-fold 时 narrative IO 离屏且 power.reason 进入省电分支；
 * `data-tt-traveltrust-page-cinematic-power` 仍可能为 active（heroT&lt;0.92 保帧）。
 */
export async function expectTraveltrustCanvasOffNarrativeViewport(
  page: Page,
  timeoutMs = 20_000,
): Promise<void> {
  const canvas = page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]');
  await expect(canvas).toHaveAttribute("data-tt-traveltrust-page-cinematic-inview", "0", { timeout: timeoutMs });
  await expect(canvas).toHaveAttribute("data-tt-traveltrust-page-cinematic-roles-inview", "0", {
    timeout: timeoutMs,
  });
  await expect(canvas).toHaveAttribute(
    "data-tt-traveltrust-page-cinematic-power-reason",
    /^(offscreen|past-narrative|scroll-fade)$/,
    { timeout: timeoutMs },
  );
}

export async function gotoTraveltrustV6(page: Page, path = "/traveltrust"): Promise<void> {
  await gotoSmoke(page, path);
  await waitTraveltrustV6Ready(page);
}
