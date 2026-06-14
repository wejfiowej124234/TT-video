import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const loadedPath = join(process.cwd(), "app/guides/[id]/GuideDetailPageLoaded.tsx");
const pagePath = join(process.cwd(), "app/guides/[id]/page.tsx");
const drawerPath = join(process.cwd(), "components/market/GuideDetailDrawer.tsx");

describe("Guide detail page L5 consumer profile", () => {
  const loaded = readFileSync(loadedPath, "utf8");
  const page = readFileSync(pagePath, "utf8");
  const drawer = readFileSync(drawerPath, "utf8");

  it("route page delegates to GuideDetailPageMain (not legacy inline UI)", () => {
    expect(page).toContain("GuideDetailPageMain");
    expect(page).toContain("GuideDetailRouteSuspense");
    expect(page).not.toContain("GuideDetailCredentialCard");
    expect(page).not.toContain("guideDetail_credentials");
    expect(page).not.toContain("guideDetail_realName");
  });

  it("uses warm market tokens not cyan/green cyberpunk drift", () => {
    expect(loaded).toContain("MarketAmbientBackdrop");
    expect(loaded).toContain("GUIDE_DETAIL_PANEL_FRAME_CLASS");
    expect(loaded).toContain("TT_MARKETING_MARKET_DARK_PATH");
    expect(loaded).not.toMatch(/text-cyan-/);
    expect(loaded).not.toMatch(/border-success/);
    expect(loaded).not.toContain("GuideDetailCredentialCard");
    expect(loaded).not.toContain("guideDetail_realName");
    expect(loaded).not.toContain("guideDetail_passportNumber");
  });

  it("filters public copy and formats specialty/languages SSOT", () => {
    expect(loaded).toContain("formatGuidePublicBio");
    expect(loaded).toContain("filterGuidePublicServiceTypes");
    expect(loaded).toContain("formatGuideServiceTypeLabel");
    expect(loaded).toContain("formatGuideLanguages");
    expect(loaded).not.toContain("guide_detail_specialty_hint");
    expect(drawer).toContain("filterGuidePublicServiceTypes");
    expect(drawer).toContain("formatGuideLanguages");
    expect(drawer).not.toContain("guide_detail_specialty_hint");
  });

  it("hides guide-only stake from default consumer view", () => {
    expect(loaded).toContain("useViewerUserId");
    expect(loaded).toContain("isOwnGuideProfile");
  });

  it("surfaces traveler conversion probe and primary book CTA", () => {
    expect(loaded).toContain('data-tt-traveler-conversion="guide-detail"');
    expect(loaded).toContain("guide_detail_conversion_next");
    expect(loaded).toContain("guide_detail_conversion_trip_ready");
    expect(loaded).toContain("data-tt-guide-detail-book-cta");
    expect(loaded).toContain("market_hero_title");
    expect(loaded).not.toContain('t("market_meta_title")');
  });

  it("GuideDetailDrawer preserves bindGuideToOrder on view-page link", () => {
    expect(drawer).toContain("guideDetailHrefForBind");
    expect(drawer).toContain("bindGuideToOrderId");
  });

  it("uses unified profile card not stacked independent panels", () => {
    expect(loaded).toContain("GUIDE_DETAIL_INNER_DIVIDER_CLASS");
    expect(loaded).toContain("GUIDE_DETAIL_PANEL_FRAME_CLASS");
    expect(loaded).toContain("GUIDE_DETAIL_SECTION_LABEL_CLASS");
    expect(loaded).not.toContain("drawerSectionAccent");
  });

  it("registers L5 closure consumer-grade freeze probes", () => {
    expect(loaded).toContain("GUIDE_DETAIL_L5_CLOSURE_PROBE");
    expect(loaded).toContain("data-tt-guide-detail-decision");
  });
});
