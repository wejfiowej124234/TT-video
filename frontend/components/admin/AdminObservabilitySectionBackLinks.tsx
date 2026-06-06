"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** 可观测子域顶栏：任务收件箱 → 页内操作 → 可观测枢纽。 */
export function AdminObservabilitySectionBackLinks({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <AdminInboxQueueBackLinks />
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
