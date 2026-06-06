import type { Dispatch, SetStateAction } from "react";
import type { PostDetailDrawerProps } from "@/components/community/postDetailDrawerTypes";
import type { CommunityPost } from "@/lib/communityMockData";

/** 当前 Feed 页已加载帖 id 序（详情弹窗内上下切帖 / N 指示 · 照片/视频统一） */
export function detailFeedPostIdsFromPosts(posts: readonly CommunityPost[]): string[] {
  return posts.map((p) => p.id);
}

/** 与 {@link detailFeedPostIdsFromPosts} 同源（保留旧名供调用方） */
export function detailVideoFeedPostIdsFromPosts(posts: readonly CommunityPost[]): string[] {
  return detailFeedPostIdsFromPosts(posts);
}

export function detailVideoFeedIndex(postIds: readonly string[], activePostId: string): number {
  return postIds.indexOf(activePostId);
}

export function resolveDetailVideoFeedNavigate(
  postIds: readonly string[],
  activePostId: string,
  direction: "prev" | "next",
): { nextPostId: string | null; atLastShouldLoadMore: boolean } {
  const idx = detailVideoFeedIndex(postIds, activePostId);
  if (idx < 0) return { nextPostId: null, atLastShouldLoadMore: false };
  if (direction === "prev") {
    return { nextPostId: idx > 0 ? postIds[idx - 1]! : null, atLastShouldLoadMore: false };
  }
  if (idx >= postIds.length - 1) {
    return { nextPostId: null, atLastShouldLoadMore: true };
  }
  return { nextPostId: postIds[idx + 1]!, atLastShouldLoadMore: false };
}

/** 子页（用户主页 / 我的帖子等）复用 Feed 同款视频切条 props */
export function detailVideoFeedDrawerProps(
  posts: readonly CommunityPost[],
  detailPost: CommunityPost | null,
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>,
  options?: {
    hasMore?: boolean;
    onLoadMore?: () => void;
    loadingMore?: boolean;
  },
): Pick<
  PostDetailDrawerProps,
  "videoFeedPostIds" | "onVideoFeedSelect" | "onVideoFeedLoadMore" | "videoFeedLoadingMore"
> {
  const ids = detailFeedPostIdsFromPosts(posts);
  if (detailPost == null || ids.length < 2 || !ids.includes(detailPost.id)) {
    return {};
  }
  return {
    videoFeedPostIds: ids,
    onVideoFeedSelect: (postId: string) => {
      const p = posts.find((x) => x.id === postId);
      if (p) setDetailPost(p);
    },
    onVideoFeedLoadMore: options?.hasMore ? options.onLoadMore : undefined,
    videoFeedLoadingMore: options?.loadingMore,
  };
}
