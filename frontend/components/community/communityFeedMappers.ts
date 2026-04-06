/**
 * 社区 Feed API 与前端展示类型映射，供 useCommunityFeed、useCommunityFeedApi、me/posts、me/collects 共用。
 * 51-F1 / 51-31-9；52 §7.5 P2 拆出以解循环依赖。
 */
import type {
  CommunityPostType,
  CommunityPost,
  CommunityComment,
  CommunityPostVisibility,
} from "@/lib/communityMockData";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";

/** 700：与 **04 §二 2.1** **`users.role`** 白名单一致；小写规范化，供 **`communityStoredRoleLabelI18nKey`**；未知值回退 **`tourist`**。 */
const COMMUNITY_AUTHOR_ROLES_KNOWN = new Set([
  "guide",
  "tourist",
  "traveler",
  "provider",
  "region_steward",
  "arbitrator",
  "admin",
  "super_admin",
]);

export function mapApiUserRoleToCommunity(r: string | null | undefined): string {
  const x = (r ?? "").trim().toLowerCase();
  if (COMMUNITY_AUTHOR_ROLES_KNOWN.has(x)) return x;
  return "tourist";
}

/**
 * 701：社区角色小圆点背景色（须传入已 **`mapApiUserRoleToCommunity`** 的 **`role`** 串；与 **700** 白名单一致）。
 */
export function communityStoredRolePillClassName(role: string): string {
  switch (role) {
    case "guide":
      return "bg-fuchsia-500/20 text-fuchsia-300";
    case "provider":
      return "bg-amber-500/20 text-amber-200";
    case "region_steward":
      return "bg-violet-500/20 text-violet-200";
    case "arbitrator":
      return "bg-slate-500/30 text-slate-200";
    case "admin":
      return "bg-orange-500/20 text-orange-200";
    case "super_admin":
      return "bg-rose-500/20 text-rose-200";
    case "tourist":
    case "traveler":
    default:
      return "bg-cyan-500/20 text-cyan-300";
  }
}

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
  /** 已登录时列表/详情可带：当前用户是否已点赞 */
  liked_by_me?: boolean | null;
  collected_by_me?: boolean | null;
  /** B-076：已登录且作者非本人时，当前用户是否已关注作者 */
  author_followed_by_me?: boolean | null;
  /** 31 §2.3 */
  visibility_status?: string | null;
};

const API_POST_TYPES: readonly string[] = ["photo", "video", "food", "travel", "text"];

const VIS: readonly CommunityPostVisibility[] = ["public", "private", "archived"];

function mapApiVisibility(raw: string | null | undefined): CommunityPostVisibility | undefined {
  const s = (raw ?? "").toLowerCase();
  return VIS.includes(s as CommunityPostVisibility) ? (s as CommunityPostVisibility) : undefined;
}

/** 51-F1 / 51-31-9：将后端帖子格式映射为前端 CommunityPost；51-31-19 供 me/collects、me/posts 使用 */
export function mapApiPostToCommunityPost(p: ApiPostInput): CommunityPost {
  const urls = p.media_urls ?? [];
  const nick =
    (p.author_nickname && String(p.author_nickname).trim()) || p.user_id.slice(0, 8);
  const rawType = (p.post_type || "photo").toLowerCase();
  const type: CommunityPostType = API_POST_TYPES.includes(rawType) ? (rawType as CommunityPostType) : "photo";
  const walletShort = formatWalletOrDidShort(p.author_default_wallet ?? undefined);
  const coverTrim = p.cover_url != null && String(p.cover_url).trim() ? String(p.cover_url).trim() : undefined;
  const visibilityStatus = mapApiVisibility(p.visibility_status);
  return {
    id: p.id,
    type,
    content: p.body,
    media_url: urls[0] ?? "",
    media_urls: urls.length > 1 ? urls : undefined,
    ...(coverTrim ? { cover_url: coverTrim } : {}),
    is_video: type === "video",
    destination: p.destination,
    tags: p.tags ?? [],
    author: {
      id: p.user_id,
      nickname: nick,
      avatar_url: p.author_avatar_url ?? null,
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
  return {
    id: c.id,
    post_id: c.post_id,
    author: {
      id: c.user_id,
      nickname: nick,
      avatar_url: c.author_avatar_url ?? null,
      role: mapApiUserRoleToCommunity(c.author_role),
      ...(c.author_is_escrow_guide === true ? { isEscrowGuide: true } : {}),
      ...(cw ? { wallet: cw } : {}),
    },
    content: c.body,
    parent_id: c.parent_id ?? undefined,
    created_at: c.created_at,
  };
}
