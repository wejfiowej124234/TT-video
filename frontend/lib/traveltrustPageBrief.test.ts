import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchTravelTrustPageBrief,
  isTravelTrustPageBriefV6,
  TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK,
  TRAVELTRUST_PAGE_BRIEF_IN_PAGE_ANCHORS,
  TRAVELTRUST_V6_SECTIONS,
} from "./traveltrustPageBrief";
import { TRAVELTRUST_SECTION_HASH_IDS } from "./traveltrustSectionHash";
import { TRAVELTRUST_V6_ANALYTICS_EVENTS } from "./traveltrustV6AnalyticsEvents";

describe("traveltrustPageBrief", () => {
  it("v6 section order is fixed", () => {
    expect(TRAVELTRUST_V6_SECTIONS).toEqual([
      "pulse",
      "hero",
      "roles",
      "liquidity",
      "trust",
      "settlement",
      "faq",
      "start",
    ]);
  });

  it("isTravelTrustPageBriefV6 accepts v6 payload", () => {
    expect(
      isTravelTrustPageBriefV6({
        status: "ok",
        page: {
          canonical_path: "/traveltrust",
          alias_paths: ["/network"],
          ia_version: "v6",
          sections: [...TRAVELTRUST_V6_SECTIONS],
          spec_doc_ref: "docs/spec/85",
        },
        allocation_ssot: {
          protocol_reference_doc_version: "1",
          protocol_reference_path: "/api/v1/governance/protocol-reference",
          rule: "",
        },
        cta_contract: {
          primary_target: "#start",
          secondary_target: "/governance",
          in_page_anchors: [...TRAVELTRUST_PAGE_BRIEF_IN_PAGE_ANCHORS],
          analytics_events: [],
        },
        media: {
          hero_loop_env: "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP",
          hero_loop_poster_env: "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP_POSTER",
          role_video_env_keys: [],
          default_role_media_prefix: "/media/traveltrust/roles/",
        },
      }),
    ).toBe(true);
  });

  it("dev fallback matches v6", () => {
    expect(isTravelTrustPageBriefV6(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK)).toBe(true);
  });

  it("dev fallback includes liquidity_contract aligned with TTG quote API", () => {
    expect(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.liquidity_contract?.quote_path).toBe(
      "/api/v1/governance/ttg-exchange/quote",
    );
    expect(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.liquidity_contract?.pair_type).toBe(
      "stablecoin_to_governance_token",
    );
  });

  it("dev fallback analytics_events match v6 union (TT-PH1-051)", () => {
    expect(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.cta_contract.analytics_events).toEqual([
      ...TRAVELTRUST_V6_ANALYTICS_EVENTS,
    ]);
  });

  it("dev fallback in_page_anchors match API SSOT order (crates/api traveltrust_page)", () => {
    expect(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.cta_contract.in_page_anchors).toEqual([
      ...TRAVELTRUST_PAGE_BRIEF_IN_PAGE_ANCHORS,
    ]);
  });

  it("page-brief anchors are subset of scroll/hash SSOT", () => {
    const briefHashes = TRAVELTRUST_PAGE_BRIEF_IN_PAGE_ANCHORS.map((a) => a.slice(1));
    for (const h of briefHashes) {
      expect(TRAVELTRUST_SECTION_HASH_IDS as readonly string[]).toContain(h);
    }
  });

  it("scroll/hash SSOT ids (except hero) appear in page-brief anchors", () => {
    const briefHashes = new Set(TRAVELTRUST_PAGE_BRIEF_IN_PAGE_ANCHORS.map((a) => a.slice(1)));
    for (const id of TRAVELTRUST_SECTION_HASH_IDS) {
      if (id === "hero") continue;
      expect(briefHashes).toContain(id);
    }
  });

  it("fetchTravelTrustPageBrief uses fallback when API returns 500", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { brief, source } = await fetchTravelTrustPageBrief();
    expect(brief).toEqual(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK);
    expect(source).toBe("fallback");
    warn.mockRestore();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
