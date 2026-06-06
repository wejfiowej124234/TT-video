"use client";

import type { FormEvent } from "react";
import {
  communityAmberPillFocus,
  communityCyanPillFocus,
} from "@/lib/communityA11yFocus";
import type { CommunityConversationPageViewModel } from "./useCommunityConversationPage";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type Props = Pick<
  CommunityConversationPageViewModel,
  | "t"
  | "showcaseReadonly"
  | "dmBodyFieldError"
  | "setDmBodyFieldError"
  | "dmBodyErrorNoticeId"
  | "sendIssue"
  | "setSendIssue"
  | "dmSendErrorNoticeId"
  | "handleSend"
  | "isLoggedIn"
  | "sending"
  | "inputValue"
  | "setInputValue"
>;

export function CommunityConversationPageComposer({
  t,
  showcaseReadonly,
  dmBodyFieldError,
  setDmBodyFieldError,
  dmBodyErrorNoticeId,
  sendIssue,
  setSendIssue,
  dmSendErrorNoticeId,
  handleSend,
  isLoggedIn,
  sending,
  inputValue,
  setInputValue,
}: Props) {
  return (
    <div className="flex shrink-0 flex-col border-t border-ref-sun/22 bg-ink-900/90 p-3 safe-area-inset-b">
      {showcaseReadonly ? (
        <p
          className="mb-2 rounded-[var(--radius-md)] border border-ref-sun/28 bg-ref-sun/10 px-3 py-2 text-meta text-ref-sun/95"
          role="status"
        >
          {t("community_showcase_dm_readonly")}
        </p>
      ) : null}
      {dmBodyFieldError ? (
        <div
          id={dmBodyErrorNoticeId}
          className="mb-2 rounded-[var(--radius-md)] border border-danger/50 bg-danger/10 px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-meta text-danger/95 min-w-0 flex-1">{dmBodyFieldError}</p>
          <form
            className="inline shrink-0 self-end sm:self-auto"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setDmBodyFieldError(null);
            }}
          >
            <button
              type="submit"
              aria-label={t("common_closeAlert")}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-3 text-meta font-medium text-danger/95 hover:bg-danger/20 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
            >
              {t("common_closeAlert")}
            </button>
          </form>
        </div>
      ) : sendIssue ? (
        <div
          id={dmSendErrorNoticeId}
          className="mb-2 rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-meta text-warning/95 min-w-0 flex-1">
            {sendIssue.kind === "detail" ? sendIssue.text : t("community_messages_sendFailed")}
          </p>
          <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end self-end sm:self-auto">
            <form
              className="inline shrink-0"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setSendIssue(null);
              }}
            >
              <button
                type="submit"
                aria-label={t("common_closeAlert")}
                className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-2 py-1 text-meta font-medium text-warning/95 hover:bg-warning/20 motion-sub ${communityAmberPillFocus}`}
              >
                {t("common_closeAlert")}
              </button>
            </form>
            <form
              className="inline shrink-0"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <button
                type="submit"
                disabled={!isLoggedIn || sending || !inputValue.trim()}
                aria-label={t("common_retry")}
                className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-2 py-1 text-meta font-medium text-ref-sun hover:bg-ref-sun/15 motion-sub disabled:opacity-50 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <form
        className="flex gap-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (sendIssue) setSendIssue(null);
            if (dmBodyFieldError) setDmBodyFieldError(null);
          }}
          placeholder={isLoggedIn ? t("community_chat_placeholder") : t("community_login_to_chat")}
          disabled={!isLoggedIn || sending || showcaseReadonly}
          aria-busy={sending ? true : undefined}
          className={
            "flex-1 rounded-[var(--radius-md)] border bg-ink-800 px-3 py-2 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:opacity-60 disabled:cursor-not-allowed " +
            (dmBodyFieldError
              ? "border-danger/60 focus-visible:ring-danger/50"
              : "border-ref-sun/32 focus-visible:ring-ref-sun/50")
          }
          aria-invalid={sendIssue != null || dmBodyFieldError != null}
          aria-errormessage={dmBodyFieldError ? dmBodyErrorNoticeId : sendIssue ? dmSendErrorNoticeId : undefined}
        />
        <button
          type="submit"
          disabled={!isLoggedIn || sending || showcaseReadonly}
          aria-busy={sending ? true : undefined}
          className={`${TT_COMMUNITY_PAGE_L5.pill} disabled:opacity-60 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
        >
          {sending ? t("community_comment_sending") : t("community_comment_send")}
        </button>
      </form>
    </div>
  );
}
