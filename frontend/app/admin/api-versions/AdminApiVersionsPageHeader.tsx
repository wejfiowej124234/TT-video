"use client";

import Link from "next/link";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { AdminApiVersionsPageViewModel } from "./useAdminApiVersionsPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type Props = { vm: AdminApiVersionsPageViewModel };

export function AdminApiVersionsPageHeader({ vm }: Props) {
  const { t, pageTitleId } = vm;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_api_versions_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_api_versions_subtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
        <Link
          href="/admin/observability"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_observability_title")}
        </Link>
        <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
          {t("admin_api_versions_back")}
        </Link>
      </div>
    </header>
  );
}
