import Link from "next/link";
import { type FormEvent, useId } from "react";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { AdminFinanceTranslate } from "./adminFinancePageTypes";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_SHELL_SECONDARY_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
export type AdminFinancePageHeaderProps = {
  pageTitleId: string;
  t: AdminFinanceTranslate;
  loading: boolean;
  exporting: boolean;
  onExportSubmit: () => void;
};

export function AdminFinancePageHeader({
  pageTitleId,
  t,
  loading,
  exporting,
  onExportSubmit,
}: AdminFinancePageHeaderProps) {
  const exportCsvFormatHintId = useId();
  const financeExportSubmitFilterHintId = useId();

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_finance_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_finance_subtitle_l5")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/observability" data-tt-admin-back-observability-hub="1"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_observability_title")}
        </Link>
        <form
          className="flex max-w-sm flex-col gap-1 sm:max-w-xs sm:items-end"
          aria-label={t("admin_finance_export_csv_aria")}
          aria-describedby={`${financeExportSubmitFilterHintId} ${exportCsvFormatHintId}`}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onExportSubmit();
          }}
        >
          <p id={financeExportSubmitFilterHintId} className="text-meta text-ink-600 leading-relaxed sm:text-right">
            {t("admin_finance_export_submit_filter_hint")}
          </p>
          <button
            type="submit"
            className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} disabled:opacity-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            disabled={loading || exporting}
            aria-label={t("admin_finance_export_csv_aria")}
          >
            {exporting ? t("admin_finance_exporting") : t("admin_finance_export_csv")}
          </button>
          <p id={exportCsvFormatHintId} className="text-meta text-ink-500 sm:text-right">
            {t("admin_finance_export_csv_format_hint")}
          </p>
        </form>
        <AdminInboxQueueBackLinks />
      </div>
    </header>
  );
}
