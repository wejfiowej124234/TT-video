"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CommunityMeUser } from "@/components/community/CommunityAuthContext";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import type { LocaleInterpolationVars } from "@/lib/i18n";

import { useCommunityFeedCommentSend } from "@/components/community/useCommunityFeedCommentSend";
import { useCommunityFeedPublishSubmit } from "@/components/community/useCommunityFeedPublishSubmit";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

/** 评论发送与发帖提交：乐观更新、错误字段、成功后刷新 Feed（子逻辑见 `useCommunityFeedCommentSend` / `useCommunityFeedPublishSubmit`）。 */
export function useCommunityFeedCommentAndPublish(options: {
  t: CommunityFeedTFunc;
  dash: string;
  communityUser: CommunityMeUser | null;
  feedApiRefetch: () => void;
  setLocalCommentsByPostId: Dispatch<SetStateAction<Record<string, CommunityComment[]>>>;
  setApiPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setLocalPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setCommentsRetryTick: Dispatch<SetStateAction<number>>;
  setCommentSendFailed: Dispatch<SetStateAction<boolean>>;
  setCommentSendErrorMessage: Dispatch<SetStateAction<string | null>>;
  setCommentFieldMessages: Dispatch<SetStateAction<Record<string, string> | null>>;
  setPublishSendFailed: Dispatch<SetStateAction<boolean>>;
  setPublishErrorMessage: Dispatch<SetStateAction<string | null>>;
  setPublishFieldMessages: Dispatch<SetStateAction<Record<string, string> | null>>;
  setToast: Dispatch<SetStateAction<string | null>>;
  setToastBodyOverride: Dispatch<SetStateAction<string | null>>;
  setToastHint: Dispatch<SetStateAction<string | null>>;
  scheduleToastClear: (ms: number) => void;
}) {
  const {
    t,
    dash,
    communityUser,
    feedApiRefetch,
    setLocalCommentsByPostId,
    setApiPosts,
    setLocalPosts,
    setDetailPost,
    setCommentPost,
    setCommentsRetryTick,
    setCommentSendFailed,
    setCommentSendErrorMessage,
    setCommentFieldMessages,
    setPublishSendFailed,
    setPublishErrorMessage,
    setPublishFieldMessages,
    setToast,
    setToastBodyOverride,
    setToastHint,
    scheduleToastClear,
  } = options;

  const { handleCommentSend, clearCommentSendError } = useCommunityFeedCommentSend({
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
  });

  const { handlePublishSubmit, clearPublishSendError } = useCommunityFeedPublishSubmit({
    t,
    dash,
    communityUser,
    feedApiRefetch,
    setLocalPosts,
    setPublishSendFailed,
    setPublishErrorMessage,
    setPublishFieldMessages,
    setToast,
    setToastBodyOverride,
    setToastHint,
    scheduleToastClear,
  });

  return {
    handleCommentSend,
    handlePublishSubmit,
    clearCommentSendError,
    clearPublishSendError,
  };
}
