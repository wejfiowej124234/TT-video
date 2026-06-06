"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** 平台维护子页顶栏：任务收件箱 → 配置枢纽 → 页内操作 → 可观测枢纽。 */
export function AdminConfigPlatformBackLinks(props: {
  children?: ReactNode;
  showObservability?: boolean;
}) {
  const { children, showObservability = true } = props;
  const { t } = useTranslation();
  return (
    <>
      <AdminInboxQueueBackLinks />
      <Link href="/admin/config" className={adminPageNavLinkClass()} data-tt-admin-back-config-hub="1">
        {t("admin_config_hub_title")}
      </Link>
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
