"use client";

import { useMemo, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import {
  useCommunityPostReport,
  type UseCommunityPostReportNotify,
} from "@/components/community/useCommunityPostReport";

/** Feed 举报 Toast 与 `useCommunityPostReport`、打开评论抽屉（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedReportAndCommentDrawer(options: {
  isLoggedIn: boolean;
  t: (key: string) => string;
  setShowLoginModal: Dispatch<SetStateAction<boolean>>;
  setFocusReturn: (target: HTMLElement | null) => void;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setDetailFocusComments: Dispatch<SetStateAction<boolean>>;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setToastBodyOverride: Dispatch<SetStateAction<string | null>>;
  setToastHint: Dispatch<SetStateAction<string | null>>;
  setReportSuccessId: Dispatch<SetStateAction<string | null>>;
  setToast: Dispatch<SetStateAction<string | null>>;
  scheduleToastClear: (ms: number) => void;
}) {
  const {
    isLoggedIn,
    t,
    setShowLoginModal,
    setFocusReturn,
    setDetailPost,
    setDetailFocusComments,
    setCommentPost,
    setToastBodyOverride,
    setToastHint,
    setReportSuccessId,
    setToast,
    scheduleToastClear,
  } = options;

  const reportNotify = useMemo<UseCommunityPostReportNotify>(
    () => ({
      onSubmitted: (reportId) => {
        setToastBodyOverride(null);
        setToastHint(null);
        setReportSuccessId(reportId);
        setToast("community_report_submitted");
        scheduleToastClear(4200);
        window.setTimeout(() => setReportSuccessId(null), 4200);
      },
      onInvalidTargetId: () => {
        setToastBodyOverride(null);
        setToastHint(null);
        setToast("community_report_invalid_target_id");
        scheduleToastClear(3200);
      },
    }),
    [scheduleToastClear, setReportSuccessId, setToast, setToastBodyOverride, setToastHint],
  );

  const {
    reportContext,
    handleReport,
    handleReportComment,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
  } = useCommunityPostReport(isLoggedIn, () => setShowLoginModal(true), t, reportNotify);

  /** Feed 卡片评论/查看 → PostDetailDrawer（不再单独开 CommentDrawer） */
  const openPostDetail = useCallback(
    (p: CommunityPost, trigger?: HTMLElement | null, focusComments = false) => {
      setFocusReturn(trigger ?? null);
      setDetailFocusComments(focusComments);
      setCommentPost(null);
      setDetailPost(p);
    },
    [setFocusReturn, setDetailFocusComments, setCommentPost, setDetailPost],
  );

  return {
    reportContext,
    handleReport,
    handleReportComment,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    openPostDetail,
    /** @deprecated 与 `openPostDetail(post, trigger, true)` 同源 */
    openCommentDrawer: (p: CommunityPost, trigger?: HTMLElement | null) =>
      openPostDetail(p, trigger, true),
  };
}
