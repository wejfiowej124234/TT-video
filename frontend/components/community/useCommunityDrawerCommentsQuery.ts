"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPostComments,
  COMMUNITY_COMMENT_LIST_API_MAX,
  type CommunityCommentSort,
} from "@/lib/apiClient/community";
import type { CommunityComment } from "@/lib/communityMockData";
import { mapApiCommentToCommunityComment } from "@/components/community/communityFeedMappers";
import { mergeCommunityCommentPages } from "@/lib/communityCommentPagesMerge";
import { COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY } from "@/lib/communityDrawerCommentSend";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { isShowcasePostId } from "@/lib/communityShowcase";

/**
 * 评论抽屉 / 详情抽屉：与 **`useCommunityFeed`** 同源的首屏 + **`chronological` + cursor** 分页（①②③ 同一 GET 契约）。
 */
export function useCommunityDrawerCommentsQuery(args: {
  postIdOpen: string | null | undefined;
  commentSort: CommunityCommentSort;
  commentsRetryTick: number;
  t: (key: string) => string;
  /** `console.error` 前缀，便于区分页面 */
  logContext: string;
}) {
  const { postIdOpen, commentSort, commentsRetryTick, t, logContext } = args;

  const [apiCommentsByPostId, setApiCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [commentsLoadError, setCommentsLoadError] = useState<string | null>(null);
  const [commentsNextCursor, setCommentsNextCursor] = useState<string | null>(null);
  const [commentsLoadMoreBusy, setCommentsLoadMoreBusy] = useState(false);

  useEffect(() => {
    if (!postIdOpen) {
      setCommentsNextCursor(null);
      setCommentsLoadMoreBusy(false);
      return;
    }
    if (isShowcasePostId(postIdOpen)) {
      setApiCommentsByPostId((prev) => ({ ...prev, [postIdOpen]: [] }));
      setCommentsLoadError(null);
      setCommentsNextCursor(null);
      setCommentsLoadMoreBusy(false);
      return;
    }
    let cancelled = false;
    setCommentsLoadError(null);
    setCommentsNextCursor(null);
    setCommentsLoadMoreBusy(false);
    getPostComments(postIdOpen, {
      sort: commentSort,
      limit: COMMUNITY_COMMENT_LIST_API_MAX,
    })
      .then((data) => {
        if (cancelled) return;
        if (data?.status === "ok" && Array.isArray(data.comments)) {
          const nc =
            typeof data.next_cursor === "string" && data.next_cursor.trim().length > 0
              ? data.next_cursor.trim()
              : null;
          setApiCommentsByPostId((prev) => ({
            ...prev,
            [postIdOpen]: data.comments!.map(mapApiCommentToCommunityComment),
          }));
          setCommentsNextCursor(commentSort === "chronological" ? nc : null);
          setCommentsLoadError(null);
        } else {
          setApiCommentsByPostId((prev) => ({ ...prev, [postIdOpen]: [] }));
          setCommentsNextCursor(null);
          setCommentsLoadError(t(COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error(`${logContext} getPostComments:`, err);
        }
        setApiCommentsByPostId((prev) => ({ ...prev, [postIdOpen]: [] }));
        setCommentsNextCursor(null);
        setCommentsLoadError(mapApiReadError(err, t, COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY));
      });
    return () => {
      cancelled = true;
    };
  }, [postIdOpen, commentsRetryTick, commentSort, t, logContext]);

  const loadMoreComments = useCallback(async () => {
    const cur = commentsNextCursor;
    if (!postIdOpen || !cur || commentSort !== "chronological" || commentsLoadMoreBusy) return;
    setCommentsLoadMoreBusy(true);
    setCommentsLoadError(null);
    try {
      const data = await getPostComments(postIdOpen, {
        sort: "chronological",
        limit: COMMUNITY_COMMENT_LIST_API_MAX,
        cursor: cur,
      });
      if (data?.status === "ok" && Array.isArray(data.comments)) {
        const chunk = data.comments.map(mapApiCommentToCommunityComment);
        setApiCommentsByPostId((prev) => ({
          ...prev,
          [postIdOpen]: mergeCommunityCommentPages(prev[postIdOpen] ?? [], chunk),
        }));
        const nc =
          typeof data.next_cursor === "string" && data.next_cursor.trim().length > 0
            ? data.next_cursor.trim()
            : null;
        setCommentsNextCursor(nc);
      } else {
        setCommentsLoadError(t(COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY));
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error(`${logContext} loadMoreComments:`, err);
      }
      setCommentsLoadError(mapApiReadError(err, t, COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY));
    } finally {
      setCommentsLoadMoreBusy(false);
    }
  }, [postIdOpen, commentsNextCursor, commentSort, commentsLoadMoreBusy, t, logContext]);

  const commentsHasMore = Boolean(commentsNextCursor && commentSort === "chronological");

  return {
    apiCommentsByPostId,
    setApiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
  };
}
