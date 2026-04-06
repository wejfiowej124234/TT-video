"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { postLike, deleteLike, postCollect, deleteCollect } from "@/lib/apiClient/community";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";

export type UseCommunityPostLikeCollectOptions = {
  /** 列表内帖子默认已收藏（如 `/community/me/collects`） */
  initialCollectedIds?: string[];
  /** 收藏 API 成功后回调（`nowCollected` 为操作完成后的状态） */
  onCollectResolved?: (postId: string, nowCollected: boolean) => void;
  /**
   * 与列表 API 的 `liked_by_me` / `collected_by_me` 对齐（仅对数组内帖子更新 Set，不整表清空）。
   * 用于作者页 / 我的帖子 / 收藏列表等。
   */
  postsForLikeSync?: ReadonlyArray<{
    id: string;
    likedByMe?: boolean;
    collectedByMe?: boolean;
  }>;
  /** 详情抽屉：与点赞/收藏 Set 对齐（深链拉帖等） */
  detailPostForLikeSync?: {
    id: string;
    likedByMe?: boolean;
    collectedByMe?: boolean;
  } | null;
};

/**
 * 非 Feed 页：为 `CommunityFeedCard` 提供点赞/收藏 API + 乐观更新 + 与 Feed 一致的错误 Toast。
 */
export function useCommunityPostLikeCollect(
  t: (key: string) => string,
  options?: UseCommunityPostLikeCollectOptions
) {
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [collectedIds, setCollectedIds] = useState<Set<string>>(() => new Set());
  const [toastText, setToastText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCollectResolvedRef = useRef(options?.onCollectResolved);
  onCollectResolvedRef.current = options?.onCollectResolved;

  const initialCollectedSyncKey = (options?.initialCollectedIds ?? []).join("\u0001");
  useEffect(() => {
    const ids = options?.initialCollectedIds ?? [];
    if (!ids.length) {
      setCollectedIds(new Set());
      return;
    }
    setCollectedIds(new Set(ids));
  }, [initialCollectedSyncKey]);

  const postsForLikeSync = options?.postsForLikeSync;
  const interactionSyncKey = useMemo(
    () =>
      (postsForLikeSync ?? [])
        .map(
          (p) =>
            `${p.id}:L${p.likedByMe === true ? "1" : p.likedByMe === false ? "0" : "_"}:C${p.collectedByMe === true ? "1" : p.collectedByMe === false ? "0" : "_"}`
        )
        .join("|"),
    [postsForLikeSync]
  );
  useEffect(() => {
    const posts = postsForLikeSync;
    if (!posts?.length) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      for (const p of posts) {
        if (p.likedByMe === true) next.add(p.id);
        else if (p.likedByMe === false) next.delete(p.id);
      }
      return next;
    });
    setCollectedIds((prev) => {
      const next = new Set(prev);
      for (const p of posts) {
        if (p.collectedByMe === true) next.add(p.id);
        else if (p.collectedByMe === false) next.delete(p.id);
      }
      return next;
    });
  }, [interactionSyncKey, postsForLikeSync]);

  const detailForLike = options?.detailPostForLikeSync;
  const detailInteractionKey = detailForLike
    ? `${detailForLike.id}:L${detailForLike.likedByMe === true ? "1" : detailForLike.likedByMe === false ? "0" : "_"}:C${detailForLike.collectedByMe === true ? "1" : detailForLike.collectedByMe === false ? "0" : "_"}`
    : "";
  useEffect(() => {
    if (!detailForLike) return;
    const lm = detailForLike.likedByMe;
    if (lm === true || lm === false) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (lm) next.add(detailForLike.id);
        else next.delete(detailForLike.id);
        return next;
      });
    }
    const cm = detailForLike.collectedByMe;
    if (cm === true || cm === false) {
      setCollectedIds((prev) => {
        const next = new Set(prev);
        if (cm) next.add(detailForLike.id);
        else next.delete(detailForLike.id);
        return next;
      });
    }
  }, [detailInteractionKey, detailForLike]);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastText(msg);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setToastText(null);
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const handleLike = useCallback(
    async (postId: string) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        showToast(t("community_interaction_offline"));
        return;
      }
      let willLike = false;
      setLikedIds((prev) => {
        willLike = !prev.has(postId);
        const s = new Set(prev);
        if (willLike) s.add(postId);
        else s.delete(postId);
        return s;
      });
      try {
        const res = willLike ? await postLike(postId) : await deleteLike(postId);
        if (!res || (res as { status?: string }).status !== "ok") {
          setLikedIds((prev) => {
            const s = new Set(prev);
            if (willLike) s.delete(postId);
            else s.add(postId);
            return s;
          });
          showToast(messageForCommunityActionResponse(res, t, "community_like_failed"));
        }
      } catch (err) {
        setLikedIds((prev) => {
          const s = new Set(prev);
          if (willLike) s.delete(postId);
          else s.add(postId);
          return s;
        });
        showToast(mapApiReadError(err, t, "community_like_failed"));
      }
    },
    [t, showToast]
  );

  const handleCollect = useCallback(
    async (postId: string) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        showToast(t("community_interaction_offline"));
        return;
      }
      let willCollect = false;
      setCollectedIds((prev) => {
        willCollect = !prev.has(postId);
        const s = new Set(prev);
        if (willCollect) s.add(postId);
        else s.delete(postId);
        return s;
      });
      try {
        const res = willCollect ? await postCollect(postId) : await deleteCollect(postId);
        if (!res || (res as { status?: string }).status !== "ok") {
          setCollectedIds((prev) => {
            const s = new Set(prev);
            if (willCollect) s.delete(postId);
            else s.add(postId);
            return s;
          });
          showToast(messageForCommunityActionResponse(res, t, "community_collect_failed"));
          return;
        }
        onCollectResolvedRef.current?.(postId, willCollect);
      } catch (err) {
        setCollectedIds((prev) => {
          const s = new Set(prev);
          if (willCollect) s.delete(postId);
          else s.add(postId);
          return s;
        });
        showToast(mapApiReadError(err, t, "community_collect_failed"));
      }
    },
    [t, showToast]
  );

  return { likedIds, collectedIds, handleLike, handleCollect, interactionToast: toastText };
}
