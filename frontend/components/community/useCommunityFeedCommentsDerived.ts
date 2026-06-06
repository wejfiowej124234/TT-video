"use client";

import { useCallback, useMemo, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { mergeApiCommentsWithLocalOptimistic } from "@/lib/communityCommentPagesMerge";

/** 评论抽屉上下文下的列表合并、重试 tick、切换帖子时清空发送错误（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedCommentsDerived(options: {
  commentPost: CommunityPost | null;
  detailPost: CommunityPost | null;
  localCommentsByPostId: Record<string, CommunityComment[]>;
  apiCommentsByPostId: Record<string, CommunityComment[]>;
  setCommentsRetryTick: Dispatch<SetStateAction<number>>;
  setCommentSendFailed: Dispatch<SetStateAction<boolean>>;
  setCommentSendErrorMessage: Dispatch<SetStateAction<string | null>>;
  setCommentFieldMessages: Dispatch<SetStateAction<Record<string, string> | null>>;
}) {
  const {
    commentPost,
    detailPost,
    localCommentsByPostId,
    apiCommentsByPostId,
    setCommentsRetryTick,
    setCommentSendFailed,
    setCommentSendErrorMessage,
    setCommentFieldMessages,
  } = options;

  const retryCommentsLoad = useCallback(() => {
    setCommentsRetryTick((n) => n + 1);
  }, [setCommentsRetryTick]);

  const commentsForPost = useMemo(() => {
    if (!commentPost) return [];
    const api = apiCommentsByPostId[commentPost.id] ?? [];
    const local = localCommentsByPostId[commentPost.id] ?? [];
    /** 保留 API 返回顺序（含 sort=latest|hot）；本地乐观评论附在末尾 */
    return mergeApiCommentsWithLocalOptimistic(api, local);
  }, [commentPost, localCommentsByPostId, apiCommentsByPostId]);

  const commentsForDetail = useMemo(() => {
    if (!detailPost) return [];
    const api = apiCommentsByPostId[detailPost.id] ?? [];
    const local = localCommentsByPostId[detailPost.id] ?? [];
    return mergeApiCommentsWithLocalOptimistic(api, local);
  }, [detailPost, localCommentsByPostId, apiCommentsByPostId]);

  const commentDrawerContextPostId = commentPost?.id ?? detailPost?.id;
  useEffect(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, [
    commentDrawerContextPostId,
    setCommentFieldMessages,
    setCommentSendErrorMessage,
    setCommentSendFailed,
  ]);

  return { retryCommentsLoad, commentsForPost, commentsForDetail };
}
