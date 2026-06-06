"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** 审计子域顶栏：任务收件箱 → 审计日志列表 → 页内操作 → 可观测枢纽。 */
export function AdminAuditSectionBackLinks({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <AdminInboxQueueBackLinks />
      <Link href="/admin/audit" className={adminPageNavLinkClass()} data-tt-admin-back-audit-list="1">
        {t("admin_audit_list_title")}
      </Link>
      {children}
      <Link
        href="/admin/observability"
        className={adminPageNavLinkClass()}
        data-tt-admin-back-observability-hub="1"
      >
        {t("admin_observability_title")}
      </Link>
    </>
  );
}
