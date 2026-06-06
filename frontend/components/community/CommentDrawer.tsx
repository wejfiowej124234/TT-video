"use client";

import { useState, useEffect, useRef, useId, type FormEvent } from "react";
import Link from "next/link";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { isShowcasePostId } from "@/lib/communityShowcase";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import {
  communityAmberPillFocus,
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import { CommentDrawerComposer } from "@/components/community/CommentDrawerComposer";
import {
  CommunityCommentAuthorAvatar,
  CommunityCommentAuthorName,
} from "@/components/community/CommunityCommentAuthorAvatar";
import { CommunityCommentSortTabs } from "@/components/community/CommunityCommentSortTabs";

/** 31 附录：评论抽屉——一级/二级评论列表 + 发表输入；未登录时禁用发送 */
export function CommentDrawer({
  post,
  comments,
  commentCount,
  onClose,
  onSend,
  t,
  isLoggedIn = false,
  /** getMe 未完成时不展示「去登录」条，避免登录后仍占位 */
  authPending = false,
  commentSendError,
  commentSendErrorMessage,
  commentFieldMessages,
  onRetryComment,
  commentsLoadError,
  onRetryCommentsLoad,
  commentSort,
  onCommentSortChange,
  meUserId,
  onReportComment,
}: {
  post: CommunityPost;
  comments: CommunityComment[];
  commentCount?: number;
  onClose: () => void;
  onSend: (content: string) => void | Promise<void>;
  t: (key: string) => string;
  isLoggedIn?: boolean;
  authPending?: boolean;
  /** 160：不展示本人评论上的举报入口 */
  meUserId?: string | null;
  onReportComment?: (comment: CommunityComment) => void;
  /** P1：评论发送失败时由父组件传入并展示重试 */
  commentSendError?: boolean;
  /** API `message` 映射后的文案；优先于默认失败句 */
  commentSendErrorMessage?: string | null;
  commentFieldMessages?: Record<string, string> | null;
  onRetryComment?: () => void;
  /** 31 §3.2：评论列表拉取失败 */
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  /** 31 §2.2：最热/最新/时间序 */
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (s: CommunityCommentSort) => void;
}) {
  const count = commentCount ?? post.comments;
  const isShowcasePost = isShowcasePostId(post.id);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trapRef = useFocusTrap(true, onClose);
  const drawerTitleId = useId();
  const drawerDescId = useId();
  const commentSendErrorNoticeId = useId();
  const commentBodyErrorNoticeId = useId();
  const commentComposerInputId = useId();
  const commentComposerGateId = useId();
  const guestLabel = t("community_comment_guest_author");
  const dash = t("ui_em_dash");
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (id: string) => comments.filter((c) => c.parent_id === id);

  const showReport = (c: CommunityComment) =>
    Boolean(onReportComment && (!meUserId || c.author.id !== meUserId));

  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const setContainerRef = (el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  const handleSend = async () => {
    if (isShowcasePost) {
      if (authPending || sending) return;
    } else if (!isLoggedIn || authPending || sending) {
      return;
    }
    const v = input.trim();
    if (!v) return;
    setSending(true);
    const payload = v;
    setInput("");
    try {
      await Promise.resolve(onSend(payload));
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("CommentDrawer handleSend:", err);
      }
      setInput(payload);
    } finally {
      setSending(false);
    }
  };

  const composerInputDisabled = isShowcasePost
    ? authPending || sending
    : !isLoggedIn || authPending || sending;
  const sendDisabled = composerInputDisabled || !input.trim();

  return (
    <div
      ref={setContainerRef}
      className={TT_COMMUNITY_DRAWER_L5.postDetailOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
    >
      {/* 顶部栏：返回 + 标题，safe-area */}
      <div className={`flex shrink-0 items-center justify-between px-4 py-3 safe-area-inset-t min-h-[48px] ${TT_COMMUNITY_DRAWER_L5.sheetHeader} bg-ink-900/95`}>
        <form
          className="inline"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            onClose();
          }}
        >
          <button
            ref={backButtonRef}
            type="submit"
            className={`${TT_COMMUNITY_DRAWER_L5.postDetailGhostBtn} ${communitySlatePillFocus}`}
            aria-label={t("community_back_drawer")}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t("community_back_drawer")}</span>
          </button>
        </form>
        <h2 id={drawerTitleId} className="text-body font-semibold text-ref-sun truncate min-w-0 flex-1 text-center px-2">
          {t("community_comments")} · {count}
        </h2>
        <div className="w-20 shrink-0" aria-hidden />
      </div>

      <p id={drawerDescId} className="sr-only">{t("community_subtitle")}</p>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {!isLoggedIn && !authPending && !isShowcasePost ? (
          <div className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3 py-2 text-meta text-warning/95">
            <Link
              href="/auth/login?returnUrl=/community"
              className={`inline-flex min-h-[44px] items-center justify-center hover:underline ${communityCardLinkFocus}`}
            >
              {t("community_login_to_comment")}
            </Link>
          </div>
        ) : null}
        {isShowcasePost ? (
          <p className={TT_COMMUNITY_DRAWER_L5.postDetailShowcaseHint} role="note">
            {t("community_showcase_content_hint")}
          </p>
        ) : null}
        {commentSort != null && onCommentSortChange ? (
          <CommunityCommentSortTabs
            t={t}
            commentSort={commentSort}
            onCommentSortChange={onCommentSortChange}
            withDivider
          />
        ) : null}
        {commentsLoadError ? (
          <div className="space-y-2" role="alert" aria-live="polite">
            <ApiErrorAlert message={commentsLoadError} />
            {onRetryCommentsLoad ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryCommentsLoad();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("common_retry")}
                  className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCyanPillFocus}`}
                >
                  {t("common_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : rootComments.length === 0 ? (
          <p className="text-small text-slate-400 text-center py-8">{t("community_no_comments")}</p>
        ) : (
          rootComments.map((c) => (
            <div key={c.id} className={`${TT_COMMUNITY_DRAWER_L5.postDetailCommentRow} p-2.5`}>
              <div className="flex gap-2">
                <CommunityCommentAuthorAvatar author={c.author} guestLabel={guestLabel} dash={dash} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <CommunityCommentAuthorName author={c.author} guestLabel={guestLabel} dash={dash} />
                      {c.author.isEscrowGuide ? (
                        <span className="pointer-events-none rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90" aria-hidden>
                          {t("community_badge_escrow_guide")}
                        </span>
                      ) : null}
                      {(c.author.role === "guide" || c.author.isEscrowGuide) && c.author.id ? (
                        <Link href={marketHrefForCommunityUser(c.author.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                          {t("community_book_guide_cta")}
                        </Link>
                      ) : null}
                    </div>
                    {showReport(c) ? (
                      <form
                        className="contents shrink-0"
                        onSubmit={(e: FormEvent<HTMLFormElement>) => {
                          e.preventDefault();
                          onReportComment?.(c);
                        }}
                      >
                        <button
                          type="submit"
                          className={`shrink-0 text-meta text-slate-400 hover:text-slate-300 motion-sub min-h-[44px] min-w-[44px] px-1 rounded-[var(--radius-md)] inline-flex items-center justify-center ${communityShellTabFocus}`}
                        >
                          {t("community_report")}
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <p className="text-small text-slate-300 mt-0.5">{c.content}</p>
                  {getReplies(c.id).map((r) => (
                    <div key={r.id} className="mt-2 pl-2 border-l-2 border-ref-sun/25">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <CommunityCommentAuthorName author={r.author} guestLabel={guestLabel} dash={dash} />
                          {r.author.isEscrowGuide ? (
                            <span className="pointer-events-none rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90" aria-hidden>
                              {t("community_badge_escrow_guide")}
                            </span>
                          ) : null}
                          {(r.author.role === "guide" || r.author.isEscrowGuide) && r.author.id ? (
                            <Link href={marketHrefForCommunityUser(r.author.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                              {t("community_book_guide_cta")}
                            </Link>
                          ) : null}
                        </div>
                        {showReport(r) ? (
                          <form
                            className="contents shrink-0"
                            onSubmit={(e: FormEvent<HTMLFormElement>) => {
                              e.preventDefault();
                              onReportComment?.(r);
                            }}
                          >
                            <button
                              type="submit"
                              className={`shrink-0 text-meta text-slate-400 hover:text-slate-300 motion-sub min-h-[44px] min-w-[44px] px-1 rounded-[var(--radius-md)] inline-flex items-center justify-center ${communityShellTabFocus}`}
                            >
                              {t("community_report")}
                            </button>
                          </form>
                        ) : null}
                      </div>
                      <p className="text-small text-slate-300">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <CommentDrawerComposer
        t={t}
        isLoggedIn={isLoggedIn}
        authPending={authPending}
        sending={sending}
        input={input}
        setInput={setInput}
        replyTarget={null}
        setReplyTarget={() => {}}
        composerInputDisabled={composerInputDisabled}
        sendDisabled={sendDisabled}
        handleSend={handleSend}
        commentSendError={commentSendError}
        commentSendErrorMessage={commentSendErrorMessage}
        commentFieldMessages={commentFieldMessages}
        onRetryComment={onRetryComment}
        commentSendErrorNoticeId={commentSendErrorNoticeId}
        commentBodyErrorNoticeId={commentBodyErrorNoticeId}
        commentComposerInputId={commentComposerInputId}
        commentComposerGateId={commentComposerGateId}
        isShowcasePost={isShowcasePost}
      />
    </div>
  );
}
