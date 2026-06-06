"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_AUDIT_COMPARE_LINKS_CLASS, adminPageNavLinkClass, ADMIN_BREADCRUMB_SEPARATOR_CLASS } from "@/lib/adminUi";

/**
 * Epic C-09：在其它只读 Admin 页轻量互链至对拍 / 差异摘要；不嵌入三槽、不复用数据逻辑。
 */
export default function AdminAuditCompareLinks() {
  const { t } = useTranslation();
  const headingId = useId();
  const scopeTitle = t("admin_audit_tools_read_only_scope");

  return (
    <aside
      className={ADMIN_AUDIT_COMPARE_LINKS_CLASS}
      aria-labelledby={headingId}
      data-testid="admin-audit-compare-links"
    >
      <p id={headingId} className="font-medium text-ink-800">
        {t("admin_audit_compare_links_heading")}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href="/admin/cross-check"
          title={scopeTitle}
          className={`${adminPageNavLinkClass()} text-meta`}
        >
          {t("admin_shell_nav_cross_check")}
        </Link>
        <span className={`${ADMIN_BREADCRUMB_SEPARATOR_CLASS} select-none`} aria-hidden>
          ·
        </span>
        <Link
          href="/admin/drift-summary"
          title={scopeTitle}
          className={`${adminPageNavLinkClass()} text-meta`}
        >
          {t("admin_shell_nav_drift_summary")}
        </Link>
      </div>
    </aside>
  );
}
