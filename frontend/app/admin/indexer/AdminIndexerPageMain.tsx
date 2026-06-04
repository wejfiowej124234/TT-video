"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminIndexerHealthPanel } from "./AdminIndexerHealthPanel";
import { AdminIndexerOpsHintCard } from "./AdminIndexerOpsHintCard";
import { AdminIndexerReconcileJumpSection } from "./AdminIndexerReconcileJumpSection";
import { useAdminIndexerPage } from "./useAdminIndexerPage";
import { ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 70 / 04 §3.5：索引器健康只读（须 admin）。 */
export function AdminIndexerPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const opsHintId = useId();
  const indexerHeaderToolsFilterHintId = useId();
  const indexerReconcileOpenFilterHintId = useId();
  const router = useRouter();
  const [reconcileId, setReconcileId] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const { loading, error, health, meta } = useAdminIndexerPage(refreshTick);

  const onRefreshSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRefreshTick((n) => n + 1);
  };

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_indexer_title")}
      subtitle={t("admin_indexer_subtitle")}
      headerAside={
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:items-end">
          <p id={indexerHeaderToolsFilterHintId} className="max-w-xl text-meta text-ink-600 sm:text-end">
            {t("admin_indexer_header_tools_filter_hint")}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <form className="inline" aria-describedby={indexerHeaderToolsFilterHintId} onSubmit={onRefreshSubmit}>
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
            <Link href="/admin/observability" className={`${adminPageNavLinkClass()}`}>
              {t("admin_observability_title")}
            </Link>
            <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
              {t("admin_indexer_back")}
            </Link>
          </div>
        </div>
      }
    >
      <AdminAuditCompareLinks />

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminIndexerHealthPanel loading={loading} error={error} health={health} />

      <AdminIndexerOpsHintCard opsHintId={opsHintId} />

      <AdminIndexerReconcileJumpSection
        indexerReconcileOpenFilterHintId={indexerReconcileOpenFilterHintId}
        reconcileId={reconcileId}
        setReconcileId={setReconcileId}
        onOpenReport={(id) => router.push(`/admin/indexer/reconcile/${encodeURIComponent(id)}`)}
      />
    </AdminDetailPageChrome>
  );
}
