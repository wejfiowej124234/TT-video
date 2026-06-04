"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import type { ChainAlignmentHubStatus } from "@/lib/financeReconciliationDriftStrip";
import { formatApiPathDisplayValue } from "@/lib/financeReconciliationPathValue";
import type { NormalizedAdminCrossCheck, NormalizedAdminDriftSummary } from "@/lib/apiClient";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { financeReconciliationAlignmentBadgeClass } from "./adminFinanceReconciliationPageModel";
import { adminPageNavLinkClass } from "@/lib/adminUi";
type Props = {
  driftSectionId: string;
  driftSemanticNoteId: string;
  na: string;
  driftStripLoading: boolean;
  crossErr: AdminFetchErrorKind | null;
  driftSummaryErr: AdminFetchErrorKind | null;
  crossNorm: NormalizedAdminCrossCheck | null;
  driftNorm: NormalizedAdminDriftSummary | null;
  hubAlignment: ChainAlignmentHubStatus;
  driftSummaryDeltaLine: string;
  crossDriftDeltaLine: string;
};

export function AdminFinanceReconciliationDriftSection({
  driftSectionId,
  driftSemanticNoteId,
  na,
  driftStripLoading,
  crossErr,
  driftSummaryErr,
  crossNorm,
  driftNorm,
  hubAlignment,
  driftSummaryDeltaLine,
  crossDriftDeltaLine,
}: Props) {
  const { t } = useTranslation();

  function chainAlignmentLabel(s: ChainAlignmentHubStatus): string {
    if (s === "aligned") return t("admin_finance_reconciliation_chain_alignment_aligned");
    if (s === "not_aligned") return t("admin_finance_reconciliation_chain_alignment_not_aligned");
    return t("admin_finance_reconciliation_chain_alignment_unknown");
  }

  return (
    <section
      className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-soft"
      aria-labelledby={driftSectionId}
    >
      <h2 id={driftSectionId} className="text-body font-semibold text-ink-900">
        {t("admin_finance_reconciliation_drift_section_title")}
      </h2>
      <p className="mt-1 text-meta text-ink-600">{t("admin_finance_reconciliation_drift_section_hint")}</p>
      <div
        id={driftSemanticNoteId}
        className="mt-3 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/90 p-4 text-body text-ink-800"
        role="note"
      >
        <p className="font-medium text-ink-900">{t("admin_finance_reconciliation_drift_semantic_note_title")}</p>
        <p className="mt-1 text-meta text-ink-700">{t("admin_finance_reconciliation_drift_semantic_note_body")}</p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 px-3 py-2">
            <dt className="font-mono text-meta text-ink-500">data_source</dt>
            <dd className="mt-1 text-small font-medium text-ink-800">
              {t("admin_finance_reconciliation_drift_data_source_projection")}
            </dd>
          </div>
          <div className={`rounded-[var(--radius-md)] border px-3 py-2 ${financeReconciliationAlignmentBadgeClass(hubAlignment)}`}>
            <dt className="font-mono text-meta opacity-90">chain_alignment_status</dt>
            <dd className="mt-1 text-small font-semibold">{chainAlignmentLabel(hubAlignment)}</dd>
            <p className="mt-1 text-meta opacity-90">{t("admin_finance_reconciliation_chain_alignment_derived_hint")}</p>
          </div>
        </dl>
      </div>

      {driftStripLoading ? (
        <AdminListLoadingStatus message={t("admin_finance_reconciliation_drift_loading")} className="mt-4 text-body text-ink-600" />
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-ink-100 p-4">
            <h3 className="text-small font-semibold text-ink-800">
              {t("admin_finance_reconciliation_drift_from_summary_heading")}
            </h3>
            {driftSummaryErr ? (
              <AdminListFetchError className="mt-2" errorKind={driftSummaryErr} message={adminErrorUserText(driftSummaryErr, t)} />
            ) : (
              <>
                <dl className="mt-2 space-y-2 text-body">
                  <div>
                    <dt className="font-mono text-meta text-ink-500">drift-summary.drift_detected</dt>
                    <dd className="text-ink-800">{formatApiPathDisplayValue(driftNorm?.drift_detected, na)}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-meta text-ink-500">drift-summary.delta (summary)</dt>
                    <dd className="break-words text-ink-800">{driftSummaryDeltaLine}</dd>
                  </div>
                </dl>
                <Link
                  href="/admin/drift-summary"
                  className={`${touchTargetLink44Classes} mt-3 inline-flex ${adminPageNavLinkClass()}`}
                  >
                  {t("admin_finance_reconciliation_open_drift_full")}
                </Link>
              </>
            )}
          </div>
          <div className="rounded-[var(--radius-lg)] border border-ink-100 p-4">
            <h3 className="text-small font-semibold text-ink-800">
              {t("admin_finance_reconciliation_drift_from_cross_check_heading")}
            </h3>
            {crossErr ? (
              <AdminListFetchError className="mt-2" errorKind={crossErr} message={adminErrorUserText(crossErr, t)} />
            ) : (
              <>
                <dl className="mt-2 space-y-2 text-body">
                  <div>
                    <dt className="font-mono text-meta text-ink-500">cross-check.drift_summary.drift_detected</dt>
                    <dd className="text-ink-800">
                      {formatApiPathDisplayValue(crossNorm?.drift_summary?.drift_detected, na)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-meta text-ink-500">cross-check.drift_summary.delta (summary)</dt>
                    <dd className="break-words text-ink-800">{crossDriftDeltaLine}</dd>
                  </div>
                </dl>
                <Link
                  href="/admin/cross-check"
                  className={`${touchTargetLink44Classes} mt-3 inline-flex ${adminPageNavLinkClass()}`}
                >
                  {t("admin_finance_reconciliation_open_cross_check_full")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
