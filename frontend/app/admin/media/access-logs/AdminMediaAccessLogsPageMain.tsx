"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";

import { AdminMediaAccessLogsFiltersCard } from "./AdminMediaAccessLogsFiltersCard";
import { AdminMediaAccessLogsFiltersTail } from "./AdminMediaAccessLogsFiltersTail";
import { AdminMediaAccessLogsMetaNote } from "./AdminMediaAccessLogsMetaNote";
import { AdminMediaAccessLogsTableSection } from "./AdminMediaAccessLogsTableSection";
import { useAdminMediaAccessLogsPage } from "./useAdminMediaAccessLogsPage";

/** 270 / 70：`media_access_logs` 只读（须 admin + DB）。 */
export function AdminMediaAccessLogsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const actionInputId = useId();
  const objectInputId = useId();
  const actorInputId = useId();
  const tokenInputId = useId();
  const adminFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const vm = useAdminMediaAccessLogsPage();
  const { loading, refreshing, error, items, meta } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_media_access_logs_title")}
      subtitle={t("admin_media_access_logs_subtitle_l5")}
    >
      <AdminMediaAccessLogsFiltersCard
        vm={vm}
        limitInputId={limitInputId}
        actionInputId={actionInputId}
        objectInputId={objectInputId}
        actorInputId={actorInputId}
        tokenInputId={tokenInputId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminFilterHintId={adminFilterHintId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
      />
      <AdminMediaAccessLogsFiltersTail vm={vm} adminFilterHintId={adminFilterHintId} adminAppliedFiltersDescId={adminAppliedFiltersDescId} />

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_media_access_logs_loading")} />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      <AdminMediaAccessLogsMetaNote loading={loading} error={error} meta={meta} />
      <AdminMediaAccessLogsTableSection
        loading={loading}
        refreshing={refreshing}
        error={error}
        items={items}
      />
    </AdminListPageChrome>
  );
}
