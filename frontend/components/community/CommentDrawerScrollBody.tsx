"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityComment } from "@/lib/communityMockData";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import { CommentDrawerCommentThreads } from "@/components/community/CommentDrawerCommentThreads";

export interface CommentDrawerScrollBodyProps {
  t: (key: string) => string;
  isLoggedIn: boolean;
  authPending: boolean;
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (s: CommunityCommentSort) => void;
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  comments: CommunityComment[];
  canCommentReply: boolean;
  showReport: (c: CommunityComment) => boolean;
  setReplyTarget: (c: CommunityComment) => void;
  onReportComment?: (c: CommunityComment) => void;
  commentsHasMore: boolean;
  onLoadMoreComments?: () => void | Promise<void>;
  commentsLoadMoreBusy: boolean;
}

export function CommentDrawerScrollBody({
  t,
  isLoggedIn,
  authPending,
  commentSort: _commentSort,
  onCommentSortChange: _onCommentSortChange,
  commentsLoadError,
  onRetryCommentsLoad,
  comments,
  canCommentReply,
  showReport,
  setReplyTarget,
  onReportComment,
  commentsHasMore,
  onLoadMoreComments,
  commentsLoadMoreBusy,
}: CommentDrawerScrollBodyProps) {
  const rootComments = comments.filter((c) => !c.parent_id);

  return (
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
      {/* R-COMM-COMMENT-IDENTITY-SORT-CONTRAST-1: sort tabs removed */}
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
        <CommentDrawerCommentThreads
          t={t}
          comments={comments}
          canCommentReply={canCommentReply}
          showReport={showReport}
          setReplyTarget={setReplyTarget}
          onReportComment={onReportComment}
          commentsHasMore={commentsHasMore}
          onLoadMoreComments={onLoadMoreComments}
          commentsLoadMoreBusy={commentsLoadMoreBusy}
        />
      )}
    </div>
  );
}
