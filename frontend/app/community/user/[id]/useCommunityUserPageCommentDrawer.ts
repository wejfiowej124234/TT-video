"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { useTranslation } from "@/components/LocaleProvider";
import { type CommunityCommentSort } from "@/lib/apiClient/community";
import { withPostServerCommentCountBumped } from "@/components/community/communityFeedMappers";
import { useCommunityDrawerCommentsQuery } from "@/components/community/useCommunityDrawerCommentsQuery";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  COMMUNITY_COMMENT_SEND_I18N_FALLBACK,
  COMMUNITY_COMMENT_SEND_OFFLINE,
  COMMUNITY_COMMENT_SEND_POST_NOT_OK,
  COMMUNITY_COMMENT_SEND_WRAP_FAILED,
  buildCommunityDrawerCommentRow,
  communityCommentOfflineMessage,
  postCommunityDrawerComment,
  type CommunityDrawerCommentMeUser,
} from "@/lib/communityDrawerCommentSend";

export function useCommunityUserPageCommentDrawer(opts: {
  t: ReturnType<typeof useTranslation>["t"];
  meUser: CommunityDrawerCommentMeUser;
  setUserPosts: Dispatch<SetStateAction<CommunityPost[]>>;
}) {
  const { t, meUser, setUserPosts } = opts;

  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [detailFocusComments, setDetailFocusComments] = useState(false);
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);

  const postIdOpen = commentPost?.id ?? detailPost?.id;
  const {
    apiCommentsByPostId,
    setApiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
  } = useCommunityDrawerCommentsQuery({
    postIdOpen,
    commentSort,
    commentsRetryTick,
    t,
    logContext: "CommunityUserPage",
  });

  useEffect(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, [postIdOpen]);

  const clearCommentSendError = useCallback(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, []);

  const commentsForPost = useMemo(() => {
    if (!commentPost) return [];
    return apiCommentsByPostId[commentPost.id] ?? [];
  }, [commentPost, apiCommentsByPostId]);

  const commentsForDetail = useMemo(() => {
    if (!detailPost) return [];
    return apiCommentsByPostId[detailPost.id] ?? [];
  }, [detailPost, apiCommentsByPostId]);

  const handleCommentSend = useCallback(
    async (content: string, parentId?: string) => {
      const pid = commentPost?.id ?? detailPost?.id;
      if (!pid || !content.trim()) return;
      setCommentSendFailed(false);
      setCommentSendErrorMessage(null);
      setCommentFieldMessages(null);
      const offlineMsg = communityCommentOfflineMessage(t);
      if (offlineMsg) {
        setCommentSendErrorMessage(offlineMsg);
        setCommentSendFailed(true);
        throw new Error(COMMUNITY_COMMENT_SEND_OFFLINE);
      }
      try {
        const pr = await postCommunityDrawerComment({
          postId: pid,
          content: content.trim(),
          parentId,
          logContext: "CommunityUserPage",
        });
        if (pr.ok) {
          const row: CommunityComment = buildCommunityDrawerCommentRow({
            postId: pid,
            content: content.trim(),
            parentId,
            commentId: pr.commentId,
            meUser,
            t,
          });
          setApiCommentsByPostId((prev) => ({
            ...prev,
            [pid]: [...(prev[pid] ?? []), row],
          }));
          const bumpPost = (p: CommunityPost) => (p.id === pid ? withPostServerCommentCountBumped(p) : p);
          setUserPosts((prev) => prev.map(bumpPost));
          setDetailPost((d) => (d ? bumpPost(d) : null));
          setCommentPost((c) => (c ? bumpPost(c) : null));
          setCommentsRetryTick((n) => n + 1);
          return;
        }
        const { topMessage, fieldMessages } = interpretCommunityWriteError(
          pr.body,
          t,
          COMMUNITY_COMMENT_SEND_I18N_FALLBACK
        );
        setCommentSendErrorMessage(topMessage);
        setCommentFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
        setCommentSendFailed(true);
        throw new Error(COMMUNITY_COMMENT_SEND_POST_NOT_OK);
      } catch (e) {
        if (e instanceof Error && e.message === COMMUNITY_COMMENT_SEND_OFFLINE) {
          throw e;
        }
        const apiRejected = e instanceof Error && e.message === COMMUNITY_COMMENT_SEND_POST_NOT_OK;
        if (!apiRejected) {
          if (typeof window !== "undefined") {
            console.error("CommunityUserPage comment send:", e);
          }
          setCommentSendErrorMessage(mapApiReadError(e, t, COMMUNITY_COMMENT_SEND_I18N_FALLBACK));
          setCommentFieldMessages(null);
          setCommentSendFailed(true);
        }
        throw e instanceof Error ? e : new Error(COMMUNITY_COMMENT_SEND_WRAP_FAILED);
      }
    },
    [
      commentPost?.id,
      detailPost?.id,
      meUser,
      t,
      setApiCommentsByPostId,
      setUserPosts,
      setDetailPost,
      setCommentPost,
      setCommentsRetryTick,
    ]
  );

  const closeWithFocusReturn = useCallback((clear: () => void) => {
    const prev = focusReturnTargetRef.current;
    focusReturnTargetRef.current = null;
    clear();
    requestAnimationFrame(() => prev?.focus());
  }, []);

  return {
    commentPost,
    setCommentPost,
    detailPost,
    setDetailPost,
    detailFocusComments,
    setDetailFocusComments,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    commentsRetryTick,
    setCommentsRetryTick,
    commentSort,
    setCommentSort,
    focusReturnTargetRef,
    apiCommentsByPostId,
    setApiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    commentsForPost,
    commentsForDetail,
    handleCommentSend,
    clearCommentSendError,
    closeWithFocusReturn,
  };
}
