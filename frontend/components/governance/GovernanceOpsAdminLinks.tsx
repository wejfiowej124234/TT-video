"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const linkClass = `inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`;

/**
 * 公开治理区页脚：交叉指向 Admin 财务/投影台账（须 admin RBAC；与 13-1 表 2 / 表 2-续 分层一致）。
 */
export function GovernanceOpsAdminLinks() {
  const { t } = useTranslation();
  return (
    <>
      <Link href="/admin/finance" className={linkClass}>
        {t("governance_ops_admin_finance")}
      </Link>
      <Link href="/admin/fee-router#admin-fee-router-events" className={linkClass}>
        {t("governance_ops_admin_fee_router")}
      </Link>
      <Link href="/admin/region-vault#admin-region-vault-events" className={linkClass}>
        {t("governance_ops_admin_region_vault")}
      </Link>
    </>
  );
}
