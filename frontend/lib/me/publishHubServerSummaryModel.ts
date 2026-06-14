/**
 * 发布中心 · GET /api/v1/me/publish-summary 响应 schema（① BFF 聚合 · ② staging 同形）
 */
import type { PublishHubSummaryCounts } from "@/lib/me/publishHubSummaryModel";

export type PublishHubServerSummaryCounts = PublishHubSummaryCounts;

export type PublishHubServerSummaryResponse = {
  status: "ok";
  counts: PublishHubServerSummaryCounts;
  meta?: {
    implementation_status?: string;
    source?: string;
  };
};

/** traveltrust-api · W1-A3 */
export const PUBLISH_HUB_SUMMARY_API_IMPL_STATUS = "me_publish_summary_api_v1" as const;

/** Next BFF 五路聚合 fallback · W1-A4 ① */
export const PUBLISH_HUB_SUMMARY_BFF_IMPL_STATUS = "me_publish_summary_bff_v1" as const;

export const PUBLISH_HUB_SUMMARY_BFF_SOURCE = "next-bff-aggregate" as const;

export function parsePublishHubServerSummaryMeta(
  payload: unknown,
): PublishHubServerSummaryResponse["meta"] | null {
  if (!payload || typeof payload !== "object") return null;
  const meta = (payload as Record<string, unknown>).meta;
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  return {
    implementation_status:
      typeof m.implementation_status === "string" ? m.implementation_status : undefined,
    source: typeof m.source === "string" ? m.source : undefined,
  };
}

export function isPublishHubServerSummaryApiPayload(payload: unknown): boolean {
  return (
    parsePublishHubServerSummaryMeta(payload)?.implementation_status ===
    PUBLISH_HUB_SUMMARY_API_IMPL_STATUS
  );
}

export function isPublishHubServerSummaryBffAggregatePayload(payload: unknown): boolean {
  const meta = parsePublishHubServerSummaryMeta(payload);
  return (
    meta?.implementation_status === PUBLISH_HUB_SUMMARY_BFF_IMPL_STATUS &&
    meta?.source === PUBLISH_HUB_SUMMARY_BFF_SOURCE
  );
}

export function parsePublishHubServerSummaryPayload(
  payload: unknown,
): PublishHubServerSummaryCounts | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  if (root.status !== "ok") return null;
  const counts = root.counts;
  if (!counts || typeof counts !== "object") return null;
  const c = counts as Record<string, unknown>;
  const num = (key: string) => (typeof c[key] === "number" && Number.isFinite(c[key]) ? c[key] : 0);
  return {
    trip: num("trip"),
    guide: num("guide"),
    merchantPublished: num("merchantPublished"),
    merchantDrafts: num("merchantDrafts"),
    acquisitionPublished: num("acquisitionPublished"),
    acquisitionDrafts: num("acquisitionDrafts"),
    governance: num("governance"),
  };
}
