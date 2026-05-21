import { apiUrl, routes } from "@/lib/api";
import type { TraveltrustLiquidityContract } from "@/lib/traveltrustLiquidityContract";
import { TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK } from "@/lib/traveltrustLiquidityContract";
import { TRAVELTRUST_V6_ANALYTICS_EVENTS } from "@/lib/traveltrustV6AnalyticsEvents";

export type { TraveltrustLiquidityContract };

/** `GET /api/v1/traveltrust/page-brief` — 与 crates/api `traveltrust_page_brief_json` v6 同源 */
export type TravelTrustPageBrief = {
  status: string;
  page: {
    canonical_path: string;
    alias_paths: string[];
    ia_version: string;
    sections: string[];
    spec_doc_ref: string;
  };
  allocation_ssot: {
    protocol_reference_doc_version: string;
    protocol_reference_path: string;
    rule: string;
  };
  cta_contract: {
    primary_target: string;
    secondary_target: string;
    in_page_anchors: string[];
    analytics_events: string[];
  };
  media: {
    hero_loop_env: string;
    hero_loop_poster_env: string;
    role_video_env_keys: string[];
    default_role_media_prefix: string;
  };
  liquidity_contract?: TraveltrustLiquidityContract;
};

export const TRAVELTRUST_V6_SECTIONS = [
  "pulse",
  "hero",
  "roles",
  "liquidity",
  "trust",
  "settlement",
  "faq",
  "start",
] as const;

/** 与 `crates/api` `traveltrust_page_brief_json` `cta_contract.in_page_anchors` 同序同集（①） */
export const TRAVELTRUST_PAGE_BRIEF_IN_PAGE_ANCHORS = [
  "#pulse",
  "#roles",
  "#liquidity",
  "#trust",
  "#settlement",
  "#faq",
  "#start",
  "#fee-router",
] as const;

/** 与 `crates/api` `traveltrust_page_brief_json` 同源；API 未起时 dev 只读 UI 用 */
export const TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK: TravelTrustPageBrief = {
  status: "ok",
  page: {
    canonical_path: "/traveltrust",
    alias_paths: ["/network"],
    ia_version: "v6",
    sections: [...TRAVELTRUST_V6_SECTIONS] as string[],
    spec_doc_ref: "docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md",
  },
  allocation_ssot: {
    protocol_reference_doc_version: "dev-fallback",
    protocol_reference_path: "/api/v1/governance/protocol-reference",
    rule:
      "Consume full 84 numeric / phase1_countries via GET /api/v1/governance/protocol-reference; this endpoint does not embed phase1_countries.",
  },
  cta_contract: {
    primary_target: "#start",
    secondary_target: "/governance",
    in_page_anchors: [...TRAVELTRUST_PAGE_BRIEF_IN_PAGE_ANCHORS],
    analytics_events: [...TRAVELTRUST_V6_ANALYTICS_EVENTS],
  },
  media: {
    hero_loop_env: "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP",
    hero_loop_poster_env: "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP_POSTER",
    role_video_env_keys: [
      "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_TRAVELER",
      "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_GUIDE",
      "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT",
      "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION",
      "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_REGION_STEWARD",
    ],
    default_role_media_prefix: "/media/traveltrust/roles/",
  },
  liquidity_contract: TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK,
};

export type TravelTrustPageBriefSource = "api" | "fallback";

export type TravelTrustPageBriefFetchResult = {
  brief: TravelTrustPageBrief;
  source: TravelTrustPageBriefSource;
};

function traveltrustPageBriefFallback(reason: string): TravelTrustPageBriefFetchResult {
  if (typeof console !== "undefined") {
    const hint =
      process.env.NODE_ENV === "development"
        ? " Start API: scripts\\start-api-with-seed.bat or http://127.0.0.1:8080/health"
        : "";
    console.warn(`[traveltrust] page-brief fallback (${reason}).${hint}`);
  }
  return { brief: TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK, source: "fallback" };
}

export async function fetchTravelTrustPageBrief(): Promise<TravelTrustPageBriefFetchResult> {
  const url = apiUrl(routes.traveltrustPageBrief);
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) {
      return traveltrustPageBriefFallback(String(res.status));
    }
    const brief = (await res.json()) as TravelTrustPageBrief;
    return { brief, source: "api" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return traveltrustPageBriefFallback(msg);
  }
}

export function isTravelTrustPageBriefV6(brief: TravelTrustPageBrief): boolean {
  return (
    brief.page?.ia_version === "v6" &&
    TRAVELTRUST_V6_SECTIONS.every((s, i) => brief.page.sections[i] === s)
  );
}
