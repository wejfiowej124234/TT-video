"use client";

import { useState, useEffect, useRef, useId, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import {
  communityAmberPillFocus,
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

const COMMENT_SORT_TABS = ["chronological", "latest", "hot"] as const satisfies readonly CommunityCommentSort[];

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
    if (!isLoggedIn || authPending || sending) return;
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

  return (
    <div
      ref={setContainerRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
    >
      {/* 顶部栏：返回 + 标题，safe-area */}
      <div className="flex shrink-0 items-center justify-between border-b border-cyan-500/30 bg-slate-900/95 px-4 py-3 safe-area-inset-t min-h-[48px]">
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
            className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/80 px-3 py-2 text-meta text-slate-300 hover:border-cyan-500/50 hover:text-cyan-100 motion-sub min-h-[44px] ${communitySlatePillFocus}`}
            aria-label={t("community_back_drawer")}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t("community_back_drawer")}</span>
          </button>
        </form>
        <h2 id={drawerTitleId} className="text-body font-semibold text-cyan-200 truncate min-w-0 flex-1 text-center px-2">
          {t("community_comments")} · {count}
        </h2>
        <div className="w-20 shrink-0" aria-hidden />
      </div>

      <p id={drawerDescId} className="sr-only">{t("community_subtitle")}</p>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {!isLoggedIn && !authPending && (
          <div className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3 py-2 text-meta text-warning/95">
            <Link
              href="/auth/login?returnUrl=/community"
              className={`inline-flex min-h-[44px] items-center justify-center hover:underline ${communityCardLinkFocus}`}
            >
              {t("community_login_to_comment")}
            </Link>
          </div>
        )}
        {commentSort != null && onCommentSortChange ? (
          <div
            role="tablist"
            aria-label={t("community_comments_sort_aria")}
            className="flex flex-wrap gap-2 pb-1 border-b border-slate-600/40"
          >
            {COMMENT_SORT_TABS.map((s) => (
              <form
                key={s}
                className="contents"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  onCommentSortChange(s);
                }}
              >
                <button
                  type="submit"
                  role="tab"
                  aria-selected={commentSort === s}
                  className={`rounded-full border px-3 py-1.5 text-meta motion-sub min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
                    commentSort === s
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
                      : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-cyan-500/40 hover:text-slate-300"
                  }`}
                >
                  {t(`community_comments_sort_${s}`)}
                </button>
              </form>
            ))}
          </div>
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
                  className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
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
            <div key={c.id} className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 p-3">
              <div className="flex gap-2">
                <div className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full overflow-hidden ring-2 ring-cyan-400/30 flex-shrink-0">
                  {c.author.avatar_url && (
                    <Image src={c.author.avatar_url} alt="" fill className="object-cover" sizes="44px" unoptimized />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <p className="text-meta text-cyan-300 font-medium">{c.author.nickname}</p>
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
                    <div key={r.id} className="mt-2 pl-2 border-l-2 border-cyan-500/30">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <p className="text-meta text-fuchsia-300 font-medium">{r.author.nickname}</p>
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
      <div className="flex shrink-0 flex-col border-t border-cyan-500/30 bg-slate-900/90 p-3 safe-area-inset-b">
        {commentSendError && !commentFieldMessages?.body ? (
          <div id={commentSendErrorNoticeId} className="mb-2 rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 flex items-center justify-between gap-2" role="alert" aria-live="assertive">
            <p className="text-meta text-warning/95">
              {commentSendErrorMessage?.trim() ? commentSendErrorMessage : t("community_comment_send_failed")}
            </p>
            {onRetryComment ? (
              <form
                className="inline shrink-0"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryComment();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("community_retry")}
                  className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-3 text-meta font-medium text-warning/95 hover:bg-warning/20 motion-sub ${communityAmberPillFocus}`}
                >
                  {t("community_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
        {commentSendError && commentFieldMessages?.body ? (
          <div id={commentBodyErrorNoticeId} className="mb-2 rounded-[var(--radius-md)] border border-danger/50 bg-danger/10 px-3 py-2 flex items-center justify-between gap-2" role="alert" aria-live="assertive">
            <p className="text-meta text-danger/95">{commentFieldMessages.body}</p>
            {onRetryComment ? (
              <form
                className="inline shrink-0"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryComment();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("community_retry")}
                  className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-3 text-meta font-medium text-danger/95 hover:bg-danger/20 motion-sub ${communityShellTabFocus}`}
                >
                  {t("community_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            type="text"
            id={commentComposerInputId}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (commentSendError) onRetryComment?.();
            }}
            placeholder={
              authPending
                ? t("common_loading")
                : isLoggedIn
                  ? t("community_comment_placeholder")
                  : t("community_login_to_comment")
            }
            disabled={!isLoggedIn || authPending || sending}
            aria-busy={sending || authPending ? true : undefined}
            className={
              "flex-1 min-w-0 rounded-[var(--radius-xl)] border bg-slate-800 px-4 py-2.5 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 " +
              (commentFieldMessages?.body
                ? "border-danger/60 focus-visible:ring-danger/50"
                : "border-cyan-500/40 focus-visible:ring-cyan-400/50")
            }
            aria-label={t("community_comment_placeholder")}
            aria-invalid={commentSendError ?? false}
            aria-errormessage={
              commentSendError ? (commentFieldMessages?.body ? commentBodyErrorNoticeId : commentSendErrorNoticeId) : undefined
            }
          />
          <button
            type="submit"
            disabled={!isLoggedIn || authPending || sending}
            aria-busy={sending || authPending ? true : undefined}
            className={`rounded-[var(--radius-xl)] border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${communityCyanPillFocus}`}
            aria-label={t("community_comment_send")}
          >
            {sending ? t("community_comment_sending") : t("community_comment_send")}
          </button>
        </form>
      </div>
    </div>
  );
}
