"use client";

import Link from "next/link";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
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
      subtitle={t("admin_api_versions_subtitle_l5")}
      headerAside={
        <AdminInboxQueueBackLinks />
      }
    >
      <AdminApiVersionsFiltersCard vm={vm} />
      <AdminApiVersionsFiltersTail vm={vm} />

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_api_versions_loading")} />
      ) : null}

      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminApiVersionsMetaNote loading={loading} error={error} meta={meta} />

      {!error && (!loading || items.length > 0) ? (
        <AdminApiVersionsTableSection refreshing={vm.refreshing} items={items} />
      ) : null}
    </AdminListPageChrome>
  );
}
