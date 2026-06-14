/**
 * Wave 4.1 · 走查数据合成（Wave 4 闭合后预期分布 · 用于契约与离线验证）
 * 浏览器 RUJR 证据优先；本模块为补充
 */
import type { PesAnalyticsEvent } from "./conversionAnalyticsLayer";
import type { PesJourneyRunRecord } from "./pesJourneyReviewAggregate";
import type { PesPersonaId } from "./pesJourneyReviewModel";

const WAVE3_ID = "product-enhancement-wave3-analytics-20260607" as const;

function ev(
  n: number,
  sessionId: string,
  touchpoint: PesAnalyticsEvent["touchpoint"],
  category: PesAnalyticsEvent["category"],
  stageId: PesAnalyticsEvent["stageId"],
  extra?: Partial<PesAnalyticsEvent>,
): PesAnalyticsEvent {
  return {
    id: `w41-${n}`,
    ts: Date.now(),
    wave3Id: WAVE3_ID,
    sessionId,
    touchpoint,
    category,
    stageId: stageId!,
    ...extra,
  };
}

/** Post-Wave4：更高注册/订单/发帖意向触达率 */
export function synthesizeWave41Runs(totalRuns = 50): PesJourneyRunRecord[] {
  const personas: PesPersonaId[] = ["traveler", "guide", "merchant", "govern"];
  const perPersona = Math.ceil(totalRuns / personas.length);
  const runs: PesJourneyRunRecord[] = [];
  let n = 0;

  for (const persona of personas) {
    for (let i = 0; i < perPersona && runs.length < totalRuns; i++) {
      n += 1;
      const sessionId = `w41-${persona}-${i}`;
      const events: PesAnalyticsEvent[] = [];
      events.push(ev(n, sessionId, "home", "touchpoint_view", "visit"));
      events.push(ev(n, sessionId, "home", "cta_click", "register", {
        ctaId: "pes4_role_bar_traveler",
        href: "/auth/register?pes_intent=register",
      }));
      events.push(ev(n, sessionId, "home", "registration_intent", "register", { href: "/auth/register" }));

      const depth = persona === "traveler" ? Math.min(6, 2 + (i % 5)) : Math.min(4, 1 + (i % 4));

      if (depth >= 2) {
        events.push(ev(n, sessionId, "merchant", "identity_intent", "identity", { href: "/me/identities" }));
      }
      if (depth >= 3) {
        events.push(ev(n, sessionId, "community", "touchpoint_view", "post"));
        events.push(ev(n, sessionId, "community", "cta_click", "post", {
          ctaId: "pes4_post_cta",
          href: "/community?publish=1",
        }));
      }
      if (depth >= 4) {
        events.push(ev(n, sessionId, "market", "touchpoint_view", "find_guide"));
        events.push(ev(n, sessionId, "market", "cta_click", "order", {
          ctaId: "pes4_market_orders_cta",
          href: "/auth/login?returnUrl=%2Forders&pes_intent=order",
        }));
        events.push(ev(n, sessionId, "market", "registration_intent", "order", { href: "/orders" }));
      }
      if (depth >= 5) {
        events.push(ev(n, sessionId, "market", "touchpoint_view", "order"));
      }

      runs.push({
        runId: `w41-run-${n}`,
        persona,
        runIndex: i,
        sessionId,
        steps: [
          { stepId: "home", route: "/", outcome: "ok", funnelStage: "visit" },
          {
            stepId: "role_bar",
            route: "/",
            outcome: "ok",
            funnelStage: "register",
          },
        ],
        events,
        frictionsObserved: [],
      });
    }
  }
  return runs.slice(0, totalRuns);
}
