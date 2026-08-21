/**
 * 帖子/评论 API 行 → 前端 `CommunityPost` / `CommunityComment` 与可见性占位（与 {@link communityFeedMappers} 同簇）。
 */
import type {
  CommunityCommerceShowcaseKind,
  CommunityPostType,
  CommunityPost,
  CommunityComment,
  CommunityPostVisibility,
  CommunityCommentVisibility,
} from "@/lib/communityMockData";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import {
  communityMediaAbsoluteUrlForRender,
  normalizeDurableCommunityMediaUrl,
} from "@/lib/communityMediaClientUrl";
import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappersRoleAndMedia";

export type ApiPostInput = {
  id: string;
  user_id: string;
  body: string;
  post_type: string;
  destination?: string;
  tags: string[];
  media_urls: string[];
  created_at: string;
  like_count?: number;
  comment_count?: number;
  collect_count?: number;
  /** 07 §五 5.3B：Feed/帖子 API 批量作者展示（users 公开字段） */
  author_nickname?: string | null;
  author_avatar_url?: string | null;
  /** 与 `users.role` 一致 */
  author_role?: string | null;
  /** 存在 `guides` 且 status=active（API `author_is_escrow_guide`） */
  author_is_escrow_guide?: boolean | null;
  /** `users.default_wallet_address`（API 原样；前端缩写后写入 `author.wallet`） */
  author_default_wallet?: string | null;
  /** 可选：帖子已上链存证锚定 */
  evidence_anchored?: boolean | null;
  /** 视频帖可选封面 */
  cover_url?: string | null;
  /** S3 multipart 视频资产（04 · `community_posts.primary_media_asset_id`） */
  primary_media_asset_id?: string | null;
  /** 已登录时列表/详情可带：当前用户是否已点赞 */
  liked_by_me?: boolean | null;
  collected_by_me?: boolean | null;
  /** B-076：已登录且作者非本人时，当前用户是否已关注作者 */
  author_followed_by_me?: boolean | null;
  /** 31 §2.3 */
  visibility_status?: string | null;
  /** 04 · `commerce_showcase_kind`（个人中心角标 SSOT） */
  commerce_showcase_kind?: string | null;
  commerce_market_listing_id?: string | null;
  /** POI / geo（② Feed 扩展 · ① mapper 前向兼容） */
  venue_name?: string | null;
  venue_lat?: number | null;
  venue_lng?: number | null;
  distance_m?: number | null;
  is_sponsored?: boolean | null;
};

const API_POST_TYPES: readonly string[] = ["photo", "video", "food", "travel", "text"];

/** 与 PG `community_posts.commerce_showcase_kind` CHECK 同源 */
const API_COMMERCE_SHOWCASE_KINDS = new Set<string>([
  "itinerary_led",
  "lodging_led",
  "acquisition_led",
  "general_led",
]);

function mapApiCommerceShowcaseKind(
  raw: string | null | undefined,
): CommunityCommerceShowcaseKind | undefined {
  const s = raw?.trim().toLowerCase();
  if (!s || !API_COMMERCE_SHOWCASE_KINDS.has(s)) return undefined;
  return s as CommunityCommerceShowcaseKind;
}

const VIS: readonly CommunityPostVisibility[] = ["public", "private", "archived", "hidden"];

function mapApiVisibility(raw: string | null | undefined): CommunityPostVisibility | undefined {
  const s = (raw ?? "").toLowerCase();
  return VIS.includes(s as CommunityPostVisibility) ? (s as CommunityPostVisibility) : undefined;
}

const COMMENT_VIS: readonly CommunityCommentVisibility[] = ["visible", "hidden", "removed"];

function mapApiCommentVisibility(raw: string | null | undefined): CommunityCommentVisibility | undefined {
  const s = (raw ?? "").trim().toLowerCase();
  return COMMENT_VIS.includes(s as CommunityCommentVisibility) ? (s as CommunityCommentVisibility) : undefined;
}

/** 04：`hidden`/`removed` 或 `body_is_redacted` 且正文为空时展示占位（服务端已对非作者清空 `body`）。 */
export function communityCommentUseModerationPlaceholder(c: CommunityComment): boolean {
  if ((c.content ?? "").trim().length > 0) return false;
  return (
    c.visibilityStatus === "hidden" ||
    c.visibilityStatus === "removed" ||
    c.bodyIsRedacted === true
  );
}

/** 与 {@link communityCommentUseModerationPlaceholder} 配套：`t(key)` 展示「已隐藏 / 已移除 / 泛化不可用」。 */
export function communityCommentModerationPlaceholderI18nKey(c: CommunityComment): string {
  if (!communityCommentUseModerationPlaceholder(c)) return "community_comment_moderated_placeholder";
  if (c.visibilityStatus === "hidden") return "community_comment_status_hidden";
  if (c.visibilityStatus === "removed") return "community_comment_status_removed";
  return "community_comment_moderated_placeholder";
}

/** 51-F1 / 51-31-9：将后端帖子格式映射为前端 CommunityPost；51-31-19 供 me/collects、me/posts 使用 */
export function mapApiPostToCommunityPost(p: ApiPostInput): CommunityPost {
  const urls = (p.media_urls ?? [])
    .map((u) => normalizeDurableCommunityMediaUrl(String(u)))
    .filter(Boolean);
  const nick =
    (p.author_nickname && String(p.author_nickname).trim()) || p.user_id.slice(0, 8);
  const rawType = (p.post_type || "photo").toLowerCase();
  const type: CommunityPostType = API_POST_TYPES.includes(rawType) ? (rawType as CommunityPostType) : "photo";
  const walletShort = formatWalletOrDidShort(p.author_default_wallet ?? undefined);
  const coverTrim =
    p.cover_url != null && String(p.cover_url).trim()
      ? normalizeDurableCommunityMediaUrl(String(p.cover_url).trim())
      : undefined;
  const assetTrim =
    p.primary_media_asset_id != null && String(p.primary_media_asset_id).trim()
      ? String(p.primary_media_asset_id).trim()
      : undefined;
  const visibilityStatus = mapApiVisibility(p.visibility_status);
  const commerceShowcaseKind = mapApiCommerceShowcaseKind(p.commerce_showcase_kind);
  const listingTrim =
    p.commerce_market_listing_id != null && String(p.commerce_market_listing_id).trim()
      ? String(p.commerce_market_listing_id).trim()
      : undefined;
  const authorAvatarRaw =
    p.author_avatar_url != null && String(p.author_avatar_url).trim()
      ? String(p.author_avatar_url).trim()
      : "";
  const authorAvatar = authorAvatarRaw ? normalizeDurableCommunityMediaUrl(authorAvatarRaw) : null;
  return {
    id: p.id,
    type,
    content: p.body,
    media_url: urls[0] ?? "",
    media_urls: urls.length > 1 ? urls : undefined,
    ...(coverTrim ? { cover_url: coverTrim } : {}),
    ...(assetTrim ? { primaryMediaAssetId: assetTrim } : {}),
    is_video: type === "video",
    destination: p.destination,
    tags: p.tags ?? [],
    author: {
      id: p.user_id,
      nickname: nick,
      avatar_url: authorAvatar,
      role: mapApiUserRoleToCommunity(p.author_role),
      ...(p.author_is_escrow_guide === true ? { isEscrowGuide: true } : {}),
      ...(walletShort ? { wallet: walletShort } : {}),
    },
    likes: p.like_count ?? 0,
    comments: p.comment_count ?? 0,
    collects: p.collect_count ?? 0,
    created_at: p.created_at,
    ...(p.evidence_anchored === true ? { evidenceAnchored: true } : {}),
    ...(typeof p.liked_by_me === "boolean" ? { likedByMe: p.liked_by_me } : {}),
    ...(typeof p.collected_by_me === "boolean" ? { collectedByMe: p.collected_by_me } : {}),
    ...(typeof p.author_followed_by_me === "boolean"
      ? { authorFollowedByMe: p.author_followed_by_me }
      : {}),
    ...(visibilityStatus ? { visibilityStatus } : {}),
    ...(commerceShowcaseKind ? { commerceShowcaseKind } : {}),
    ...(listingTrim ? { commerceMarketListingId: listingTrim } : {}),
    ...(p.venue_name != null && String(p.venue_name).trim()
      ? { venueName: String(p.venue_name).trim() }
      : {}),
    ...(typeof p.venue_lat === "number" && Number.isFinite(p.venue_lat) ? { venueLat: p.venue_lat } : {}),
    ...(typeof p.venue_lng === "number" && Number.isFinite(p.venue_lng) ? { venueLng: p.venue_lng } : {}),
    ...(typeof p.distance_m === "number" && Number.isFinite(p.distance_m) && p.distance_m >= 0
      ? { distanceM: p.distance_m }
      : {}),
    ...(p.is_sponsored === true ? { isSponsored: true } : {}),
  };
}

/** 51-31-5 / 07 §五 5.3B：评论列表 API 行 → CommunityComment（可选 author_nickname / author_avatar_url） */
export type ApiCommentInput = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  body: string;
  created_at: string;
  visibility_status?: string | null;
  risk_level?: number | string | null;
  body_is_redacted?: boolean | null;
  author_nickname?: string | null;
  author_avatar_url?: string | null;
  author_role?: string | null;
  author_is_escrow_guide?: boolean | null;
  author_default_wallet?: string | null;
};

export function mapApiCommentToCommunityComment(c: ApiCommentInput): CommunityComment {
  const short8 = c.user_id.slice(0, 8);
  const nick = (c.author_nickname && String(c.author_nickname).trim()) || short8;
  const cw = formatWalletOrDidShort(c.author_default_wallet ?? undefined);
  const avRaw = c.author_avatar_url != null && String(c.author_avatar_url).trim()
    ? String(c.author_avatar_url).trim()
    : "";
  // Durable OCS remap first, then browser/SSR absolute resolve（禁止 legacy upload 出站）
  const avatarResolved = avRaw
    ? communityMediaAbsoluteUrlForRender(normalizeDurableCommunityMediaUrl(avRaw))
    : null;
  const vis = mapApiCommentVisibility(c.visibility_status);
  return {
    id: c.id,
    post_id: c.post_id,
    author: {
      id: c.user_id,
      nickname: nick,
      avatar_url: avatarResolved,
      role: mapApiUserRoleToCommunity(c.author_role),
      ...(c.author_is_escrow_guide === true ? { isEscrowGuide: true } : {}),
      ...(cw ? { wallet: cw } : {}),
    },
    content: c.body,
    parent_id: c.parent_id ?? undefined,
    created_at: c.created_at,
    ...(vis ? { visibilityStatus: vis } : {}),
    ...(c.body_is_redacted === true ? { bodyIsRedacted: true } : {}),
  };
}
