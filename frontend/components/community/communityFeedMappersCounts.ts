/**
 * 赞/藏计数与 Feed 卡片评论数聚合（与 {@link communityFeedMappers} 同簇）。
 */
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX } from "@/components/community/communityFeedConstants";
import { isShowcasePostId } from "@/lib/communityShowcase";

/**
 * **04 / 51-31**：`like_count` 为服务端聚合总数；`liked_by_me === true` 时已含当前用户。
 * UI `liked` 与 `likedByMe` 对齐时**不得**再 +1；仅在乐观过渡（`liked && !likedByMe` / `!liked && likedByMe`）时 ±1。
 */
export function displayLikeCountFromServerAndUi(
  serverLikeCount: number,
  uiLiked: boolean,
  likedByMe?: boolean
): number {
  const serverHasMe = likedByMe === true;
  let n = serverLikeCount;
  if (uiLiked && !serverHasMe) n += 1;
  if (!uiLiked && serverHasMe) n = Math.max(0, n - 1);
  return n;
}

/** 同 {@link displayLikeCountFromServerAndUi}，用于收藏数。 */
export function displayCollectCountFromServerAndUi(
  serverCollectCount: number,
  uiCollected: boolean,
  collectedByMe?: boolean
): number {
  const serverHasMe = collectedByMe === true;
  let n = serverCollectCount;
  if (uiCollected && !serverHasMe) n += 1;
  if (!uiCollected && serverHasMe) n = Math.max(0, n - 1);
  return n;
}

/**
 * 点赞写接口成功后，写回 **`CommunityPost.likes`** 的增量（与 **`displayLikeCountFromServerAndUi`** 防双计同源）。
 * - 目标为已赞：仅当 **`created===true`** 时 **+1**（幂等 **`created===false`** 不加）。
 * - 目标为取消赞：**-1**（下限 0 由调用方 **`Math.max`**）。
 */
export function engagementLikesDeltaAfterWriteOk(
  nowLiked: boolean,
  res: { status?: string; created?: boolean } | null
): number {
  if (!res || res.status !== "ok") return 0;
  if (nowLiked) return res.created === true ? 1 : 0;
  return -1;
}

/** 同 {@link engagementLikesDeltaAfterWriteOk}，用于 **`collect_count`** / **`CommunityPost.collects`**。 */
export function engagementCollectsDeltaAfterWriteOk(
  nowCollected: boolean,
  res: { status?: string; created?: boolean } | null
): number {
  if (!res || res.status !== "ok") return 0;
  if (nowCollected) return res.created === true ? 1 : 0;
  return -1;
}

/** 抽屉 / 浮层「评论 · N」诚实计数（API 已拉取且空线程 → 0） */
export function communityDrawerCommentCountHonest(
  post: CommunityPost | undefined,
  loadedComments: CommunityComment[],
  options: { apiFetched: boolean; commentsLoadError?: string | null },
): number {
  return communityVideoOverlayCommentDisplayCount(post, loadedComments, options);
}

/** 抽屉 / 评论浮层：API 缓存键或 showcase 帖 → 诚实计数 */
export function communityDrawerCommentCountHonestWithApiCache(
  post: CommunityPost,
  loadedComments: CommunityComment[],
  apiCommentsByPostId: Record<string, CommunityComment[]> | undefined,
  commentsLoadError?: string | null,
): number {
  return communityDrawerCommentCountHonest(post, loadedComments, {
    apiFetched: isShowcasePostId(post.id) || post.id in (apiCommentsByPostId ?? {}),
    commentsLoadError,
  });
}

/**
 * 视频浮层「评论 · N」：API 已拉取且线程为空时以 0 为准（避免 showcase mock `post.comments` 与空列表不一致）。
 */
export function communityVideoOverlayCommentDisplayCount(
  post: CommunityPost | undefined,
  loadedComments: CommunityComment[],
  options: { apiFetched: boolean; commentsLoadError?: string | null },
): number {
  if (options.apiFetched && !options.commentsLoadError && loadedComments.length === 0) {
    return 0;
  }
  if (post) return communityDrawerCommentCountFromPost(post, loadedComments);
  return loadedComments.length;
}

export function communityDrawerCommentCountFromPost(post: CommunityPost, loadedComments: CommunityComment[]): number {
  if (isShowcasePostId(post.id)) {
    return loadedComments.length;
  }
  return Math.max(post.comments, loadedComments.length);
}

/**
 * Feed 卡片评论数：默认 **`post.comments`**；若本页已为该帖缓存过 **`GET …/comments`** 结果（抽屉打开过）或与发帖列表乐观合并，则与缓存行数取大（未打开抽屉时不抬升）。
 */
export function communityFeedCardCommentDisplayCount(
  post: CommunityPost,
  loadedCommentsForPost?: CommunityComment[] | null
): number {
  const n = loadedCommentsForPost?.length ?? 0;
  if (n === 0) return post.comments;
  return Math.max(post.comments, n);
}

/**
 * 主 Feed 列表卡片：**`post.comments` + 乐观行**，并与 **`GET …/comments`** 缓存（抽屉已打开）取大；与资料页 / 收藏列表 {@link communityFeedCardCommentDisplayCount} 同源扩展。
 */
export function communityFeedListCardCommentCount(
  post: CommunityPost,
  apiCachedThread?: CommunityComment[] | null,
  localOptimisticThread?: CommunityComment[] | null
): number {
  const fromCache = communityFeedCardCommentDisplayCount(post, apiCachedThread);
  /** 仅 `useCommunityFeed` 发送中占位 id；成功换为服务端 id 后不得再 +N，避免与 **`withPostServerCommentCountBumped`** 双计 */
  const optimisticN = (localOptimisticThread ?? []).filter(
    (c) => typeof c.id === "string" && c.id.startsWith(COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX)
  ).length;
  return Math.max(fromCache, post.comments + optimisticN);
}

/** 列表卡片评论数 · showcase / 已拉 API 时诚实 0 */
export function communityFeedListCardCommentCountHonest(
  post: CommunityPost,
  apiCommentsByPostId: Record<string, CommunityComment[]>,
  localOptimisticThread?: CommunityComment[] | null,
): number {
  if (isShowcasePostId(post.id) || post.id in apiCommentsByPostId) {
    const apiCached = apiCommentsByPostId[post.id];
    const optimistic = (localOptimisticThread ?? []).filter(
      (c) => typeof c.id === "string" && c.id.startsWith(COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX),
    );
    const loaded = [...(apiCached ?? []), ...optimistic];
    return communityDrawerCommentCountHonest(post, loaded, { apiFetched: true });
  }
  return communityFeedListCardCommentCount(post, apiCommentsByPostId[post.id], localOptimisticThread);
}

/** 资料页 / 收藏列表卡片 · showcase / 已拉 API 时诚实 0 */
export function communityFeedCardCommentDisplayCountHonest(
  post: CommunityPost,
  apiCommentsByPostId: Record<string, CommunityComment[]>,
): number {
  return communityDrawerCommentCountHonestWithApiCache(
    post,
    apiCommentsByPostId[post.id] ?? [],
    apiCommentsByPostId,
  );
}

/** 成功 **`POST …/posts/:id/comments`** 后本地帖 **`comments` +1**，与后端聚合 **`comment_count`** 同向（含回复；①②③ 一致）。 */
export function withPostServerCommentCountBumped(post: CommunityPost): CommunityPost {
  return { ...post, comments: post.comments + 1 };
}

/** R-COMM-COMMENT-DELETE-1 · 删除成功后本地 `comments` 按可见删除数回退（≥0）。 */
export function withPostServerCommentCountDecremented(
  post: CommunityPost,
  removedVisibleCount = 1,
): CommunityPost {
  const n = Number.isFinite(removedVisibleCount) ? Math.max(0, Math.floor(removedVisibleCount)) : 1;
  return { ...post, comments: Math.max(0, post.comments - n) };
}
