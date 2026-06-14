import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveFunnelNextStep } from "@/lib/conversionFunnelModel";

const railSrc = readFileSync(
  join(import.meta.dirname, "ConversionFunnelRail.tsx"),
  "utf8"
);

describe("ConversionFunnelRail (contract · PES CTA bugfix)", () => {
  it("binds next CTA via resolveFunnelNextStep, not next.nextCtaKey", () => {
    expect(railSrc).toContain("resolveFunnelNextStep");
    expect(railSrc).not.toMatch(/next\.nextCtaKey/);
    expect(railSrc).toContain('data-tt-pes-funnel-next-cta="1"');
    expect(railSrc).toContain("data-tt-pes-funnel-next-key={nextStep.ctaKey}");
  });

  it("market find_guide step never resolves to governance CTA key", () => {
    const step = resolveFunnelNextStep("find_guide", "market");
    expect(step?.ctaKey).toBe("pes2_funnel_next_market_travel");
    expect(step?.ctaKey).not.toBe("pes2_funnel_next_govern");
    expect(step?.href).toBe("/orders");
  });
});
