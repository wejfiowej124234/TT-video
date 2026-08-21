"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX } from "@/components/community/communityFeedConstants";
import { withPostServerCommentCountBumped } from "@/components/community/communityFeedMappers";
import type { CommunityMeUser } from "@/components/community/CommunityAuthContext";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import {
  COMMUNITY_COMMENT_SEND_I18N_FALLBACK,
  COMMUNITY_COMMENT_SEND_OFFLINE,
  COMMUNITY_COMMENT_SEND_POST_NOT_OK,
  COMMUNITY_COMMENT_SEND_WRAP_FAILED,
  communityCommentAuthorFromMeUser,
  communityCommentOfflineMessage,
  postCommunityDrawerComment,
} from "@/lib/communityDrawerCommentSend";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { mapApiReadError } from "@/lib/mapApiReadError";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

export function useCommunityFeedCommentSend(options: {
  t: CommunityFeedTFunc;
  dash: string;
  communityUser: CommunityMeUser | null;
  setLocalCommentsByPostId: Dispatch<SetStateAction<Record<string, CommunityComment[]>>>;
  setApiPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setLocalPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setCommentsRetryTick: Dispatch<SetStateAction<number>>;
  setCommentSendFailed: Dispatch<SetStateAction<boolean>>;
  setCommentSendErrorMessage: Dispatch<SetStateAction<string | null>>;
  setCommentFieldMessages: Dispatch<SetStateAction<Record<string, string> | null>>;
}) {
  const {
    t,
    dash,
    communityUser,
    setLocalCommentsByPostId,
    setApiPosts,
    setLocalPosts,
    setDetailPost,
    setCommentPost,
    setCommentsRetryTick,
    setCommentSendFailed,
    setCommentSendErrorMessage,
    setCommentFieldMessages,
  } = options;

  const clearCommentSendError = useCallback(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, [setCommentFieldMessages, setCommentSendErrorMessage, setCommentSendFailed]);

  const handleCommentSend = useCallback(
    async (postId: string, content: string, parentId?: string) => {
      setCommentSendFailed(false);
      setCommentSendErrorMessage(null);
      setCommentFieldMessages(null);
      const offlineMsg = communityCommentOfflineMessage(t);
      if (offlineMsg) {
        setCommentSendErrorMessage(offlineMsg);
        setCommentSendFailed(true);
        throw new Error(COMMUNITY_COMMENT_SEND_OFFLINE);
      }
      const author = communityCommentAuthorFromMeUser(communityUser, dash);
      const newComment: CommunityComment = {
        id: `${COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        post_id: postId,
        author,
        content,
        parent_id: parentId,
        created_at: new Date().toISOString(),
      };
      setLocalCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), newComment],
      }));
      const rollback = () =>
        setLocalCommentsByPostId((prev) => ({
          ...prev,
          [postId]: (prev[postId] ?? []).filter((c) => c.id !== newComment.id),
        }));
      try {
        const pr = await postCommunityDrawerComment({
          postId,
          content,
          parentId,
          logContext: "useCommunityFeed",
        });
        if (pr.ok && "softDuplicate" in pr && pr.softDuplicate) {
          // 同文已在库：撤乐观行、拉真列表；勿抛错（抽屉会回填草稿导致重试死循环）
          rollback();
          setCommentsRetryTick((n) => n + 1);
          return;
        }
        if (pr.ok && "commentId" in pr) {
          setLocalCommentsByPostId((prev) => ({
            ...prev,
            [postId]: (prev[postId] ?? []).map((c) =>
              c.id === newComment.id ? { ...c, id: pr.commentId } : c,
            ),
          }));
          const bumpPost = (p: CommunityPost) =>
            p.id === postId ? withPostServerCommentCountBumped(p) : p;
          setApiPosts((prev) => prev.map(bumpPost));
          setLocalPosts((prev) => prev.map(bumpPost));
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
        rollback();
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
            console.error("useCommunityFeedCommentSend comment send:", e);
          }
          rollback();
          setCommentSendErrorMessage(mapApiReadError(e, t, COMMUNITY_COMMENT_SEND_I18N_FALLBACK));
          setCommentFieldMessages(null);
          setCommentSendFailed(true);
        }
        throw e instanceof Error ? e : new Error(COMMUNITY_COMMENT_SEND_WRAP_FAILED);
      }
    },
    [
      communityUser,
      dash,
      t,
      setApiPosts,
      setCommentFieldMessages,
      setCommentPost,
      setCommentSendErrorMessage,
      setCommentSendFailed,
      setCommentsRetryTick,
      setDetailPost,
      setLocalCommentsByPostId,
      setLocalPosts,
    ],
  );

  return { handleCommentSend, clearCommentSendError };
}
