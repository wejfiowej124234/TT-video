"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { withPostServerCommentCountBumped } from "@/components/community/communityFeedMappers";
import type { CommunityMeUser } from "@/components/community/CommunityAuthContext";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import {
  COMMUNITY_COMMENT_SEND_I18N_FALLBACK,
  COMMUNITY_COMMENT_SEND_OFFLINE,
  COMMUNITY_COMMENT_SEND_POST_NOT_OK,
  COMMUNITY_COMMENT_SEND_WRAP_FAILED,
  buildCommunityDrawerCommentRow,
  communityCommentOfflineMessage,
  postCommunityDrawerComment,
} from "@/lib/communityDrawerCommentSend";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { mapApiReadError } from "@/lib/mapApiReadError";

export type CommunityMeCommentSendLogContext = "CommunityMePosts" | "CommunityMeCollects" | "CommunityMeLikes";

type ApiCommentsByPostId = Record<string, CommunityComment[]>;

/** 「我的帖子 / 我的收藏」等 Me 子页：评论发送态与 `handleCommentSend`（`logContext` 区分埋点与日志前缀）。 */
export function useCommunityMePageCommentSend(
  logContext: CommunityMeCommentSendLogContext,
  postIdOpen: string | undefined,
  commentPost: CommunityPost | null,
  detailPost: CommunityPost | null,
  meUser: CommunityMeUser | null,
  t: LocaleTranslateFn,
  setApiCommentsByPostId: Dispatch<SetStateAction<ApiCommentsByPostId>>,
  setApiPosts: Dispatch<SetStateAction<CommunityPost[]>>,
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>,
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>,
  setCommentsRetryTick: Dispatch<SetStateAction<number>>,
) {
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);

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
          logContext,
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
          setApiCommentsByPostId((prev) => ({ ...prev, [pid]: [...(prev[pid] ?? []), row] }));
          const bumpPost = (p: CommunityPost) => (p.id === pid ? withPostServerCommentCountBumped(p) : p);
          setApiPosts((prev) => prev.map(bumpPost));
          setDetailPost((d) => (d ? bumpPost(d) : null));
          setCommentPost((c) => (c ? bumpPost(c) : null));
          setCommentsRetryTick((n) => n + 1);
          return;
        }
        const { topMessage, fieldMessages } = interpretCommunityWriteError(
          pr.body,
          t,
          COMMUNITY_COMMENT_SEND_I18N_FALLBACK,
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
            console.error(`${logContext} comment send:`, e);
          }
          setCommentSendErrorMessage(mapApiReadError(e, t, COMMUNITY_COMMENT_SEND_I18N_FALLBACK));
          setCommentFieldMessages(null);
          setCommentSendFailed(true);
        }
        throw e instanceof Error ? e : new Error(COMMUNITY_COMMENT_SEND_WRAP_FAILED);
      }
    },
    [
      logContext,
      commentPost?.id,
      detailPost?.id,
      meUser,
      t,
      setApiCommentsByPostId,
      setApiPosts,
      setDetailPost,
      setCommentPost,
      setCommentsRetryTick,
    ],
  );

  return {
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    handleCommentSend,
  };
}
