"use client";

import Link from "next/link";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
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
  const { t, loading, error, meta, items } = vm;

  return (
    <AdminListPageChrome
      titleId={vm.pageTitleId}
      title={t("admin_config_releases_title")}
      subtitle={t("admin_config_releases_subtitle_l5")}
      headerAside={
        <AdminInboxQueueBackLinks />
      }
    >
      <AdminConfigReleasesFiltersCard vm={vm} />
      <AdminConfigReleasesFiltersTail vm={vm} />

      <AdminConfigReleasesMetaNote meta={meta} />

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_config_releases_loading")} />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminConfigReleasesTableSection vm={vm} />
    </AdminListPageChrome>
  );
}
