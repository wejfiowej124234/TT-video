"use client";

import type { CommunityMeUser } from "@/components/community/CommunityAuthContext";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import type { LocaleTranslateFn } from "@/lib/i18n";
import type { Dispatch, SetStateAction } from "react";

import { useCommunityMePageCommentSend } from "../useCommunityMePageCommentSend";

type ApiCommentsByPostId = Record<string, CommunityComment[]>;

/** 「赞过」页评论发送薄封装（`logContext: CommunityMeLikes`）。 */
export function useCommunityMeLikesPageCommentSend(
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
  return useCommunityMePageCommentSend(
    "CommunityMeLikes",
    postIdOpen,
    commentPost,
    detailPost,
    meUser,
    t,
    setApiCommentsByPostId,
    setApiPosts,
    setDetailPost,
    setCommentPost,
    setCommentsRetryTick,
  );
}
