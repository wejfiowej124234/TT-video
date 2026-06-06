"use client";

import Link from "next/link";
import type { FormEvent } from "react";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
} from "@/lib/adminUi";
type AdminIndexerPageHeaderProps = {
  pageTitleId: string;
  indexerHeaderToolsFilterHintId: string;
  loading: boolean;
  onRefreshSubmit: (e: FormEvent) => void;
};

export function AdminIndexerPageHeader({
  pageTitleId,
  indexerHeaderToolsFilterHintId,
  loading,
  onRefreshSubmit,
}: AdminIndexerPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_indexer_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_indexer_subtitle_l5")}</p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:items-end">
        <p id={indexerHeaderToolsFilterHintId} className="max-w-xl text-meta text-ink-600 sm:text-end">
          {t("admin_indexer_header_tools_filter_hint")}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <form className="inline" aria-describedby={indexerHeaderToolsFilterHintId} onSubmit={onRefreshSubmit}>
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
              disabled={loading}
            >
              {t("admin_indexer_refresh")}
            </button>
          </form>
          <Link
            href="/admin/indexer/reconcile-reports"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_indexer_reconcile_reports_title")}
          </Link>
          <Link href="/admin/observability" data-tt-admin-back-observability-hub="1" className={`${adminPageNavLinkClass()}`}>
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_indexer_back")}
          </Link>
        </div>
      </div>
    </header>
  );
}
