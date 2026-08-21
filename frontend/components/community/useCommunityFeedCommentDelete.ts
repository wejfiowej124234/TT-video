"use client";

import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { isCommunityOptimisticCommentId } from "@/components/community/communityFeedConstants";
import { withPostServerCommentCountDecremented } from "@/components/community/communityFeedMappers";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import {
  COMMUNITY_COMMENT_OPTIMISTIC_DELETE_FORBIDDEN,
  deleteComment,
} from "@/lib/apiClient/community";

/** 删除根评时一并移除本地缓存中的子孙回复。 */
export function filterCommentsAfterDelete(
  list: CommunityComment[],
  commentId: string,
): CommunityComment[] {
  const drop = new Set<string>([commentId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of list) {
      if (c.parent_id && drop.has(c.parent_id) && !drop.has(c.id)) {
        drop.add(c.id);
        grew = true;
      }
    }
  }
  return list.filter((c) => !drop.has(c.id));
}

export function useCommunityFeedCommentDelete(options: {
  t: (key: string) => string;
  setApiCommentsByPostId: Dispatch<SetStateAction<Record<string, CommunityComment[]>>>;
  setLocalCommentsByPostId: Dispatch<SetStateAction<Record<string, CommunityComment[]>>>;
  setApiPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setLocalPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
}) {
  const {
    t,
    setApiCommentsByPostId,
    setLocalCommentsByPostId,
    setApiPosts,
    setLocalPosts,
    setDetailPost,
    setCommentPost,
  } = options;

  const [pending, setPending] = useState<{ post: CommunityPost; comment: CommunityComment } | null>(
    null,
  );
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const applyRemovedLists = useCallback(
    (postId: string, commentId: string, removed: number) => {
      const patchLists = (prev: Record<string, CommunityComment[]>) => ({
        ...prev,
        [postId]: filterCommentsAfterDelete(prev[postId] ?? [], commentId),
      });
      setApiCommentsByPostId(patchLists);
      setLocalCommentsByPostId(patchLists);
      if (removed > 0) {
        const bump = (p: CommunityPost) =>
          p.id === postId ? withPostServerCommentCountDecremented(p, removed) : p;
        setApiPosts((prev) => prev.map(bump));
        setLocalPosts((prev) => prev.map(bump));
        setDetailPost((prev) => (prev && prev.id === postId ? bump(prev) : prev));
        setCommentPost((prev) => (prev && prev.id === postId ? bump(prev) : prev));
      }
    },
    [setApiCommentsByPostId, setApiPosts, setCommentPost, setDetailPost, setLocalCommentsByPostId, setLocalPosts],
  );

  const handleDeleteComment = useCallback(
    (post: CommunityPost, comment: CommunityComment) => {
      const commentId = comment.id;
      if (isCommunityOptimisticCommentId(commentId)) {
        setLocalCommentsByPostId((prev) => ({
          ...prev,
          [post.id]: filterCommentsAfterDelete(prev[post.id] ?? [], commentId),
        }));
        return;
      }
      setDeleteError(null);
      setPending({ post, comment });
    },
    [setLocalCommentsByPostId],
  );

  const cancelDeleteComment = useCallback(() => {
    if (confirmBusy) return;
    setPending(null);
    setDeleteError(null);
  }, [confirmBusy]);

  const confirmDeleteComment = useCallback(async () => {
    if (!pending || confirmBusy) return;
    const { post, comment } = pending;
    const postId = post.id;
    const commentId = comment.id;
    setConfirmBusy(true);
    setDeleteError(null);
    try {
      const res = await deleteComment(postId, commentId);
      const removed =
        typeof res.removed_visible_count === "number" && Number.isFinite(res.removed_visible_count)
          ? Math.max(0, Math.floor(res.removed_visible_count))
          : 1;
      applyRemovedLists(postId, commentId, removed);
      setPending(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === COMMUNITY_COMMENT_OPTIMISTIC_DELETE_FORBIDDEN) {
        setLocalCommentsByPostId((prev) => ({
          ...prev,
          [postId]: filterCommentsAfterDelete(prev[postId] ?? [], commentId),
        }));
        setPending(null);
        return;
      }
      if (typeof window !== "undefined") {
        console.error("handleDeleteComment:", err);
      }
      setDeleteError(t("community_delete_comment_failed"));
    } finally {
      setConfirmBusy(false);
    }
  }, [applyRemovedLists, confirmBusy, pending, setLocalCommentsByPostId, t]);

  return {
    handleDeleteComment,
    deleteConfirmCommentOpen: pending != null,
    deleteConfirmBusy: confirmBusy,
    deleteCommentError: deleteError,
    cancelDeleteComment,
    confirmDeleteComment,
  };
}
