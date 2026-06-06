"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { CommunityReportReasonCode } from "@/lib/apiClient/community";
import type { CommunityReportFlowContext } from "@/components/community/useCommunityPostReport";
import {
  communitySlatePillFocus,
  communityWarningPillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

const REASON_CODES = [
  "spam",
  "harassment",
  "scam",
  "illegal",
  "hate",
  "other",
] as const satisfies readonly CommunityReportReasonCode[];

function contextKey(ctx: CommunityReportFlowContext): string {
  return ctx.kind === "post" ? `post:${ctx.post.id}` : `comment:${ctx.comment.id}`;
}

/** 160 / 31：举报帖子或评论（居中 Sheet · L5） */
export function CommunityReportDrawer({
  context,
  onClose,
  onSubmit,
  t,
  reportSendFailed = false,
  reportErrorMessage,
  reportFieldMessages,
  onClearReportError,
}: {
  context: CommunityReportFlowContext;
  onClose: () => void;
  onSubmit: (reason: CommunityReportReasonCode, details: string) => void | Promise<void>;
  t: (key: string) => string;
  reportSendFailed?: boolean;
  reportErrorMessage?: string | null;
  reportFieldMessages?: Record<string, string> | null;
  onClearReportError?: () => void;
}) {
  const dash = t("ui_em_dash");
  const [reason, setReason] = useState<CommunityReportReasonCode>("spam");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [unexpectedSubmitError, setUnexpectedSubmitError] = useState<string | null>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useFocusTrap(true, onClose);
  const titleId = useId();
  const descId = useId();
  const detailsFieldId = useId();
  const detailsErrId = useId();

  const key = contextKey(context);

  useEffect(() => {
    setReason("spam");
    setDetails("");
    setUnexpectedSubmitError(null);
  }, [key]);

  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
  }, [key]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const bodyErr = reportFieldMessages?.body ?? null;

  const handleSubmit = async () => {
    if (sending) return;
    onClearReportError?.();
    setUnexpectedSubmitError(null);
    setSending(true);
    try {
      await Promise.resolve(onSubmit(reason, details));
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("CommunityReportDrawer submit:", err);
      }
      setUnexpectedSubmitError(mapApiReadError(err, t, "community_report_failed"));
    } finally {
      setSending(false);
    }
  };

  const titleKey =
    context.kind === "post" ? "community_report_dialog_title" : "community_report_dialog_title_comment";

  const postSnippet =
    context.post.content.trim().slice(0, 80) + (context.post.content.trim().length > 80 ? "…" : "");
  const commentSnippet =
    context.kind === "comment"
      ? context.comment.content.trim().slice(0, 160) + (context.comment.content.trim().length > 160 ? "…" : "")
      : "";

  return (
    <div
      data-tt-community-report-drawer="1"
      className={TT_COMMUNITY_DRAWER_L5.reportOverlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className={TT_COMMUNITY_DRAWER_L5.reportSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" aria-hidden />

        <header className="flex shrink-0 items-center gap-3 border-b border-ref-sun/18 px-4 py-3">
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              ref={backButtonRef}
              type="submit"
              className={`${TT_COMMUNITY_DRAWER_L5.postDetailGhostBtn} ${communitySlatePillFocus}`}
            >
              {t("community_report_cancel")}
            </button>
          </form>
          <h2 id={titleId} className="text-body font-semibold text-slate-100 flex-1 truncate">
            {t(titleKey)}
          </h2>
        </header>

        <div className={TT_COMMUNITY_DRAWER_L5.reportSheetScroll}>
          <div id={descId} className="rounded-[var(--radius-md)] border border-ref-sun/14 bg-ink-900/50 px-3 py-2.5 space-y-2">
            {context.kind === "comment" ? (
              <>
                <p className="text-meta text-slate-400">{t("community_report_context_post_label")}</p>
                <p className="text-small text-slate-300">{postSnippet || dash}</p>
                <p className="text-meta text-slate-400 pt-1">{t("community_report_context_comment_label")}</p>
                <p className="text-small text-slate-200">{commentSnippet || dash}</p>
              </>
            ) : (
              <p className="text-small text-slate-300">{postSnippet || dash}</p>
            )}
          </div>

          {unexpectedSubmitError ? <ApiErrorAlert message={unexpectedSubmitError} /> : null}
          {reportSendFailed && reportErrorMessage ? (
            <ApiErrorAlert message={reportErrorMessage} />
          ) : null}
          {bodyErr ? <p className="text-meta text-danger/95" role="alert">{bodyErr}</p> : null}

          <fieldset className="space-y-2">
            <legend className="text-meta font-medium text-slate-300 mb-2">{t("community_report_reason_label")}</legend>
            <div className="flex flex-col gap-2">
              {REASON_CODES.map((code) => (
                <label key={code} className={TT_COMMUNITY_DRAWER_L5.reportReasonRow}>
                  <input
                    type="radio"
                    name="community-report-reason"
                    value={code}
                    checked={reason === code}
                    onChange={() => setReason(code)}
                    className="h-4 w-4 shrink-0 accent-ref-sun"
                  />
                  <span className="text-small">{t(`community_report_reason_${code}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor={detailsFieldId} className="text-meta font-medium text-slate-300">
              {t("community_report_details_label")}
            </label>
            <textarea
              id={detailsFieldId}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={t("community_report_details_placeholder")}
              className={TT_COMMUNITY_DRAWER_L5.publishTextarea}
              aria-invalid={!!reportFieldMessages?.details}
              aria-describedby={reportFieldMessages?.details ? detailsErrId : undefined}
            />
            {reportFieldMessages?.details ? (
              <p id={detailsErrId} className="text-meta text-danger/95" role="alert">
                {reportFieldMessages.details}
              </p>
            ) : null}
          </div>
        </div>

        <footer className={TT_COMMUNITY_DRAWER_L5.reportSheetFooter}>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              type="submit"
              className={`${TT_COMMUNITY_FEED_ACTION.asideGhostPill} ${communitySlatePillFocus}`}
            >
              {t("community_report_cancel")}
            </button>
          </form>
          <form
            className="inline flex-1 sm:flex-none"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <button
              type="submit"
              disabled={sending}
              aria-busy={sending ? true : undefined}
              className={`w-full sm:w-auto rounded-full border border-warning/50 bg-warning/20 px-5 py-2.5 text-meta font-medium text-warning/95 motion-sub min-h-[44px] inline-flex items-center justify-center hover:bg-warning/30 disabled:opacity-60 ${communityWarningPillFocus}`}
            >
              {sending ? t("common_loading") : t("community_report_submit")}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
