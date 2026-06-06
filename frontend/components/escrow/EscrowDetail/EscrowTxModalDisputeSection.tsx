import { TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE } from "@/lib/marketingUi";

type TFn = (key: string) => string;

export interface EscrowTxModalDisputeSectionProps {
  t: TFn;
  isDid: boolean;
  disputeSummaryFieldId: string;
  disputeHintId: string;
  disputeErrId: string;
  disputeSummary: string;
  onDisputeSummaryChange: (value: string) => void;
  disputeFieldError: string | null;
  disputeLabelClass: string;
  disputeHintClass: string;
}

export function EscrowTxModalDisputeSection({
  t,
  isDid,
  disputeSummaryFieldId,
  disputeHintId,
  disputeErrId,
  disputeSummary,
  onDisputeSummaryChange,
  disputeFieldError,
  disputeLabelClass,
  disputeHintClass,
}: EscrowTxModalDisputeSectionProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={disputeSummaryFieldId} className={disputeLabelClass}>
        {t("escrow_disputeReasonLabel")}
      </label>
      <textarea
        id={disputeSummaryFieldId}
        rows={4}
        value={disputeSummary}
        onChange={(e) => onDisputeSummaryChange(e.target.value)}
        className={
          isDid
            ? "w-full rounded-[var(--radius-sm)] border border-slate-500/50 bg-white px-3 py-2 text-small text-ink-900 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
            : `w-full rounded-[var(--radius-sm)] border border-ink-300 bg-bg-main px-3 py-2 text-small text-ink-900 ${TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE}`
        }
        placeholder={t("escrow_disputeReasonPlaceholder")}
        aria-invalid={!!disputeFieldError}
        aria-describedby={disputeFieldError ? disputeErrId : disputeHintId}
      />
      <p id={disputeHintId} className={disputeHintClass}>
        {t("escrow_disputeReasonHashHint")}
      </p>
      {disputeFieldError && (
        <p id={disputeErrId} className="text-meta text-danger" role="alert">
          {disputeFieldError}
        </p>
      )}
    </div>
  );
}
