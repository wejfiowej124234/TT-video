/**
 * 发布中心 · 汇总条计数（① · GET /me/publish-summary BFF SSOT · 客户端为 fallback）
 */
import type { PublishHubContentRail } from "@/lib/me/publishHubModel";

export type PublishHubSummaryCounts = {
  trip: number;
  merchantPublished: number;
  merchantDrafts: number;
  acquisitionPublished: number;
  acquisitionDrafts: number;
  governance: number;
  guide: number;
};

export type PublishHubSummaryChip = {
  rail: PublishHubContentRail;
  count: number;
  labelKey: string;
};

export function buildPublishHubSummaryChips(
  counts: PublishHubSummaryCounts,
): readonly PublishHubSummaryChip[] {
  const chips: PublishHubSummaryChip[] = [];
  if (counts.trip > 0) {
    chips.push({ rail: "trip", count: counts.trip, labelKey: "publish_hub_summary_trip" });
  }
  const merchantTotal = counts.merchantPublished + counts.merchantDrafts;
  if (merchantTotal > 0) {
    chips.push({
      rail: "merchant",
      count: merchantTotal,
      labelKey: "publish_hub_summary_merchant",
    });
  }
  const acquisitionTotal = counts.acquisitionPublished + counts.acquisitionDrafts;
  if (acquisitionTotal > 0) {
    chips.push({
      rail: "acquisition",
      count: acquisitionTotal,
      labelKey: "publish_hub_summary_acquisition",
    });
  }
  if (counts.governance > 0) {
    chips.push({
      rail: "governance",
      count: counts.governance,
      labelKey: "publish_hub_summary_governance",
    });
  }
  if (counts.guide > 0) {
    chips.push({ rail: "guide", count: counts.guide, labelKey: "publish_hub_summary_guide" });
  }
  return chips;
}

export function countMerchantListingRows(
  rows: readonly { kind: "published" | "draft" }[],
): Pick<PublishHubSummaryCounts, "merchantPublished" | "merchantDrafts"> {
  let merchantPublished = 0;
  let merchantDrafts = 0;
  for (const row of rows) {
    if (row.kind === "published") merchantPublished += 1;
    else merchantDrafts += 1;
  }
  return { merchantPublished, merchantDrafts };
}
