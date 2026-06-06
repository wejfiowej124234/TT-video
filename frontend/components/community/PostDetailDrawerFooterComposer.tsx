"use client";

import type { FormEvent } from "react";
import type { CommunityComment } from "@/lib/communityMockData";
import { ActionGateChecklist } from "@/components/ui/ActionGateChecklist";
import { COMMUNITY_COMMENT_SEND_I18N_FALLBACK } from "@/lib/communityDrawerCommentSend";
import {
  communityAmberPillFocus,
  communityCyanPillFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";
import {TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_DRAWER_L5} from "@/lib/marketingUi";
import { communityCommentAuthorDisplayName } from "@/lib/communityCommentAuthorUi";

export function PostDetailDrawerFooterComposer({
  t,
  isLoggedIn,
  authPending,
  sending,
  input,
  setInput,
  composerInputDisabled,
  sendDisabled,
  handleSend,
  replyTarget,
  setReplyTarget,
  commentSendError,
  commentSendErrorMessage,
  commentFieldMessages,
  onRetryComment,
  commentSendErrorNoticeId,
  commentBodyErrorNoticeId,
  commentComposerInputId,
  commentComposerGateId,
  isShowcasePost = false,
}: {
  t: (key: string) => string;
  isLoggedIn: boolean;
  authPending: boolean;
  sending: boolean;
  input: string;
  setInput: (v: string) => void;
  composerInputDisabled: boolean;
  sendDisabled: boolean;
  handleSend: () => void | Promise<void>;
  replyTarget: CommunityComment | null;
  setReplyTarget: (c: CommunityComment | null) => void;
  commentSendError?: boolean;
  commentSendErrorMessage?: string | null;
  commentFieldMessages?: Record<string, string> | null;
  onRetryComment?: () => void;
  commentSendErrorNoticeId: string;
  commentBodyErrorNoticeId: string;
  commentComposerInputId: string;
  commentComposerGateId: string;
  isShowcasePost?: boolean;
}) {
  return (
    <div className={`${TT_COMMUNITY_DRAWER_L5.postDetailComposerBar} shrink-0`}>
      {commentSendError && !commentFieldMessages?.body ? (
        <div
          id={commentSendErrorNoticeId}
          className="mb-2 rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 flex items-center justify-between gap-2"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-meta text-warning/95">
            {commentSendErrorMessage?.trim() ? commentSendErrorMessage : t(COMMUNITY_COMMENT_SEND_I18N_FALLBACK)}
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
        <div
          id={commentBodyErrorNoticeId}
          className="mb-2 rounded-[var(--radius-md)] border border-danger/50 bg-danger/10 px-3 py-2 flex items-center justify-between gap-2"
          role="alert"
          aria-live="assertive"
        >
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
      {replyTarget ? (
        <div className={`${TT_COMMUNITY_DRAWER_L5.postDetailReplyBanner}`}>
          <p className="text-meta text-slate-300 min-w-0">
            {t("community_comment_replying_to").replace(
              "{{name}}",
              communityCommentAuthorDisplayName(replyTarget.author, {
                dash: t("ui_em_dash"),
                guestLabel: t("community_comment_guest_author"),
              }),
            )}
          </p>
          <button
            type="button"
            onClick={() => setReplyTarget(null)}
            className={`shrink-0 ${TT_COMMUNITY_FEED_ACTION.asideGhostPill} motion-sub min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus}`}
          >
            {t("community_comment_cancel_reply")}
          </button>
        </div>
      ) : null}
      {isLoggedIn && !authPending && !input.trim() && !sending && !isShowcasePost ? (
        <ActionGateChecklist
          id={commentComposerGateId}
          variant="communityInline"
          itemKeys={["action_gate_comment_body_empty"]}
          t={t}
        />
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
          data-testid="community-post-detail-composer-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (commentSendError) onRetryComment?.();
          }}
          placeholder={
            authPending
              ? t("common_loading")
              : !isLoggedIn && !isShowcasePost
                ? t("community_login_to_comment")
                : replyTarget
                  ? t("community_comment_reply_placeholder")
                  : isShowcasePost
                    ? t("community_showcase_comment_placeholder")
                    : t("community_comment_placeholder")
          }
          disabled={composerInputDisabled}
          aria-busy={sending || authPending ? true : undefined}
          className={
            `${TT_COMMUNITY_DRAWER_L5.postDetailComposerInput} ` +
            (commentFieldMessages?.body
              ? "border-danger/60 focus-visible:ring-danger/50"
              : isShowcasePost
                ? `${TT_COMMUNITY_DRAWER_L5.composerInput} ${TT_COMMUNITY_DRAWER_L5.composerInputShowcase}`
                : TT_COMMUNITY_DRAWER_L5.composerInput)
          }
          aria-label={
            isShowcasePost && !replyTarget
              ? t("community_showcase_comment_placeholder")
              : t("community_comment_placeholder")
          }
          aria-invalid={commentSendError ?? false}
          aria-describedby={
            [
              isLoggedIn && !authPending && !input.trim() && !sending && !isShowcasePost
                ? commentComposerGateId
                : null,
              commentSendError
                ? commentFieldMessages?.body
                  ? commentBodyErrorNoticeId
                  : commentSendErrorNoticeId
                : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-errormessage={
            commentSendError
              ? commentFieldMessages?.body
                ? commentBodyErrorNoticeId
                : commentSendErrorNoticeId
              : undefined
          }
        />
        <button
          type="submit"
          disabled={sendDisabled}
          aria-busy={sending || authPending ? true : undefined}
          aria-describedby={isLoggedIn && !authPending && !input.trim() && !sending && !isShowcasePost ? commentComposerGateId : undefined}
          title={
            sendDisabled && isLoggedIn && !authPending && !sending && !input.trim() && !isShowcasePost
              ? t("action_gate_comment_body_empty")
              : undefined
          }
          className={`${TT_COMMUNITY_DRAWER_L5.sendBtn} ${communityCyanPillFocus}`}
          aria-label={t("community_comment_send")}
        >
          {sending ? t("community_comment_sending") : t("community_comment_send")}
        </button>
      </form>
    </div>
  );
}
