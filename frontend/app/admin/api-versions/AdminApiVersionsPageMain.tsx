"use client";

import Link from "next/link";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminApiVersionsFiltersCard } from "./AdminApiVersionsFiltersCard";
import { AdminApiVersionsFiltersTail } from "./AdminApiVersionsFiltersTail";
import { AdminApiVersionsMetaNote } from "./AdminApiVersionsMetaNote";
import { AdminApiVersionsTableSection } from "./AdminApiVersionsTableSection";
import { useAdminApiVersionsPage } from "./useAdminApiVersionsPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export function AdminApiVersionsPageMain() {
  const vm = useAdminApiVersionsPage();
  const { t, loading, error, items, meta } = vm;

  return (
    <AdminListPageChrome
      titleId={vm.pageTitleId}
      title={t("admin_api_versions_title")}
      subtitle={t("admin_api_versions_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_api_versions_back")}
          </Link>
        </>
      }
    >
      <AdminApiVersionsFiltersCard vm={vm} />
      <AdminApiVersionsFiltersTail vm={vm} />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_api_versions_loading")} />
      ) : null}

      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminApiVersionsMetaNote loading={loading} error={error} meta={meta} />

      <AdminApiVersionsTableSection loading={loading} error={error} items={items} />
    </AdminListPageChrome>
  );
}
