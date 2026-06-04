"use client";

import Link from "next/link";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminConfigReleasesFiltersCard } from "./AdminConfigReleasesFiltersCard";
import { AdminConfigReleasesFiltersTail } from "./AdminConfigReleasesFiltersTail";
import { AdminConfigReleasesMetaNote } from "./AdminConfigReleasesMetaNote";
import { AdminConfigReleasesTableSection } from "./AdminConfigReleasesTableSection";
import { useAdminConfigReleasesPage } from "./useAdminConfigReleasesPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export function AdminConfigReleasesPageMain() {
  const vm = useAdminConfigReleasesPage();
  const { t, loading, error, meta } = vm;

  return (
    <AdminListPageChrome
      titleId={vm.pageTitleId}
      title={t("admin_config_releases_title")}
      subtitle={t("admin_config_releases_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_config_releases_back")}
          </Link>
        </>
      }
    >
      <AdminConfigReleasesFiltersCard vm={vm} />
      <AdminConfigReleasesFiltersTail vm={vm} />

      <AdminConfigReleasesMetaNote meta={meta} />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_config_releases_loading")} />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminConfigReleasesTableSection vm={vm} />
    </AdminListPageChrome>
  );
}
