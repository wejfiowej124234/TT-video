import type { Page } from "@playwright/test";
import type { PesAnalyticsEvent } from "../../lib/conversionAnalyticsLayer";
import {
  PES_ANALYTICS_AB_ASSIGN_KEY,
  PES_ANALYTICS_STORAGE_KEY,
  PES_ANALYTICS_SESSION_KEY,
} from "../../lib/conversionAnalyticsLayer";
import type { PesPersonaId } from "../../lib/pesJourneyReviewModel";
import type {
  JourneyStepOutcome,
  PesJourneyRunRecord,
  PesJourneyStepResult,
} from "../../lib/pesJourneyReviewAggregate";

/** Wave 4.1 轻量走查（曝光 Wave 4 闭合组件 · 无 Auth 导航） */
export const WAVE41_ROUTES: Record<PesPersonaId, readonly string[]> = {
  traveler: ["/", "/market", "/community"],
  guide: ["/", "/market", "/guide"],
  merchant: ["/provider/register", "/community"],
  govern: ["/governance", "/governance/proposals"],
};

async function readPesEvents(page: Page): Promise<PesAnalyticsEvent[]> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await page.evaluate((key) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return [];
          const parsed = JSON.parse(raw) as unknown;
          return Array.isArray(parsed) ? (parsed as PesAnalyticsEvent[]) : [];
        } catch {
          return [];
        }
      }, PES_ANALYTICS_STORAGE_KEY);
    } catch (e) {
      const msg = String(e);
      if (attempt === 3 || !msg.includes("Execution context was destroyed")) throw e;
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
      await page.waitForTimeout(400 * (attempt + 1));
    }
  }
  return [];
}

async function readSessionId(page: Page): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await page.evaluate(
        (key) => sessionStorage.getItem(key) ?? "unknown",
        PES_ANALYTICS_SESSION_KEY,
      );
    } catch (e) {
      const msg = String(e);
      if (attempt === 3 || !msg.includes("Execution context was destroyed")) throw e;
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
      await page.waitForTimeout(400 * (attempt + 1));
    }
  }
  return "unknown";
}

/** 须在应用源页面调用（非 about:blank）；每轮走查开始前清空一次 */
export async function clearPesAnalyticsStorage(page: Page): Promise<void> {
  await page.evaluate(
    (keys) => {
      localStorage.removeItem(keys.storage);
      localStorage.removeItem(keys.ab);
      sessionStorage.removeItem(keys.session);
    },
    {
      storage: PES_ANALYTICS_STORAGE_KEY,
      ab: PES_ANALYTICS_AB_ASSIGN_KEY,
      session: PES_ANALYTICS_SESSION_KEY,
    },
  );
}

async function probeWave4(page: Page, route: string): Promise<boolean> {
  if (route === "/") {
    return page.locator('[data-tt-pes-role-bar="persistent"]').isVisible({ timeout: 8_000 }).catch(() => false);
  }
  if (route.startsWith("/market")) {
    return page.locator('[data-tt-pes-market-order-closure="1"]').isVisible({ timeout: 8_000 }).catch(() => false);
  }
  if (route.startsWith("/community")) {
    return page.locator('[data-tt-pes-identity-post-closure="1"]').isVisible({ timeout: 8_000 }).catch(() => false);
  }
  return true;
}

async function waitForPesHydration(page: Page): Promise<void> {
  await page
    .locator(
      "[data-tt-pes-role-bar], [data-tt-pes-market-order-closure], [data-tt-pes-identity-post-closure], [data-tt-pes-funnel-rail]",
    )
    .first()
    .waitFor({ state: "visible", timeout: 18_000 })
    .catch(() => undefined);
  await page.waitForTimeout(900);
}

export async function runPesWave41Journey(
  page: Page,
  persona: PesPersonaId,
  runIndex: number,
): Promise<PesJourneyRunRecord> {
  const routes = WAVE41_ROUTES[persona];
  const steps: PesJourneyStepResult[] = [];

  for (const route of routes) {
    let outcome: JourneyStepOutcome = "ok";
    try {
      await page.goto(route, { waitUntil: "load", timeout: 45_000 });
      await waitForPesHydration(page);
      const w4ok = await probeWave4(page, route);
      if (!w4ok && (route === "/" || route.startsWith("/market") || route.startsWith("/community"))) {
        outcome = "element_missing";
      }
    } catch {
      outcome = "timeout";
    }
    steps.push({ stepId: `w41-${persona}-${route}`, route, outcome });
  }

  const events = await readPesEvents(page);

  return {
    runId: `w41-${persona}-${runIndex}-${Date.now()}`,
    persona,
    runIndex,
    sessionId: await readSessionId(page),
    steps,
    events,
    frictionsObserved: steps.some((s) => s.outcome === "element_missing") ? ["FR-01"] : [],
  };
}
