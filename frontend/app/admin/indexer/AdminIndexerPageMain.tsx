"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent } from "react";

import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminIndexerHealthSnapshot } from "@/lib/admin/adminIndexerHealthSnapshot";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { INDEXER_HUB_RELATED_FOLD_LINKS } from "@/lib/admin/adminFinanceRelatedFoldLinks";

import { AdminIndexerHealthPanel } from "./AdminIndexerHealthPanel";
import { AdminIndexerOpsHintCard } from "./AdminIndexerOpsHintCard";
import { AdminIndexerReconcileJumpSection } from "./AdminIndexerReconcileJumpSection";
import { useAdminIndexerPage } from "./useAdminIndexerPage";
import { ADMIN_FOCUS_RING_CORE_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
} from "@/lib/adminUi";

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
  const { loading, refreshing, error, health, meta } = useAdminIndexerPage(refreshTick);
  const indexerSnapshot = useMemo(() => adminIndexerHealthSnapshot(health), [health]);

  const onRefreshSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRefreshTick((n) => n + 1);
  };

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_indexer_title")}
      subtitle={t("admin_indexer_subtitle_l5")}
      headerAside={<AdminFinanceSectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={INDEXER_HUB_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="indexer-hub"
      />
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <p id={indexerHeaderToolsFilterHintId} className="w-full text-meta text-ink-600 sm:text-end">
          {t("admin_indexer_header_tools_filter_hint")}
        </p>
        <form className="inline" aria-describedby={indexerHeaderToolsFilterHintId} onSubmit={onRefreshSubmit}>
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
            disabled={loading && !health}
            data-tt-admin-indexer-refresh="1"
          >
            {t("admin_indexer_refresh")}
          </button>
        </form>
      </div>
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        indexer={{
          ...indexerSnapshot,
          loading,
          error: Boolean(error),
        }}
      />
      <AdminAuditCompareLinks />

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminIndexerHealthPanel loading={loading && !health} refreshing={refreshing} error={error} health={health} />

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
