import { describe, expect, it } from "vitest";
import {
  CONVERSION_FUNNEL_BREAKPOINTS,
  CONVERSION_FUNNEL_STAGES,
  PES_WAVE2_ID,
  ROLE_ENTRY_LINKS,
  TOUCHPOINT_FUNNEL_STAGE,
  getFunnelStage,
  getFunnelStageIndex,
  getNextFunnelStage,
  resolveFunnelNextStep,
} from "./conversionFunnelModel";
import { PES_TOUCHPOINT_ORDER } from "./productEnhancementSprint";

describe("conversionFunnelModel", () => {
  it("exposes stable wave2 id and seven funnel stages", () => {
    expect(PES_WAVE2_ID).toBe("product-enhancement-wave2-funnel-20260607");
    expect(CONVERSION_FUNNEL_STAGES.map((s) => s.id)).toEqual([
      "visit",
      "register",
      "identity",
      "post",
      "find_guide",
      "order",
      "govern",
    ]);
  });

  it("maps all six touchpoints to a funnel stage", () => {
    for (const tp of PES_TOUCHPOINT_ORDER) {
      expect(TOUCHPOINT_FUNNEL_STAGE[tp]).toBeTruthy();
      expect(getFunnelStageIndex(TOUCHPOINT_FUNNEL_STAGE[tp])).toBeGreaterThanOrEqual(0);
    }
  });

  it("advances funnel stages with href + next CTA keys", () => {
    const visit = getFunnelStage("visit");
    const next = getNextFunnelStage("visit");
    expect(next?.id).toBe("register");
    expect(visit.href).toBe("/");
    expect(next?.href).toBe("/auth/register");
    expect(getNextFunnelStage("govern")).toBeNull();
  });

  it("resolveFunnelNextStep uses current stage CTA key, not next stage (PES CTA bugfix)", () => {
    const step = resolveFunnelNextStep("find_guide");
    expect(step).toEqual({ href: "/orders", ctaKey: "pes2_funnel_next_order" });
    expect(step?.ctaKey).not.toBe("pes2_funnel_next_govern");

    const fromVisit = resolveFunnelNextStep("visit");
    expect(fromVisit).toEqual({ href: "/auth/register", ctaKey: "pes2_funnel_next_register" });

    const fromOrder = resolveFunnelNextStep("order");
    expect(fromOrder).toEqual({ href: "/governance", ctaKey: "pes2_funnel_next_govern" });

    expect(resolveFunnelNextStep("govern")).toBeNull();
  });

  it("market touchpoint at find_guide shows travel-booking CTA, not governance", () => {
    const step = resolveFunnelNextStep("find_guide", "market");
    expect(step).toEqual({
      href: "/orders",
      ctaKey: "pes2_funnel_next_market_travel",
    });
    expect(step?.ctaKey).not.toContain("govern");
  });

  it("registers eight breakpoints with i18n keys", () => {
    expect(CONVERSION_FUNNEL_BREAKPOINTS).toHaveLength(8);
    for (const bp of CONVERSION_FUNNEL_BREAKPOINTS) {
      expect(bp.issueKey).toMatch(/^pes2_bp\d{2}_issue$/);
      expect(bp.wave2MitigationKey).toMatch(/^pes2_bp\d{2}_fix$/);
    }
  });

  it("exposes four role entry links with 44px-friendly routes", () => {
    expect(ROLE_ENTRY_LINKS).toHaveLength(4);
    expect(ROLE_ENTRY_LINKS.map((r) => r.id)).toEqual(["traveler", "guide", "merchant", "govern"]);
    for (const role of ROLE_ENTRY_LINKS) {
      expect(role.href.startsWith("/")).toBe(true);
      expect(role.labelKey.startsWith("pes2_role_")).toBe(true);
    }
  });
});
