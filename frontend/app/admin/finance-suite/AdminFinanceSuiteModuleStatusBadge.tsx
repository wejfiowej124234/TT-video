"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS,
  ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS,
  ADMIN_FIN_SUITE_STATUS_PLACEHOLDER_CLASS,
  type AdminFinanceSuiteModuleStatus,
} from "@/lib/adminUi";

type Props = {
  status: AdminFinanceSuiteModuleStatus;
};

export function AdminFinanceSuiteModuleStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const className =
    status === "active"
      ? ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS
      : status === "partial"
        ? ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS
        : ADMIN_FIN_SUITE_STATUS_PLACEHOLDER_CLASS;

  return (
    <span className={className} data-tt-admin-fin-suite-status-badge={status}>
      {t(`admin_fin_suite_status_${status}`)}
    </span>
  );
}
