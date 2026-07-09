import { describe, expect, it } from "vitest";
import {
  mergeTraveltrustAnnouncementsByLane,
  mergeTraveltrustPulseAnnouncements,
  isInternalCmsAnnouncementSlug,
} from "./traveltrustCmsAnnouncements";
import { TRAVELTRUST_PRODUCT_ANNOUNCEMENTS } from "./traveltrustAnnouncementCatalog";
import type { TravelTrustAnnouncementDisplay } from "./traveltrustCmsAnnouncements";

function cmsRow(id: string, lane: "product" | "governance" | "protocol_status"): TravelTrustAnnouncementDisplay {
  return {
    id,
    lane,
    kind: "product",
    contentTier: "upcoming",
    messageKey: `cms:${id}`,
    cmsSource: true,
    cmsCopy: {
      titleZh: id,
      titleEn: id,
      summaryZh: id,
      summaryEn: id,
    },
  };
}

describe("traveltrustCmsAnnouncements merge", () => {
  it("uses CMS-only product lane when CMS has rows (no static teaser stack)", () => {
    const merged = mergeTraveltrustAnnouncementsByLane(
      TRAVELTRUST_PRODUCT_ANNOUNCEMENTS,
      [cmsRow("cms-uat-product", "product")],
      "product",
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("cms-uat-product");
  });

  it("falls back to static catalog when CMS lane is empty", () => {
    const merged = mergeTraveltrustAnnouncementsByLane(
      TRAVELTRUST_PRODUCT_ANNOUNCEMENTS,
      [],
      "product",
    );
    expect(merged.length).toBe(TRAVELTRUST_PRODUCT_ANNOUNCEMENTS.length);
    expect(merged.some((i) => i.id === "product-planned-launch")).toBe(true);
    expect(merged.some((i) => i.id === "product-ttg-round-teaser")).toBe(false);
    expect(merged.some((i) => i.id === "product-region-expansion")).toBe(false);
  });

  it("uses CMS-only pulse when CMS pulse rows exist", () => {
    const staticPulse = TRAVELTRUST_PRODUCT_ANNOUNCEMENTS.slice(0, 3);
    const merged = mergeTraveltrustPulseAnnouncements(staticPulse, [cmsRow("cms-pulse-1", "product")], 6);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("cms-pulse-1");
  });

  it("flags internal UAT and demo slugs", () => {
    expect(isInternalCmsAnnouncementSlug("cms-ops-demo-launch")).toBe(true);
    expect(isInternalCmsAnnouncementSlug("cms-uat-123")).toBe(true);
    expect(isInternalCmsAnnouncementSlug("product-planned-launch")).toBe(false);
  });
});
