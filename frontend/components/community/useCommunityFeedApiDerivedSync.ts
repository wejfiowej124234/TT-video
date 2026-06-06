"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CommunityPost } from "@/lib/communityMockData";

/** Feed/详情 API 返回的 `*_by_me` / `author_followed_by_me` 与本地 Set、关注列表对齐（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedApiDerivedSync(options: {
  isLoggedIn: boolean;
  feedFromApi: boolean;
  apiPosts: CommunityPost[];
  detailPost: CommunityPost | null;
  communityUserId: string | null | undefined;
  setLikedPostIds: Dispatch<SetStateAction<Set<string>>>;
  setCollectedPostIds: Dispatch<SetStateAction<Set<string>>>;
  setFollowingIds: Dispatch<SetStateAction<string[]>>;
}) {
  const {
    isLoggedIn,
    feedFromApi,
    apiPosts,
    detailPost,
    communityUserId,
    setLikedPostIds,
    setCollectedPostIds,
    setFollowingIds,
  } = options;

  /** Feed 行携带 `liked_by_me` 时与本地点赞 Set 对齐（刷新/翻页后心形状态正确） */
  useEffect(() => {
    if (!isLoggedIn || !feedFromApi) return;
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      for (const p of apiPosts) {
        if (p.likedByMe === true) next.add(p.id);
        else if (p.likedByMe === false) next.delete(p.id);
      }
      return next;
    });
  }, [apiPosts, feedFromApi, isLoggedIn, setLikedPostIds]);

  /** `?post=` 拉详情等：详情 JSON 含 `liked_by_me` 时同步 */
  useEffect(() => {
    if (!detailPost) return;
    const lm = detailPost.likedByMe;
    if (lm !== true && lm !== false) return;
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (lm) next.add(detailPost.id);
      else next.delete(detailPost.id);
      return next;
    });
  }, [detailPost, detailPost?.id, detailPost?.likedByMe, setLikedPostIds]);

  /** Feed 行携带 `collected_by_me` 时与本地收藏 Set 对齐（与 **`getMeCollects`** / **`LIST_LIMIT`**（100）同源互补） */
  useEffect(() => {
    if (!isLoggedIn || !feedFromApi) return;
    setCollectedPostIds((prev) => {
      const next = new Set(prev);
      for (const p of apiPosts) {
        if (p.collectedByMe === true) next.add(p.id);
        else if (p.collectedByMe === false) next.delete(p.id);
      }
      return next;
    });
  }, [apiPosts, feedFromApi, isLoggedIn, setCollectedPostIds]);

  useEffect(() => {
    if (!detailPost) return;
    const cm = detailPost.collectedByMe;
    if (cm !== true && cm !== false) return;
    setCollectedPostIds((prev) => {
      const next = new Set(prev);
      if (cm) next.add(detailPost.id);
      else next.delete(detailPost.id);
      return next;
    });
  }, [detailPost, detailPost?.id, detailPost?.collectedByMe, setCollectedPostIds]);

  /** B-076：详情 API `author_followed_by_me` 与 `followingIds`（me/following）对读，避免深链竞态 */
  useEffect(() => {
    if (!isLoggedIn || !detailPost) return;
    const aid = detailPost.author?.id?.trim();
    if (!aid || aid === communityUserId) return;
    const f = detailPost.authorFollowedByMe;
    if (f !== true && f !== false) return;
    setFollowingIds((prev) => {
      const s = new Set(prev);
      if (f === true) {
        if (s.has(aid)) return prev;
        s.add(aid);
        return [...s];
      }
      if (!s.has(aid)) return prev;
      s.delete(aid);
      return [...s];
    });
  }, [
    communityUserId,
    detailPost,
    detailPost?.author?.id,
    detailPost?.authorFollowedByMe,
    detailPost?.id,
    isLoggedIn,
    setFollowingIds,
  ]);

  /** B-076：Feed 行 `author_followed_by_me` 并入 following 集合（与 me/following 互补） */
  useEffect(() => {
    if (!isLoggedIn || !feedFromApi) return;
    setFollowingIds((prev) => {
      const s = new Set(prev);
      let changed = false;
      for (const p of apiPosts) {
        const aid = p.author?.id?.trim();
        if (!aid || aid === communityUserId) continue;
        const f = p.authorFollowedByMe;
        if (f === true) {
          if (!s.has(aid)) {
            s.add(aid);
            changed = true;
          }
        } else if (f === false) {
          if (s.has(aid)) {
            s.delete(aid);
            changed = true;
          }
        }
      }
      return changed ? [...s] : prev;
    });
  }, [apiPosts, communityUserId, feedFromApi, isLoggedIn, setFollowingIds]);
}
