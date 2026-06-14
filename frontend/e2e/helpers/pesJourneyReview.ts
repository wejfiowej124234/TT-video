import type { Page } from "@playwright/test";
import type { PesAnalyticsEvent } from "../../lib/conversionAnalyticsLayer";
import {
  PES_ANALYTICS_STORAGE_KEY,
  PES_ANALYTICS_SESSION_KEY,
} from "../../lib/conversionAnalyticsLayer";
import {
  getPersonaJourney,
  type PesPersonaId,
} from "../../lib/pesJourneyReviewModel";
import type {
  JourneyStepOutcome,
  PesJourneyRunRecord,
  PesJourneyStepResult,
} from "../../lib/pesJourneyReviewAggregate";

const PES_STORAGE_KEY = PES_ANALYTICS_STORAGE_KEY;
const PES_SESSION_KEY = PES_ANALYTICS_SESSION_KEY;

export async function clearPesAnalyticsStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem("tt_pes_conversion_analytics_v1");
    localStorage.removeItem("tt_pes_ab_assignments_v1");
    sessionStorage.removeItem("tt_pes_analytics_session_v1");
  });
}

async function readPesEvents(page: Page): Promise<PesAnalyticsEvent[]> {
  return page.evaluate((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as PesAnalyticsEvent[]) : [];
    } catch {
      return [];
    }
  }, PES_STORAGE_KEY);
}

async function readSessionId(page: Page): Promise<string> {
  return page.evaluate((key) => sessionStorage.getItem(key) ?? "unknown", PES_SESSION_KEY);
}

async function probeWave4Closure(page: Page, route: string): Promise<boolean> {
  if (route === "/" || route === "") {
    return page.locator('[data-tt-pes-role-bar="persistent"]').isVisible({ timeout: 5_000 }).catch(() => false);
  }
  if (route.startsWith("/market")) {
    return page.locator('[data-tt-pes-market-order-closure="1"]').isVisible({ timeout: 5_000 }).catch(() => false);
  }
  if (route.startsWith("/community")) {
    return page.locator('[data-tt-pes-identity-post-closure="1"]').isVisible({ timeout: 5_000 }).catch(() => false);
  }
  return true;
}

async function detectLoginGate(page: Page): Promise<boolean> {
  const loginGate = page
    .getByRole("alert")
    .filter({ hasText: /登录|log in|sign in|请先登录/i })
    .first();
  const loginLink = page.getByRole("link", { name: /登录|log in|sign in/i }).first();
  return (await loginGate.isVisible().catch(() => false)) || (await loginLink.isVisible().catch(() => false));
}

export async function runPesPersonaJourney(
  page: Page,
  persona: PesPersonaId,
  runIndex: number,
): Promise<PesJourneyRunRecord> {
  const journey = getPersonaJourney(persona);
  const steps: PesJourneyStepResult[] = [];

  for (const step of journey.steps) {
    let outcome: JourneyStepOutcome = "ok";
    try {
      await page.goto(step.route, { waitUntil: "domcontentloaded", timeout: 25_000 });
      await page.waitForTimeout(250);

      if (await detectLoginGate(page)) {
        outcome = "login_gate";
      } else if (step.pesProbe) {
        const roleBar = page.locator('[data-tt-pes-role-bar="persistent"]');
        const roleGrid = page.locator('[data-tt-pes-role-grid="1"]');
        const funnelRail = page.locator("[data-tt-pes-funnel-rail]").first();
        const marketClosure = page.locator('[data-tt-pes-market-order-closure="1"]');
        const identityClosure = page.locator('[data-tt-pes-identity-post-closure="1"]');
        const probes = [roleBar, roleGrid, funnelRail, marketClosure, identityClosure];
        let visible = false;
        for (const p of probes) {
          if (await p.isVisible({ timeout: 4_000 }).catch(() => false)) {
            visible = true;
            break;
          }
        }
        if (!visible) outcome = "element_missing";
      }

      if (outcome === "ok") {
        const w4 = await probeWave4Closure(page, step.route);
        if (!w4 && (step.route === "/" || step.route.startsWith("/market") || step.route.startsWith("/community"))) {
          outcome = "element_missing";
        }
      }

      if (step.clickRole && outcome === "ok") {
        const roleLink = page.locator('[data-tt-pes-role-grid="1"] a').first();
        if (await roleLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await roleLink.click({ timeout: 5_000 }).catch(() => undefined);
          await page.waitForTimeout(300);
        }
      }

      if (step.clickFunnelNext && outcome === "ok") {
        const nextCta = page.locator('[data-tt-pes-funnel-rail] a').last();
        if (await nextCta.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await nextCta.click({ timeout: 5_000 }).catch(() => undefined);
        }
      }
    } catch {
      outcome = "timeout";
    }

    steps.push({
      stepId: step.id,
      route: step.route,
      outcome,
      funnelStage: step.funnelStage,
    });
  }

  const events = await readPesEvents(page);
  const sessionId = await readSessionId(page);

  return {
    runId: `rujr-${persona}-${runIndex}-${Date.now()}`,
    persona,
    runIndex,
    sessionId,
    steps,
    events,
    frictionsObserved: [],
  };
}
