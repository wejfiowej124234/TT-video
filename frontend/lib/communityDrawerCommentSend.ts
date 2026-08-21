/**
 * 社区发评 HTTP、离线守卫与「本人作者」快照：**抽屉页**与 **`useCommunityFeed`** 共用（`POST …/comments`；**`communityCommentAuthorFromMeUser`** 供乐观评论/发帖与 **`buildCommunityDrawerCommentRow`**；Feed 另换真实 comment `id` + **`commentsRetryTick`**）。
 */
import { postComment } from "@/lib/apiClient/community";
import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappers";
import type { CommunityComment, CommunityPostAuthor } from "@/lib/communityMockData";
import {
  isCommunityCommentDuplicateRejection,
  isExpectedCommunityWriteRejection,
} from "@/lib/communityApiExpectedWriteRejection";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";

/** `throw` / `catch` 与 CommentDrawer 发评错误分流同源；勿改字面量。 */
export const COMMUNITY_COMMENT_SEND_OFFLINE = "comment_offline" as const;
export const COMMUNITY_COMMENT_SEND_POST_NOT_OK = "comment_post_not_ok" as const;

/** `interpretCommunityWriteError` / `mapApiReadError` 兜底 i18n key（zh/en 须有对应句）。 */
export const COMMUNITY_COMMENT_SEND_I18N_FALLBACK = "community_comment_send_failed" as const;

/** `catch` 末尾非 `Error` 时的 `throw new Error(…)` 文案（勿与 {@link COMMUNITY_COMMENT_SEND_I18N_FALLBACK} 混淆）。 */
export const COMMUNITY_COMMENT_SEND_WRAP_FAILED = "comment_send_failed" as const;

/** 离线提示 i18n key（zh/en 对拍）。 */
export const COMMUNITY_COMMENT_OFFLINE_I18N_KEY = "community_comment_offline" as const;

/** GET …/comments 列表失败兜底 key（与 **`ApiErrorAlert`** `isKnownLoadOrRequestFailure` 同源）。 */
export const COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY = "community_comments_loadFailed" as const;

/** 与 **`CommunityAuthContext` `user`** 字段对齐；仅用于构造发评成功后的本地一行（随后由 GET 覆盖）。 */
export type CommunityDrawerCommentMeUser = {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  default_wallet_address?: string | null;
} | null;

/** 离线时返回 i18n 文案；在线返回 `null`（不发请求）。 */
export function communityCommentOfflineMessage(t: (key: string) => string): string | null {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return t(COMMUNITY_COMMENT_OFFLINE_I18N_KEY);
  }
  return null;
}

/**
 * 当前登录用户在评论/发帖乐观 UI 中的作者快照；与 **`useCommunityFeed` `authorForSelf`** 历史行为一致（无 `meUser.id` 时为 **`unknown`**）。
 */
export function communityCommentAuthorFromMeUser(
  meUser: CommunityDrawerCommentMeUser,
  dashLabel: string
): CommunityPostAuthor {
  if (!meUser?.id) {
    return { id: "unknown", nickname: dashLabel, avatar_url: null, role: "tourist" };
  }
  const walletShort = formatWalletOrDidShort(meUser.default_wallet_address ?? undefined);
  return {
    id: meUser.id,
    nickname: meUser.nickname?.trim() ? meUser.nickname : meUser.id.slice(0, 8),
    avatar_url: meUser.avatar_url ?? null,
    role: mapApiUserRoleToCommunity(meUser.role),
    ...(walletShort ? { wallet: walletShort } : {}),
  };
}

export function buildCommunityDrawerCommentRow(args: {
  postId: string;
  content: string;
  parentId?: string;
  commentId: string;
  meUser: CommunityDrawerCommentMeUser;
  t: (key: string) => string;
  createdAtIso?: string;
}): CommunityComment {
  const { postId, content, parentId, commentId, meUser, t, createdAtIso } = args;
  return {
    id: commentId,
    post_id: postId,
    author: communityCommentAuthorFromMeUser(meUser, t("ui_em_dash")),
    content,
    parent_id: parentId,
    created_at: createdAtIso ?? new Date().toISOString(),
  };
}

export type PostCommunityDrawerCommentResult =
  | { ok: true; commentId: string }
  | { ok: true; softDuplicate: true }
  | { ok: false; body: unknown };

/** `POST …/posts/:id/comments`；成功返回 `commentId`；同文重复为软成功；否则 `ok: false`（由页面 **`interpretCommunityWriteError`**）。 */
export async function postCommunityDrawerComment(args: {
  postId: string;
  content: string;
  parentId?: string;
  logContext: string;
}): Promise<PostCommunityDrawerCommentResult> {
  const { postId, content, parentId, logContext } = args;
  const res = await postComment(postId, content, parentId);
  const r = res as { id?: string; status?: string; message?: string } | null;
  if (r?.id) return { ok: true, commentId: r.id };
  if (isCommunityCommentDuplicateRejection(res)) {
    return { ok: true, softDuplicate: true };
  }
  if (typeof window !== "undefined" && !isExpectedCommunityWriteRejection(res)) {
    console.error(`${logContext} postComment not ok:`, res);
  }
  return { ok: false, body: res };
}
