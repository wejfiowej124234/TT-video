"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { postCommunityReport, type CommunityReportReasonCode } from "@/lib/apiClient/community";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import { isUuidString } from "@/lib/isUuidString";

/** 当前打开的举报目标：帖子或评论（160 §3.2） */
export type CommunityReportFlowContext =
  | { kind: "post"; post: CommunityPost }
  | { kind: "comment"; post: CommunityPost; comment: CommunityComment };

/** Feed：toast；其它页：`reportNoticeBanner` */
export type UseCommunityPostReportNotify = {
  onSubmitted?: (reportId: string) => void;
  /** 帖子/评论 id 非服务端 UUID（如 `post-local-*`） */
  onInvalidTargetId?: () => void;
};

/**
 * 160：社区举报（`POST …/community/reports`）+ 抽屉状态；支持 `post` / `comment`。
 */
export function useCommunityPostReport(
  isLoggedIn: boolean,
  onRequestLogin: () => void,
  t: (key: string) => string,
  notify?: UseCommunityPostReportNotify
) {
  const [reportContext, setReportContext] = useState<CommunityReportFlowContext | null>(null);
  const [reportSendFailed, setReportSendFailed] = useState(false);
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(null);
  const [reportFieldMessages, setReportFieldMessages] = useState<Record<string, string> | null>(null);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 非 Feed 页：提交成功后的工单 id，与 Feed `reportSuccessId` 展示对齐 */
  const [reportSuccessFollowUp, setReportSuccessFollowUp] = useState<{ reportId: string } | null>(null);
  const successFollowUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNoticeTimer = useCallback(() => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  }, []);

  const clearSuccessFollowUpTimer = useCallback(() => {
    if (successFollowUpTimerRef.current) {
      clearTimeout(successFollowUpTimerRef.current);
      successFollowUpTimerRef.current = null;
    }
  }, []);

  const flashNotice = useCallback(
    (message: string, ms: number) => {
      clearNoticeTimer();
      setNoticeBanner(message);
      noticeTimerRef.current = setTimeout(() => {
        setNoticeBanner(null);
        noticeTimerRef.current = null;
      }, ms);
    },
    [clearNoticeTimer]
  );

  useEffect(
    () => () => {
      clearNoticeTimer();
      clearSuccessFollowUpTimer();
      setReportSuccessFollowUp(null);
    },
    [clearNoticeTimer, clearSuccessFollowUpTimer]
  );

  const closeReportDrawer = useCallback(() => {
    setReportContext(null);
    setReportSendFailed(false);
    setReportErrorMessage(null);
    setReportFieldMessages(null);
  }, []);

  const clearReportSendError = useCallback(() => {
    setReportSendFailed(false);
    setReportErrorMessage(null);
    setReportFieldMessages(null);
  }, []);

  const flashInvalidTarget = useCallback(() => {
    if (notify?.onInvalidTargetId) notify.onInvalidTargetId();
    else flashNotice(t("community_report_invalid_target_id"), 3200);
  }, [notify, flashNotice, t]);

  const handleReport = useCallback(
    (post: CommunityPost) => {
      if (!isLoggedIn) {
        onRequestLogin();
        return;
      }
      if (!isUuidString(post.id)) {
        flashInvalidTarget();
        return;
      }
      setReportSendFailed(false);
      setReportErrorMessage(null);
      setReportFieldMessages(null);
      setReportContext({ kind: "post", post });
    },
    [isLoggedIn, onRequestLogin, flashInvalidTarget]
  );

  const handleReportComment = useCallback(
    (post: CommunityPost, comment: CommunityComment) => {
      if (!isLoggedIn) {
        onRequestLogin();
        return;
      }
      if (!isUuidString(comment.id)) {
        flashInvalidTarget();
        return;
      }
      setReportSendFailed(false);
      setReportErrorMessage(null);
      setReportFieldMessages(null);
      setReportContext({ kind: "comment", post, comment });
    },
    [isLoggedIn, onRequestLogin, flashInvalidTarget]
  );

  const handleReportSubmit = useCallback(
    async (reason_code: CommunityReportReasonCode, details: string) => {
      if (!reportContext) return;
      setReportSendFailed(false);
      setReportErrorMessage(null);
      setReportFieldMessages(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setReportErrorMessage(t("community_interaction_offline"));
        setReportSendFailed(true);
        return;
      }
      const target_type = reportContext.kind === "post" ? "post" : "comment";
      const target_id = reportContext.kind === "post" ? reportContext.post.id : reportContext.comment.id;
      try {
        const res = await postCommunityReport({
          target_type,
          target_id,
          reason_code,
          details: details.trim() || undefined,
        });
        if (res?.status === "ok" && res.id) {
          closeReportDrawer();
          if (notify?.onSubmitted) {
            notify.onSubmitted(res.id);
          } else {
            clearSuccessFollowUpTimer();
            setReportSuccessFollowUp({ reportId: res.id });
            successFollowUpTimerRef.current = setTimeout(() => {
              setReportSuccessFollowUp(null);
              successFollowUpTimerRef.current = null;
            }, 4200);
          }
          return;
        }
        if (typeof window !== "undefined") {
          console.error("postCommunityReport not ok:", res);
        }
        const { topMessage, fieldMessages } = interpretCommunityWriteError(
          res,
          t,
          "community_report_failed"
        );
        setReportErrorMessage(topMessage);
        setReportFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
        setReportSendFailed(true);
      } catch (e) {
        if (typeof window !== "undefined") {
          console.error("handleReportSubmit:", e);
        }
        setReportErrorMessage(t("community_report_failed"));
        setReportFieldMessages(null);
        setReportSendFailed(true);
      }
    },
    [reportContext, closeReportDrawer, notify, flashNotice, t, clearSuccessFollowUpTimer]
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
    reportNoticeBanner: noticeBanner,
    reportSuccessFollowUp,
  };
}
