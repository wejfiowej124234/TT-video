import { describe, expect, it } from "vitest";
import {
  TT_PAGE_SPACING_AUDIT_L5,
  auditTraveltrustSectionGapPx,
  runTraveltrustVerticalRhythmTokenAudit,
  tailwindSpacingToPx,
} from "./traveltrustPageSpacingAuditL5";

describe("traveltrustPageSpacingAuditL5", () => {
  it("defines L5 section gap bands for narrative pairs", () => {
    expect(TT_PAGE_SPACING_AUDIT_L5.sectionGapTargetsPx["liquidity→trust"].ideal).toBe(44);
    expect(TT_PAGE_SPACING_AUDIT_L5.maxFilmDividersOnPage).toBe(2);
  });

  it("auditTraveltrustSectionGapPx passes in-band measurements", () => {
    expect(auditTraveltrustSectionGapPx("faq→start", 64).ok).toBe(true);
    expect(auditTraveltrustSectionGapPx("faq→start", 40).status).toBe("tight");
  });

  it("runTraveltrustVerticalRhythmTokenAudit passes for SSOT tokens", () => {
    expect(runTraveltrustVerticalRhythmTokenAudit().ok).toBe(true);
  });

  it("tailwindSpacingToPx maps gap-8 to 32px", () => {
    expect(tailwindSpacingToPx("gap-x-8 sm:gap-x-10")).toBe(32);
  });
});
