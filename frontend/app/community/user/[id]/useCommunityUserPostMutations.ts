"use client";

import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { deletePost, patchPostVisibility } from "@/lib/apiClient/community";
import type {
  CommunityComment,
  CommunityPost,
  CommunityPostUserVisibility,
  CommunityPostVisibility,
} from "@/lib/communityMockData";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { useCommunityDeletePostConfirm } from "@/components/community/useCommunityDeletePostConfirm";

type TFn = (key: string) => string;

export function useCommunityUserPostMutations(options: {
  t: TFn;
  setUserPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setApiCommentsByPostId: Dispatch<SetStateAction<Record<string, CommunityComment[]>>>;
}) {
  const { t, setUserPosts, setDetailPost, setCommentPost, setApiCommentsByPostId } = options;

  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  const performDeletePost = useCallback(
    async (postId: string) => {
      setDeleteError(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setDeleteError(t("community_interaction_offline"));
        return;
      }
      setDeleteBusyId(postId);
      try {
        const delRes = await deletePost(postId);
        if (delRes?.status !== "ok") {
          setDeleteError(messageForCommunityActionResponse(delRes, t, "community_delete_post_failed"));
          return;
        }
        setUserPosts((prev) => prev.filter((p) => p.id !== postId));
        setDetailPost((d) => (d?.id === postId ? null : d));
        setCommentPost((c) => (c?.id === postId ? null : c));
        setApiCommentsByPostId((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      } catch (e) {
        setDeleteError(mapApiReadError(e, t, "community_delete_post_failed"));
      } finally {
        setDeleteBusyId(null);
      }
    },
    [t, setUserPosts, setDetailPost, setCommentPost, setApiCommentsByPostId]
  );

  const {
    deleteConfirmPostId,
    deleteConfirmBusy,
    requestDeletePost,
    cancelDeletePost,
    confirmDeletePost: confirmDeletePostAction,
  } = useCommunityDeletePostConfirm(performDeletePost);

  const confirmDeletePost = useCallback(
    (postId: string, trigger?: HTMLElement | null) => {
      requestDeletePost(postId, trigger);
    },
    [requestDeletePost],
  );

  const applyVisibilityLocal = useCallback((postId: string, next: CommunityPostVisibility) => {
    const patch = (p: CommunityPost) => (p.id === postId ? { ...p, visibilityStatus: next } : p);
    setUserPosts((prev) => prev.map(patch));
    setDetailPost((d) => (d ? patch(d) : null));
    setCommentPost((c) => (c ? patch(c) : null));
  }, [setUserPosts, setDetailPost, setCommentPost]);

  const handlePostVisibilityChange = useCallback(
    async (postId: string, next: CommunityPostUserVisibility) => {
      setVisibilityError(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setVisibilityError(t("community_interaction_offline"));
        return;
      }
      setVisibilityBusyId(postId);
      try {
        await patchPostVisibility(postId, next);
        applyVisibilityLocal(postId, next);
      } catch (e) {
        setVisibilityError(mapApiReadError(e, t, "community_post_visibility_change_failed"));
      } finally {
        setVisibilityBusyId(null);
      }
    },
    [t, applyVisibilityLocal]
  );

  return {
    deleteBusyId,
    deleteError,
    visibilityBusyId,
    visibilityError,
    confirmDeletePost,
    deleteConfirmPostId,
    deleteConfirmBusy,
    cancelDeletePost,
    confirmDeletePostAction,
    handlePostVisibilityChange,
  };
}
