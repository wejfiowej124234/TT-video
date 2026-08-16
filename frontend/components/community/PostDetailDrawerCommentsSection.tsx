"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { CommunityComment } from "@/lib/communityMockData";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";
import {
  communityCommentModerationPlaceholderI18nKey,
  communityCommentUseModerationPlaceholder,
} from "@/components/community/communityFeedMappers";
import { communityShowcaseEngagementCountClassName } from "@/lib/communityShowcaseEngagementUi";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import {
  CommunityCommentAuthorAvatar,
  CommunityCommentAuthorName,
} from "@/components/community/CommunityCommentAuthorAvatar";
import { CommunityCommentGuideIdentityBadge } from "@/components/community/CommunityCommentGuideIdentityBadge";
import { COMMUNITY_AUTHOR_WALLET_CLASS } from "@/lib/communityCommentAuthorUi";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";
import {
  COMMUNITY_COMMENT_ACTION_DELETE_CLASS,
  COMMUNITY_COMMENT_ACTION_REPLY_CLASS,
  COMMUNITY_COMMENT_ACTION_REPORT_CLASS,
} from "@/lib/communityCommentIdentitySortUi";

export function PostDetailDrawerCommentsSection({
  t,
  isLoggedIn,
  authPending,
  displayCommentCount,
  commentSort: _commentSort,
  onCommentSortChange: _onCommentSortChange,
  commentsLoadError,
  onRetryCommentsLoad,
  rootComments,
  getReplies,
  canCommentReply,
  setReplyTarget,
  showReportComment,
  onReportComment,
  showDeleteComment,
  onDeleteComment,
  commentsHasMore,
  onLoadMoreComments,
  commentsLoadMoreBusy,
  isShowcasePost = false,
  postId,
}: {
  t: (key: string) => string;
  isLoggedIn: boolean;
  authPending: boolean;
  displayCommentCount: number;
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (s: CommunityCommentSort) => void;
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  rootComments: CommunityComment[];
  getReplies: (id: string) => CommunityComment[];
  canCommentReply: boolean;
  setReplyTarget: (c: CommunityComment | null) => void;
  showReportComment: (c: CommunityComment) => boolean;
  onReportComment?: (comment: CommunityComment) => void;
  showDeleteComment?: (c: CommunityComment) => boolean;
  onDeleteComment?: (comment: CommunityComment) => void | Promise<void>;
  commentsHasMore?: boolean;
  onLoadMoreComments?: () => void | Promise<void>;
  commentsLoadMoreBusy?: boolean;
  isShowcasePost?: boolean;
  postId?: string;
}) {
  const guestLabel = t("community_comment_guest_author");
  const dash = t("ui_em_dash");
  const commentCountClass =
    postId != null
      ? communityShowcaseEngagementCountClassName(postId)
      : isShowcasePost
        ? "tabular-nums text-slate-500/70 font-normal"
        : "tabular-nums";
  return (
    <div className={`${TT_COMMUNITY_DRAWER_L5.postDetailSectionDivider} px-4 sm:px-5 py-4`}>
      {!isLoggedIn && !authPending && (
        <div className="mb-3 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3 py-2 text-meta text-warning/95">
          <Link
            href="/auth/login?returnUrl=/community"
            className={`inline-flex min-h-[44px] items-center justify-center hover:underline ${communityCardLinkFocus}`}
          >
            {t("community_login_to_comment")}
          </Link>
        </div>
      )}
      <h4 className="text-meta text-slate-300 mb-3">
        {t("community_comments")} · <span className={commentCountClass}>{displayCommentCount}</span>
      </h4>
      {/* R-COMM-COMMENT-IDENTITY-SORT-CONTRAST-1: no sort tabs — default hot then chrono via API */}
      {commentsLoadError ? (
        <div className="space-y-2 py-1" role="alert" aria-live="polite">
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
        <p className="text-small text-slate-400 py-2">{t("community_no_comments")}</p>
      ) : (
        <>
          <ul className="space-y-3">
            {rootComments.map((c) => (
              <li key={c.id} className={`${TT_COMMUNITY_DRAWER_L5.postDetailCommentRow} p-2.5`}>
                <div className="flex gap-2">
                  <CommunityCommentAuthorAvatar author={c.author} guestLabel={guestLabel} dash={dash} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <CommunityCommentAuthorName author={c.author} guestLabel={guestLabel} dash={dash} />
                        <CommunityCommentGuideIdentityBadge
                          author={c.author}
                          label={t("community_badge_guide")}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
                        {canCommentReply ? (
                          <form
                            className="contents"
                            onSubmit={(e: FormEvent<HTMLFormElement>) => {
                              e.preventDefault();
                              setReplyTarget(c);
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
                        {showReportComment(c) ? (
                          <form
                            className="contents shrink-0"
                            onSubmit={(e: FormEvent<HTMLFormElement>) => {
                              e.preventDefault();
                              onReportComment?.(c);
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
                        {showDeleteComment?.(c) ? (
                          <form
                            className="contents shrink-0"
                            onSubmit={(e: FormEvent<HTMLFormElement>) => {
                              e.preventDefault();
                              void onDeleteComment?.(c);
                            }}
                          >
                            <button
                              type="submit"
                              data-testid="community-comment-delete"
                              className={`${COMMUNITY_COMMENT_ACTION_DELETE_CLASS} ${communityShellTabFocus}`}
                            >
                              {t("community_delete_comment")}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                    {c.author.wallet ? (
                      <p
                        className={`${COMMUNITY_AUTHOR_WALLET_CLASS} mt-0.5`}
                        data-testid="community-comment-author-wallet"
                      >
                        {c.author.wallet}
                      </p>
                    ) : null}
                    {communityCommentUseModerationPlaceholder(c) ? (
                      <p className="text-small text-slate-500 mt-0.5 italic">
                        {t(communityCommentModerationPlaceholderI18nKey(c))}
                      </p>
                    ) : (
                      <UgcTranslatedText
                        as="p"
                        className="text-small text-slate-300 mt-0.5"
                        policy="on_demand"
                        contentClass="community_comment"
                        contentId={c.id}
                        field="body"
                        originalText={c.content}
                      />
                    )}
                    {getReplies(c.id).map((r) => (
                      <div key={r.id} className="mt-2 pl-2 border-l-2 border-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <CommunityCommentAuthorName
                              author={r.author}
                              guestLabel={guestLabel}
                              dash={dash}
                              className="text-meta text-slate-100 font-medium"
                            />
                            <CommunityCommentGuideIdentityBadge
                              author={r.author}
                              label={t("community_badge_guide")}
                            />
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
                            {canCommentReply ? (
                              <form
                                className="contents"
                                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                                  e.preventDefault();
                                  setReplyTarget(r);
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
                            {showReportComment(r) ? (
                              <form
                                className="contents shrink-0"
                                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                                  e.preventDefault();
                                  onReportComment?.(r);
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
                            {showDeleteComment?.(r) ? (
                              <form
                                className="contents shrink-0"
                                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                                  e.preventDefault();
                                  void onDeleteComment?.(r);
                                }}
                              >
                                <button
                                  type="submit"
                                  data-testid="community-comment-delete"
                                  className={`${COMMUNITY_COMMENT_ACTION_DELETE_CLASS} ${communityShellTabFocus}`}
                                >
                                  {t("community_delete_comment")}
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                        {r.author.wallet ? (
                          <p
                            className={`${COMMUNITY_AUTHOR_WALLET_CLASS} mt-0.5`}
                            data-testid="community-comment-author-wallet"
                          >
                            {r.author.wallet}
                          </p>
                        ) : null}
                        {communityCommentUseModerationPlaceholder(r) ? (
                          <p className="text-small text-slate-500 italic">
                            {t(communityCommentModerationPlaceholderI18nKey(r))}
                          </p>
                        ) : (
                          <UgcTranslatedText
                            as="p"
                            className="text-small text-slate-300"
                            policy="on_demand"
                            contentClass="community_comment"
                            contentId={r.id}
                            field="body"
                            originalText={r.content}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {commentsHasMore && onLoadMoreComments ? (
            <div className="mt-4 flex justify-center pb-1">
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
      )}
    </div>
  );
}
