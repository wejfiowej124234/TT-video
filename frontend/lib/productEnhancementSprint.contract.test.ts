import { describe, expect, it } from "vitest";
import {
  PES_SPRINT_ID,
  PES_TOUCHPOINT_ORDER,
  PES_UI,
  pesTouchpointI18nPrefix,
} from "./productEnhancementSprint";

describe("productEnhancementSprint", () => {
  it("exposes stable sprint id and six touchpoints", () => {
    expect(PES_SPRINT_ID).toBe("product-enhancement-sprint-20260607");
    expect(PES_TOUCHPOINT_ORDER).toEqual([
      "home",
      "market",
      "community",
      "guide",
      "merchant",
      "governance",
    ]);
  });

  it("loading band uses min 44px cta and motion-reduce", () => {
    expect(PES_UI.ctaPrimary).toContain("min-h-[44px]");
    expect(PES_UI.loadingPulse).toContain("motion-reduce:animate-none");
  });

  it("i18n prefix per touchpoint", () => {
    expect(pesTouchpointI18nPrefix("market")).toBe("pes_market");
  });
});
