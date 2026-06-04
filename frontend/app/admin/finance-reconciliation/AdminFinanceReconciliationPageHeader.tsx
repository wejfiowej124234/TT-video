"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type Props = {
  pageTitleId: string;
  disclaimerId: string;
};

export function AdminFinanceReconciliationPageHeader({ pageTitleId, disclaimerId }: Props) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 max-w-full flex-1">
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_finance_reconciliation_title")}
        </h1>
        <div
          id={disclaimerId}
          className="mt-3 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/90 p-4 text-body text-ink-800"
          role="note"
        >
          {t("admin_finance_reconciliation_disclaimer")}
        </div>
        <p className="mt-3 text-body text-ink-600">{t("admin_finance_reconciliation_intro")}</p>
      </div>
      <Link
        href="/admin"
        className={`${adminPageNavLinkClass()} shrink-0`}
      >
        {t("admin_schema_back")}
      </Link>
    </header>
  );
}
