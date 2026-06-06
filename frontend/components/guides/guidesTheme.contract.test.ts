import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TT_MARKETING_GUIDES_ATMOSPHERE } from "@/lib/marketingUi";

const CONSTANTS = join(
  process.cwd(),
  "app",
  "guides",
  "[id]",
  "guideDetailPageConstants.ts",
);

describe("guides atmosphere theme (bridge · TT-PH1-216 · ①)", () => {
  it("marketingUi guides tokens are warm-primary", () => {
    expect(TT_MARKETING_GUIDES_ATMOSPHERE.panel).toContain("border-ref-sun/");
    expect(TT_MARKETING_GUIDES_ATMOSPHERE.panel).not.toContain("cyan");
    expect(TT_MARKETING_GUIDES_ATMOSPHERE.primaryCtaBlock).toContain("from-[#e8c96a]");
    expect(TT_MARKETING_GUIDES_ATMOSPHERE.retryPill).toContain("from-[#e8c96a]");
  });

  it("guideDetailPageConstants re-exports warm panel", () => {
    const src = readFileSync(CONSTANTS, "utf8");
    expect(src).toContain("TT_MARKETING_GUIDES_ATMOSPHERE");
    expect(src).not.toMatch(/border-cyan-500\/30/);
  });

  it("guides route sources keep cyan only on inline links (88)", () => {
    const page = readFileSync(join(process.cwd(), "app", "guides", "[id]", "page.tsx"), "utf8");
    expect(page).not.toMatch(/border-cyan-/);
    expect(page).not.toMatch(/bg-cyan-/);
    expect(page).toMatch(/text-cyan-300/);
  });
});
