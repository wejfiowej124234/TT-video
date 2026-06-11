/**
 * D7 · G4 · BookGuide / CustomItinerary / Invite / Showcase 弹窗暖金机读
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("market modals G4 (site theme V1 · D7)", () => {
  it("BookGuideModal uses glassModal warm panel and primary CTA", () => {
    const src = read("BookGuideModal.tsx");
    expect(src).toContain("glassModalPanel");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY");
    expect(src).not.toContain("bg-cta-gradient");
    expect(src).not.toContain("ref-cyan");
  });

  it("CustomItineraryModal uses centered glass modal like acquisition studio", () => {
    const src = read("CustomItineraryModal/index.tsx");
    expect(src).toContain("MarketGlassModalFrame");
    expect(src).toContain("data-tt-custom-itinerary-modal");
    expect(src).toContain("customItineraryPillSelected");
    expect(src).toContain("studioModalHeader");
    expect(src).not.toContain("MarketDetailDrawerFrame");
    expect(src).not.toContain("bg-cta-gradient");
  });

  it("InviteGuideModal uses MarketGlassModalFrame and warm studio tokens", () => {
    const src = read("InviteGuideModal.tsx");
    expect(src).toContain("MarketGlassModalFrame");
    expect(src).toContain("invite-guide-modal");
    expect(src).toContain("studioCloseBtn");
    expect(src).not.toContain("bg-bg-console");
    expect(src).not.toContain("text-travel-600");
    expect(src).not.toContain("bg-cta-gradient");
  });

  it("MerchantShowcaseStudioModal uses warm studio tokens", () => {
    const src = read("MerchantShowcaseStudioModal.tsx");
    expect(src).toContain("studioSectionHeading");
    expect(src).not.toContain("border-ref-cyan");
    expect(src).not.toContain("bg-cta-gradient");
  });

  it("market detail drawer classes use warm drawer focus", () => {
    const src = read("marketDetailDrawerClasses.ts");
    expect(src).toContain("drawerControlFocus");
    expect(src).not.toContain("focus-visible:ring-cyan-400");
  });
});
