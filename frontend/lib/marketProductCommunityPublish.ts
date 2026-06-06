/**
 * 将自由市场「产品」同步为社区帖子（`POST /api/v1/community/posts`），
 * 以便个人中心「社区帖子」、赞/藏与「赞过」「收藏」弹窗走同一套社区数据。
 */

import { createPost } from "@/lib/apiClient/community";
import { getAuthHeaders } from "@/lib/apiClient/core";
import type { AcquisitionStudioDraftPersistSource, MerchantStudioDraftPersistSource } from "@/lib/marketStudioDraft";
import type { CustomItineraryForm } from "@/components/market/CustomItineraryModal/types";

export const TT_MARKET_TAG = "tt_market";
export const TT_MARKET_PROVIDER_TAG = "tt_market_provider";
export const TT_MARKET_ACQUISITION_TAG = "tt_market_acquisition";
export const TT_MARKET_MAIN_ITINERARY_TAG = "tt_market_main_itinerary";

/** 与 **`crates/api` 社区帖 `commerce_showcase_kind` allowlist** 对拍（**`marketProductCommunityPublish.test.ts`**）。 */
export const COMMERCE_SHOWCASE_KIND = {
  ITINERARY_LED: "itinerary_led",
  LODGING_LED: "lodging_led",
  ACQUISITION_LED: "acquisition_led",
  GENERAL_LED: "general_led",
} as const;

export function hasCommunityPublishAuth(): boolean {
  const h = getAuthHeaders();
  return Boolean(h.Authorization || h["X-User-Id"]);
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function assertCreatePostOk(
  res: { status: string; id?: string; message?: string; errors?: Record<string, string> } | null,
): string {
  if (res?.status === "ok" && typeof res.id === "string" && res.id.length > 0) return res.id;
  const msg = res?.message ?? res?.status ?? "create_post_failed";
  throw new Error(msg);
}

export type MarketCommunitySyncOpts = {
  /** 目录发布成功后的 `market_listings.id`，写入帖子以便前后端对齐 */
  marketListingId?: string;
};

/** 商家橱窗创作台：保存草稿成功后调用，生成在个人中心「社区帖子」可见的社区帖。 */
export async function publishMerchantShowcaseCommunityPost(
  form: MerchantStudioDraftPersistSource,
  marketDraftId: string,
  opts?: MarketCommunitySyncOpts,
): Promise<{ postId: string }> {
  const lines = [
    `[橱窗] ${form.title.trim()}`,
    form.subtitle.trim() ? `副标题：${form.subtitle.trim()}` : "",
    `品类：${form.category}｜城市：${form.city.trim()}｜国家：${form.countryIso.trim().toUpperCase()}`,
    `价格(USDC)：${form.priceUsdc.trim()}｜交付：${form.deliveryArchetype}`,
    form.highlightsText.trim() ? `亮点：\n${clip(form.highlightsText.trim(), 2500)}` : "",
    form.description.trim() ? `描述：\n${clip(form.description.trim(), 4500)}` : "",
    form.videoUrl.trim() ? `外链/视频：${clip(form.videoUrl.trim(), 500)}` : "",
    `橱窗草稿 ID：${marketDraftId}`,
  ];
  const body = lines.filter(Boolean).join("\n\n");
  const res = await createPost({
    body,
    post_type: "text",
    tags: [TT_MARKET_TAG, TT_MARKET_PROVIDER_TAG, form.category, `tt_market_draft:${marketDraftId}`],
    destination: form.city.trim() || undefined,
    commerce_showcase_kind: "general_led",
    ...(opts?.marketListingId ? { commerce_market_listing_id: opts.marketListingId } : {}),
  });
  return { postId: assertCreatePostOk(res) };
}

/** 旅行收购创作台：同上。 */
export async function publishAcquisitionCarryCommunityPost(
  form: AcquisitionStudioDraftPersistSource,
  marketDraftId: string,
  opts?: MarketCommunitySyncOpts,
): Promise<{ postId: string }> {
  const lines = [
    `[收购意向] ${form.title.trim()}`,
    form.summary.trim() ? `摘要：${clip(form.summary.trim(), 800)}` : "",
    `品类：${form.category}｜目的国：${form.destinationCountryIso.trim().toUpperCase()}`,
    `赏金 USDC：${form.bountyMinUsdc.trim()}–${form.bountyMaxUsdc.trim()}｜截止说明：${clip(form.deadlineNote.trim(), 400)}`,
    form.supplyOrigin.trim() ? `货源/启运：${clip(form.supplyOrigin.trim(), 600)}` : "",
    form.receiptHandoff.trim() ? `收货/交割：${clip(form.receiptHandoff.trim(), 600)}` : "",
    form.highlightsText.trim() ? `要点：\n${clip(form.highlightsText.trim(), 2000)}` : "",
    form.description.trim() ? `描述：\n${clip(form.description.trim(), 4000)}` : "",
    form.videoUrl.trim() ? `外链/视频：${clip(form.videoUrl.trim(), 500)}` : "",
    `收购草稿 ID：${marketDraftId}`,
  ];
  const body = lines.filter(Boolean).join("\n\n");
  const res = await createPost({
    body,
    post_type: "text",
    tags: [TT_MARKET_TAG, TT_MARKET_ACQUISITION_TAG, form.category, `tt_market_draft:${marketDraftId}`],
    destination: form.destinationCountryIso.trim().toUpperCase() || undefined,
    commerce_showcase_kind: "acquisition_led",
    ...(opts?.marketListingId ? { commerce_market_listing_id: opts.marketListingId } : {}),
  });
  return { postId: assertCreatePostOk(res) };
}

/** 自由市场主站·自定义行程订单创建成功后调用（不抛错以免影响订单主流程）。 */
export async function tryPublishCustomItineraryCommunityPost(
  form: CustomItineraryForm,
  orderId: string,
): Promise<{ postId: string } | null> {
  if (!hasCommunityPublishAuth()) return null;
  const title = form.title.trim() || `Custom itinerary ${orderId.slice(0, 8)}`;
  const dest = form.destinationManual.trim() || form.dayPlans[0]?.city?.trim() || "";
  const lines = [
    `[自由市场·行程] ${title}`,
    `角色：${form.creatorType === "guide" ? "guide" : "tourist"}｜国家：${form.country}｜天数：${form.totalDays}`,
    `金额：${form.amount}`,
    form.description.trim() ? clip(form.description.trim(), 3500) : "",
    `订单：${orderId}`,
    `可在市场订单或托管页继续跟进。`,
  ];
  const body = lines.filter(Boolean).join("\n\n");
  try {
    const res = await createPost({
      body,
      post_type: "text",
      tags: [TT_MARKET_TAG, TT_MARKET_MAIN_ITINERARY_TAG, `tt_order:${orderId}`],
      destination: dest || undefined,
      commerce_showcase_kind: "itinerary_led",
    });
    return { postId: assertCreatePostOk(res) };
  } catch {
    return null;
  }
}
