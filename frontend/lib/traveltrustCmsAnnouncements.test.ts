import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchTraveltrustCmsAnnouncements,
  mergeTraveltrustAnnouncementsByLane,
  mergeTraveltrustPulseAnnouncements,
  isInternalCmsAnnouncementSlug,
  TRAVELTRUST_OFFICIAL_WWW_ORIGIN,
} from "./traveltrustCmsAnnouncements";
import { invalidateCmsAnnouncementsCache } from "./cmsAnnouncementsSharedCache";
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
  afterEach(() => {
    invalidateCmsAnnouncementsCache();
    vi.unstubAllGlobals();
  });
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
    expect(merged.some((i) => i.id === "product-ttg-v8-25t")).toBe(true);
    expect(merged.some((i) => i.id === "campaign-referral")).toBe(true);
    expect(merged.some((i) => i.id === "product-role-steward")).toBe(true);
    expect(merged.some((i) => i.id === "product-ttg-round-teaser")).toBe(false);
    expect(merged.some((i) => i.id === "product-region-expansion")).toBe(false);
    const ttg = merged.find((i) => i.id === "product-ttg-v8-25t");
    expect(ttg?.cmsCopy?.titleZh).toBe("TTG 已按 25 万亿总量部署");
    expect(ttg?.cmsCopy?.bodyZh).toContain("25,000,000,000,000");
    expect(ttg?.cmsCopy?.bodyZh).toMatch(/未售出/);
    expect(ttg?.cmsCopy?.bodyZh).toMatch(/销毁不是价格保护/);
    expect(ttg?.cmsCopy?.bodyZh).not.toMatch(/认购市场|100,000 TTG|公众认购|保证收益/);
    expect(ttg?.cmsCopy?.summaryZh).toMatch(/官网治理代币为 25T 面额/);
    expect(ttg?.cmsCopy?.summaryZh).toMatch(/公开 50% · DAO 35%/);
    expect(ttg?.cmsCopy?.summaryZh).toMatch(/团队 3%/);
    expect(merged.find((i) => i.id === "product-role-steward")?.cmsCopy?.bodyZh).not.toMatch(/收益分配/);
    expect(merged.find((i) => i.id === "campaign-referral")?.kind).toBe("campaign");
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

  it("falls back to Official www public pulse when local BFF is empty", async () => {
    invalidateCmsAnnouncementsCache();
    const officialRow = {
      id: "row-1",
      slug: "product-ttg-v8-25t",
      lane: "product",
      kind: "product",
      content_tier: "live",
      pinned: true,
      sort_order: 1,
      title_zh: "TTG 已按 25 万亿总量部署",
      title_en: "TTG is live at 25 trillion total supply",
      summary_zh: "官网治理代币为 25T 面额：公开 50% · DAO 35% · 团队 3% · 营销 5% · 金库 7%（Design Lock）。",
      summary_en: "Official governance token is the 25T denomination.",
      body_zh: null,
      body_en: null,
      effective_at: null,
      release_at: null,
      target_at: null,
      cta_kind: null,
      cta_href: null,
      network_scope: "mainnet",
      message_key: null,
      published_at: null,
      updated_at: "2026-08-16T00:00:00Z",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith(TRAVELTRUST_OFFICIAL_WWW_ORIGIN)) {
        return {
          ok: true,
          json: async () => ({ items: [officialRow] }),
        } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    const rows = await fetchTraveltrustCmsAnnouncements({ pulse: true });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("product-ttg-v8-25t");
    expect(rows[0]?.cmsCopy?.summaryZh).toMatch(/25T/);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).startsWith(TRAVELTRUST_OFFICIAL_WWW_ORIGIN))).toBe(true);
  });
});
