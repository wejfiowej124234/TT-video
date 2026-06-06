"use client";

import { useCallback, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  postLike,
  deleteLike,
  postCollect,
  deleteCollect,
  postUserFollow,
  deleteUserFollow,
} from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  engagementCollectsDeltaAfterWriteOk,
  engagementLikesDeltaAfterWriteOk,
} from "@/components/community/communityFeedMappersCounts";
import { isShowcaseAuthorId, isShowcasePostId } from "@/lib/communityShowcase";
import { persistShowcaseCollectedIds, persistShowcaseLikedIds } from "@/lib/communityShowcaseEngagementStorage";
import { persistShowcaseFollowIds } from "@/lib/communityShowcaseFollowStorage";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

/** 点赞 / 收藏 / 关注作者：乐观更新 + 失败 toast 回滚（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedLikeCollectFollow(options: {
  isLoggedIn: boolean;
  communityUserId: string | null | undefined;
  followingAuthorIdSet: Set<string>;
  setFollowingIds: Dispatch<SetStateAction<string[]>>;
  setShowLoginModal: Dispatch<SetStateAction<boolean>>;
  setToast: Dispatch<SetStateAction<string | null>>;
  setToastBodyOverride: Dispatch<SetStateAction<string | null>>;
  setToastHint: Dispatch<SetStateAction<string | null>>;
  scheduleToastClear: (ms: number) => void;
  likedPostIds: Set<string>;
  setLikedPostIds: Dispatch<SetStateAction<Set<string>>>;
  collectedPostIds: Set<string>;
  setCollectedPostIds: Dispatch<SetStateAction<Set<string>>>;
  t: CommunityFeedTFunc;
  /** 点赞写回成功后同步 **`likedByMe`** / **`likes`**（列表行与详情同源，与 **`displayLikeCountFromServerAndUi`** 对拍）。 */
  onPostLikeResolved?: (postId: string, meta: { nowLiked: boolean; likesDelta: number }) => void;
  /** 收藏写回成功后同步 **`collectedByMe`** / **`collects`**。 */
  onPostCollectResolved?: (postId: string, meta: { nowCollected: boolean; collectsDelta: number }) => void;
}) {
  const {
    isLoggedIn,
    communityUserId,
    followingAuthorIdSet,
    setFollowingIds,
    setShowLoginModal,
    setToast,
    setToastBodyOverride,
    setToastHint,
    scheduleToastClear,
    likedPostIds,
    setLikedPostIds,
    collectedPostIds,
    setCollectedPostIds,
    t,
    onPostLikeResolved,
    onPostCollectResolved,
  } = options;

  const [followBusyAuthorId, setFollowBusyAuthorId] = useState<string | null>(null);
  const followBusyRef = useRef(false);

  const likedPostIdsRef = useRef(likedPostIds);
  likedPostIdsRef.current = likedPostIds;
  const collectedPostIdsRef = useRef(collectedPostIds);
  collectedPostIdsRef.current = collectedPostIds;

  const handleAuthorFollowToggle = useCallback(
    async (authorId: string) => {
      const id = authorId.trim();
      if (!id || id === communityUserId) return;
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setToastHint(null);
        setToastBodyOverride(null);
        setToast("community_interaction_offline");
        scheduleToastClear(2600);
        return;
      }
      if (followBusyRef.current) return;
      followBusyRef.current = true;
      setFollowBusyAuthorId(id);
      const wasFollowing = followingAuthorIdSet.has(id);
      if (isShowcaseAuthorId(id)) {
        setFollowingIds((prev) => {
          const next = wasFollowing ? prev.filter((x) => x !== id) : prev.includes(id) ? prev : [...prev, id];
          persistShowcaseFollowIds(new Set(next.filter(isShowcaseAuthorId)));
          return next;
        });
        followBusyRef.current = false;
        setFollowBusyAuthorId(null);
        return;
      }
      try {
        if (wasFollowing) {
          const res = await deleteUserFollow(id);
          if (res && typeof res === "object" && (res as { status?: string }).status === "ok") {
            setFollowingIds((prev) => prev.filter((x) => x !== id));
          } else {
            setToastHint(null);
            setToastBodyOverride(
              messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed"),
            );
            setToast("community_user_follow_toggleFailed");
            scheduleToastClear(3200);
          }
        } else {
          const res = await postUserFollow(id);
          if (res && typeof res === "object" && (res as { status?: string }).status === "ok") {
            setFollowingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
          } else {
            setToastHint(null);
            setToastBodyOverride(
              messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed"),
            );
            setToast("community_user_follow_toggleFailed");
            scheduleToastClear(3200);
          }
        }
      } catch (err) {
        setToastHint(null);
        setToastBodyOverride(mapApiReadError(err, t, "community_user_follow_toggleFailed"));
        setToast("community_user_follow_toggleFailed");
        scheduleToastClear(3200);
      } finally {
        followBusyRef.current = false;
        setFollowBusyAuthorId(null);
      }
    },
    [
      communityUserId,
      followingAuthorIdSet,
      isLoggedIn,
      scheduleToastClear,
      setFollowingIds,
      setShowLoginModal,
      setToast,
      setToastBodyOverride,
      setToastHint,
      t,
    ],
  );

  const handleLike = useCallback(
    async (postId: string, hint?: { serverLiked?: boolean }) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setToastHint(null);
        setToastBodyOverride(null);
        setToast("community_interaction_offline");
        scheduleToastClear(2600);
        return;
      }
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      const fromSet = likedPostIdsRef.current.has(postId);
      const s = hint?.serverLiked;
      const next =
        s === true ? false : s === false ? true : !fromSet;
      setLikedPostIds((prev) => {
        const s = new Set(prev);
        if (next) s.add(postId);
        else s.delete(postId);
        if (isShowcasePostId(postId)) persistShowcaseLikedIds(s);
        return s;
      });
      if (isShowcasePostId(postId)) {
        onPostLikeResolved?.(postId, { nowLiked: next, likesDelta: next ? 1 : -1 });
        return;
      }
      const rollbackLike = () =>
        setLikedPostIds((prev) => {
          const s = new Set(prev);
          if (next) s.delete(postId);
          else s.add(postId);
          return s;
        });
      try {
        const res = next ? await postLike(postId) : await deleteLike(postId);
        if (!res || (res as { status?: string }).status !== "ok") {
          if (typeof window !== "undefined") {
            console.error("useCommunityFeedLikeCollectFollow handleLike:", postId, res);
          }
          rollbackLike();
          setToastHint(null);
          setToastBodyOverride(messageForCommunityActionResponse(res, t, "community_like_failed"));
          setToast("community_like_failed");
          scheduleToastClear(3200);
        } else {
          const likesDelta = engagementLikesDeltaAfterWriteOk(next, res as { status?: string; created?: boolean });
          onPostLikeResolved?.(postId, { nowLiked: next, likesDelta });
        }
      } catch (e) {
        if (typeof window !== "undefined") {
          console.error("useCommunityFeedLikeCollectFollow handleLike:", postId, e);
        }
        rollbackLike();
        setToastHint(null);
        setToastBodyOverride(mapApiReadError(e, t, "community_like_failed"));
        setToast("community_like_failed");
        scheduleToastClear(3200);
      }
    },
    [
      isLoggedIn,
      scheduleToastClear,
      setLikedPostIds,
      setShowLoginModal,
      setToast,
      setToastBodyOverride,
      setToastHint,
      t,
      onPostLikeResolved,
    ],
  );

  const handleCollect = useCallback(
    async (postId: string, hint?: { serverCollected?: boolean }) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setToastHint(null);
        setToastBodyOverride(null);
        setToast("community_interaction_offline");
        scheduleToastClear(2600);
        return;
      }
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      const fromSet = collectedPostIdsRef.current.has(postId);
      const s = hint?.serverCollected;
      const next =
        s === true ? false : s === false ? true : !fromSet;
      setCollectedPostIds((prev) => {
        const s = new Set(prev);
        if (next) s.add(postId);
        else s.delete(postId);
        if (isShowcasePostId(postId)) persistShowcaseCollectedIds(s);
        return s;
      });
      if (isShowcasePostId(postId)) {
        onPostCollectResolved?.(postId, { nowCollected: next, collectsDelta: next ? 1 : -1 });
        return;
      }
      const rollbackCollect = () =>
        setCollectedPostIds((prev) => {
          const s = new Set(prev);
          if (next) s.delete(postId);
          else s.add(postId);
          return s;
        });
      try {
        const res = next ? await postCollect(postId) : await deleteCollect(postId);
        if (!res || (res as { status?: string }).status !== "ok") {
          if (typeof window !== "undefined") {
            console.error("useCommunityFeedLikeCollectFollow handleCollect:", postId, res);
          }
          rollbackCollect();
          setToastHint(null);
          setToastBodyOverride(messageForCommunityActionResponse(res, t, "community_collect_failed"));
          setToast("community_collect_failed");
          scheduleToastClear(3200);
        } else {
          const collectsDelta = engagementCollectsDeltaAfterWriteOk(
            next,
            res as { status?: string; created?: boolean },
          );
          onPostCollectResolved?.(postId, { nowCollected: next, collectsDelta });
        }
      } catch (e) {
        if (typeof window !== "undefined") {
          console.error("useCommunityFeedLikeCollectFollow handleCollect:", postId, e);
        }
        rollbackCollect();
        setToastHint(null);
        setToastBodyOverride(mapApiReadError(e, t, "community_collect_failed"));
        setToast("community_collect_failed");
        scheduleToastClear(3200);
      }
    },
    [
      isLoggedIn,
      scheduleToastClear,
      setCollectedPostIds,
      setShowLoginModal,
      setToast,
      setToastBodyOverride,
      setToastHint,
      t,
      onPostCollectResolved,
    ],
  );

  return { handleLike, handleCollect, handleAuthorFollowToggle, followBusyAuthorId };
}
