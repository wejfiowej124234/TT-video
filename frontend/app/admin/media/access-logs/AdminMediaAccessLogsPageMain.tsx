"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminMediaAccessLogsFiltersCard } from "./AdminMediaAccessLogsFiltersCard";
import { AdminMediaAccessLogsFiltersTail } from "./AdminMediaAccessLogsFiltersTail";
import { AdminMediaAccessLogsMetaNote } from "./AdminMediaAccessLogsMetaNote";
import { AdminMediaAccessLogsTableSection } from "./AdminMediaAccessLogsTableSection";
import { useAdminMediaAccessLogsPage } from "./useAdminMediaAccessLogsPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

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
  const { loading, error, items, meta } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_media_access_logs_title")}
      subtitle={t("admin_media_access_logs_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin/media/signed-url-tokens"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_media_access_logs_link_tokens")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_media_access_logs_back")}
          </Link>
        </>
      }
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

      {loading ? (
        <AdminListLoadingStatus message={t("admin_media_access_logs_loading")} />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      <AdminMediaAccessLogsMetaNote loading={loading} error={error} meta={meta} />
      <AdminMediaAccessLogsTableSection loading={loading} error={error} items={items} />
    </AdminListPageChrome>
  );
}
