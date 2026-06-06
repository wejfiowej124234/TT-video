"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AdminFinanceSuiteBackLinks } from "@/components/admin/AdminFinanceSuiteBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** 资金/争议子域顶栏：财务七件套回链 → 页内操作 → 可观测枢纽。 */
export function AdminFinanceSectionBackLinks(props: {
  showWorkspace?: boolean;
  showObservability?: boolean;
  children?: ReactNode;
}) {
  const { showWorkspace, showObservability = true, children } = props;
  const { t } = useTranslation();

  return (
    <>
      <AdminFinanceSuiteBackLinks showWorkspace={showWorkspace} />
      {children}
      {showObservability ? (
        <Link
          href="/admin/observability"
          className={adminPageNavLinkClass()}
          data-tt-admin-back-observability-hub="1"
        >
          {t("admin_observability_title")}
        </Link>
      ) : null}
    </>
  );
}
