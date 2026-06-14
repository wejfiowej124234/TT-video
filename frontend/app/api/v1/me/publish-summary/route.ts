import { NextRequest, NextResponse } from "next/server";
import {
  forwardApiHeaders,
  traveltrustApiBaseCandidates,
} from "@/lib/server/proxyTraveltrustApi";
import {
  parsePublishHubServerSummaryPayload,
  PUBLISH_HUB_SUMMARY_BFF_IMPL_STATUS,
  PUBLISH_HUB_SUMMARY_BFF_SOURCE,
  type PublishHubServerSummaryResponse,
} from "@/lib/me/publishHubServerSummaryModel";

async function fetchUpstreamJson(
  req: NextRequest,
  pathWithQuery: string,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const headers = forwardApiHeaders(req);
  const bases = traveltrustApiBaseCandidates();
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${pathWithQuery}`, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 404 && bases.indexOf(base) < bases.length - 1) continue;
      const json = (await res.json().catch(() => null)) as unknown;
      return { ok: res.ok, status: res.status, json };
    } catch {
      continue;
    }
  }
  return { ok: false, status: 503, json: null };
}

function lenArray(v: unknown, key: string): number {
  if (!v || typeof v !== "object") return 0;
  const arr = (v as Record<string, unknown>)[key];
  return Array.isArray(arr) ? arr.length : 0;
}

function guideHasListing(json: unknown): number {
  if (!json || typeof json !== "object") return 0;
  const root = json as Record<string, unknown>;
  if (root.status !== "ok") return 0;
  const profile = root.profile;
  if (!profile || typeof profile !== "object") return 0;
  const p = profile as Record<string, unknown>;
  const guideId = typeof p.guide_id === "string" ? p.guide_id.trim() : "";
  const status = typeof p.status === "string" ? p.status.trim().toLowerCase() : "";
  if (!guideId && !status) return 0;
  if (status === "none" || status === "rejected") return 0;
  return 1;
}

/** ① 同源 BFF：五轨计数聚合（契约 SSOT · ② staging 同形校验） */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const userId = req.headers.get("x-user-id");
  if (!auth && !userId) {
    return NextResponse.json({ status: "error", code: "login_required" }, { status: 401 });
  }

  const upstream = await fetchUpstreamJson(req, "/api/v1/me/publish-summary");
  if (upstream.ok && upstream.json) {
    const parsed = parsePublishHubServerSummaryPayload(upstream.json);
    if (parsed) {
      return NextResponse.json(upstream.json);
    }
  }

  const [tripRes, merchantRes, acquisitionRes, govRes, guideRes] = await Promise.all([
    fetchUpstreamJson(req, "/api/v1/orders?business_line=trip&hat=traveler&limit=50"),
    fetchUpstreamJson(req, "/api/v1/me/merchant-listings"),
    fetchUpstreamJson(req, "/api/v1/me/acquisition-listings"),
    fetchUpstreamJson(req, "/api/v1/governance/proposals?mine=1&limit=50"),
    fetchUpstreamJson(req, "/api/v1/me/guide-profile"),
  ]);

  let trip = 0;
  if (tripRes.ok && tripRes.json && typeof tripRes.json === "object") {
    const root = tripRes.json as Record<string, unknown>;
    if (Array.isArray(root.orders)) trip = root.orders.length;
    else if (Array.isArray(root.data)) trip = root.data.length;
  }

  const merchantPublished = lenArray(merchantRes.json, "published");
  const merchantDrafts = lenArray(merchantRes.json, "drafts");
  const acquisitionPublished = lenArray(acquisitionRes.json, "published");
  const acquisitionDrafts = lenArray(acquisitionRes.json, "drafts");

  let governance = 0;
  if (govRes.ok && govRes.json && typeof govRes.json === "object") {
    const root = govRes.json as Record<string, unknown>;
    if (Array.isArray(root.proposals)) governance = root.proposals.length;
    else if (Array.isArray(root.data)) governance = root.data.length;
  }

  const guide = guideHasListing(guideRes.json);

  const body: PublishHubServerSummaryResponse = {
    status: "ok",
    counts: {
      trip,
      guide,
      merchantPublished,
      merchantDrafts,
      acquisitionPublished,
      acquisitionDrafts,
      governance,
    },
    meta: {
      implementation_status: PUBLISH_HUB_SUMMARY_BFF_IMPL_STATUS,
      source: PUBLISH_HUB_SUMMARY_BFF_SOURCE,
    },
  };

  return NextResponse.json(body);
}
