"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  adminFinanceSuiteTruthBadge,
  adminTruthBadgeLabelKey,
} from "@/lib/admin/adminTruthBadge";
import {
  ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS,
  ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS,
  ADMIN_FIN_SUITE_STATUS_PLACEHOLDER_CLASS,
  type AdminFinanceSuiteModuleStatus,
} from "@/lib/adminUi";

type Props = {
  status: AdminFinanceSuiteModuleStatus;
  /** Batch-11 HU-401 · Snapshot/Claim Target 防假完成 */
  targetSnapshotClaim?: boolean;
};

export function AdminFinanceSuiteModuleStatusBadge({ status, targetSnapshotClaim }: Props) {
  const { t } = useTranslation();
  /** R032 · TARGET 单独成矩阵列 · 不与「部分可用」叠标冒充可开 */
  if (targetSnapshotClaim) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center rounded-[var(--radius-sm)] border border-warning/50 px-2 py-0.5 text-meta font-medium text-warning"
          data-tt-admin-fin-suite-status-badge={status}
          data-tt-admin-fin-module-target="snapshot-claim"
          data-tt-admin-truth-badge="TARGET"
        >
          {t("admin_fin_module_target_snapshot_claim")}
        </span>
      </span>
    );
  }
  const truthBadge = adminFinanceSuiteTruthBadge(status);
  const className =
    truthBadge === "REAL"
      ? ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS
      : truthBadge === "PARTIAL"
        ? ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS
        : ADMIN_FIN_SUITE_STATUS_PLACEHOLDER_CLASS;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={className}
        data-tt-admin-fin-suite-status-badge={status}
        data-tt-admin-truth-badge={truthBadge}
      >
        {t(adminTruthBadgeLabelKey(truthBadge))}
      </span>
    </span>
  );
}
