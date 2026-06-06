"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import type { CommunityComment } from "@/lib/communityMockData";
import {
  communityCommentModerationPlaceholderI18nKey,
  communityCommentUseModerationPlaceholder,
} from "@/components/community/communityFeedMappers";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import {
  communityCyanPillFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import {
  CommunityCommentAuthorAvatar,
  CommunityCommentAuthorName,
} from "@/components/community/CommunityCommentAuthorAvatar";

function CommentDrawerOneCommentBody({
  c,
  t,
  guestLabel,
  dash,
  canCommentReply,
  showReportBtn,
  onReply,
  onReport,
  variant = "root",
}: {
  c: CommunityComment;
  t: (key: string) => string;
  guestLabel: string;
  dash: string;
  canCommentReply: boolean;
  showReportBtn: boolean;
  onReply: () => void;
  onReport: () => void;
  variant?: "root" | "reply";
}) {
  const bodyTextClass =
    variant === "reply" ? "text-small text-slate-300" : "text-small text-slate-300 mt-0.5";
  const modTextClass =
    variant === "reply" ? "text-small text-slate-500 italic" : "text-small text-slate-500 mt-0.5 italic";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <CommunityCommentAuthorName author={c.author} guestLabel={guestLabel} dash={dash} />
          {c.author.isEscrowGuide ? (
            <span
              className="pointer-events-none rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90"
              aria-hidden
            >
              {t("community_badge_escrow_guide")}
            </span>
          ) : null}
          {(c.author.role === "guide" || c.author.isEscrowGuide) && c.author.id ? (
            <Link href={marketHrefForCommunityUser(c.author.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
              {t("community_book_guide_cta")}
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
          {canCommentReply ? (
            <form
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onReply();
              }}
            >
              <button
                type="submit"
                className={`shrink-0 text-meta text-ref-sun/90 hover:text-ref-sun motion-sub min-h-[44px] px-2 rounded-[var(--radius-md)] inline-flex items-center justify-center ${communityShellTabFocus}`}
              >
                {t("community_comment_reply")}
              </button>
            </form>
          ) : null}
          {showReportBtn ? (
            <form
              className="contents shrink-0"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onReport();
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
      </div>
      {communityCommentUseModerationPlaceholder(c) ? (
        <p className={modTextClass}>{t(communityCommentModerationPlaceholderI18nKey(c))}</p>
      ) : (
        <p className={bodyTextClass}>{c.content}</p>
      )}
    </>
  );
}

export interface CommentDrawerCommentThreadsProps {
  t: (key: string) => string;
  comments: CommunityComment[];
  canCommentReply: boolean;
  showReport: (c: CommunityComment) => boolean;
  setReplyTarget: (c: CommunityComment) => void;
  onReportComment?: (c: CommunityComment) => void;
  commentsHasMore: boolean;
  onLoadMoreComments?: () => void | Promise<void>;
  commentsLoadMoreBusy: boolean;
}

export function CommentDrawerCommentThreads({
  t,
  comments,
  canCommentReply,
  showReport,
  setReplyTarget,
  onReportComment,
  commentsHasMore,
  onLoadMoreComments,
  commentsLoadMoreBusy,
}: CommentDrawerCommentThreadsProps) {
  const guestLabel = t("community_comment_guest_author");
  const dash = t("ui_em_dash");
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <>
      {rootComments.map((c) => (
        <div key={c.id} className={`${TT_COMMUNITY_DRAWER_L5.postDetailCommentRow} p-2.5`}>
          <div className="flex gap-2">
            <CommunityCommentAuthorAvatar author={c.author} guestLabel={guestLabel} dash={dash} />
            <div className="min-w-0 flex-1">
              <CommentDrawerOneCommentBody
                c={c}
                t={t}
                guestLabel={guestLabel}
                dash={dash}
                canCommentReply={canCommentReply}
                showReportBtn={showReport(c)}
                onReply={() => setReplyTarget(c)}
                onReport={() => onReportComment?.(c)}
              />
              {getReplies(c.id).map((r) => (
                <div key={r.id} className="mt-2 pl-2 border-l-2 border-ref-sun/25">
                  <CommentDrawerOneCommentBody
                    c={r}
                    t={t}
                    guestLabel={guestLabel}
                    dash={dash}
                    canCommentReply={canCommentReply}
                    showReportBtn={showReport(r)}
                    onReply={() => setReplyTarget(r)}
                    onReport={() => onReportComment?.(r)}
                    variant="reply"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      {commentsHasMore && onLoadMoreComments ? (
        <div className="mt-4 flex justify-center pb-2">
          <button
            type="button"
            disabled={commentsLoadMoreBusy}
            onClick={() => void onLoadMoreComments()}
            className={`${TT_COMMUNITY_DRAWER_L5.sendBtn} ${communityCyanPillFocus}`}
          >
            {commentsLoadMoreBusy ? t("common_loading") : t("community_comments_load_more")}
          </button>
        </div>
      ) : null}
    </>
  );
}
