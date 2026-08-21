"use client";

import type { FormEvent } from "react";
import type { CommunityComment } from "@/lib/communityMockData";
import {
  communityCommentModerationPlaceholderI18nKey,
  communityCommentUseModerationPlaceholder,
} from "@/components/community/communityFeedMappers";
import {
  communityCyanPillFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import {
  CommunityCommentAuthorAvatar,
  CommunityCommentAuthorName,
} from "@/components/community/CommunityCommentAuthorAvatar";
import { CommunityCommentGuideIdentityBadge } from "@/components/community/CommunityCommentGuideIdentityBadge";
import {
  COMMUNITY_COMMENT_ACTION_REPLY_CLASS,
  COMMUNITY_COMMENT_ACTION_REPORT_CLASS,
} from "@/lib/communityCommentIdentitySortUi";

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
          <CommunityCommentGuideIdentityBadge author={c.author} t={t} />
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
                className={`${COMMUNITY_COMMENT_ACTION_REPLY_CLASS} ${communityShellTabFocus}`}
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
                className={`${COMMUNITY_COMMENT_ACTION_REPORT_CLASS} ${communityShellTabFocus}`}
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
