"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityCommentSort } from "@/lib/apiClient/community";

/**
 * 社区 Feed：评论/详情/发帖/视频/登录 Toast 与深链等 UI 层状态（从 `useCommunityFeed` 拆出，行为同源）。
 */
export function useCommunityFeedModals() {
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [detailFocusComments, setDetailFocusComments] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastBodyOverride, setToastBodyOverride] = useState<string | null>(null);
  const [toastHint, setToastHint] = useState<string | null>(null);
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const [publishSendFailed, setPublishSendFailed] = useState(false);
  const [publishErrorMessage, setPublishErrorMessage] = useState<string | null>(null);
  const [publishFieldMessages, setPublishFieldMessages] = useState<Record<string, string> | null>(null);
  const [postDeepLinkBusy, setPostDeepLinkBusy] = useState(false);
  const [postDeepLinkAlert, setPostDeepLinkAlert] = useState<
    null | { kind: "unavailable" } | { kind: "load_failed"; message: string }
  >(null);
  const [postDeepLinkLastId, setPostDeepLinkLastId] = useState<string | null>(null);
  const [, setFocusReturnTarget] = useState<HTMLElement | null>(null);
  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  const focusReturnTargetRef = useRef<HTMLElement | null>(null);
  const loginBackButtonRef = useRef<HTMLButtonElement>(null);

  const scheduleToastClear = useCallback((ms: number) => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      setToast(null);
      setToastHint(null);
      setToastBodyOverride(null);
    }, ms);
  }, []);

  const setFocusReturn = useCallback((el: HTMLElement | null) => {
    setFocusReturnTarget(el);
    focusReturnTargetRef.current = el;
  }, []);

  useEffect(() => {
    if (!showLoginModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    loginBackButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLoginModal]);

  return {
    commentPost,
    setCommentPost,
    detailPost,
    setDetailPost,
    detailFocusComments,
    setDetailFocusComments,
    publishOpen,
    setPublishOpen,
    showLoginModal,
    setShowLoginModal,
    toast,
    setToast,
    toastBodyOverride,
    setToastBodyOverride,
    toastHint,
    setToastHint,
    commentSendFailed,
    setCommentSendFailed,
    commentSendErrorMessage,
    setCommentSendErrorMessage,
    commentFieldMessages,
    setCommentFieldMessages,
    commentsRetryTick,
    setCommentsRetryTick,
    commentSort,
    setCommentSort,
    publishSendFailed,
    setPublishSendFailed,
    publishErrorMessage,
    setPublishErrorMessage,
    publishFieldMessages,
    setPublishFieldMessages,
    postDeepLinkBusy,
    setPostDeepLinkBusy,
    postDeepLinkAlert,
    setPostDeepLinkAlert,
    postDeepLinkLastId,
    setPostDeepLinkLastId,
    reportSuccessId,
    setReportSuccessId,
    focusReturnTargetRef,
    loginBackButtonRef,
    scheduleToastClear,
    setFocusReturn,
  };
}
