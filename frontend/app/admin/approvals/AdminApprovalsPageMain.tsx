"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

import { AdminApprovalsAppliedFiltersSection } from "./AdminApprovalsAppliedFiltersSection";
import { AdminApprovalsBatchBar } from "./AdminApprovalsBatchBar";
import { AdminApprovalsFiltersCard } from "./AdminApprovalsFiltersCard";
import { AdminApprovalsInboxStrip } from "./AdminApprovalsInboxStrip";
import { AdminApprovalsMetaNote } from "./AdminApprovalsMetaNote";
import { AdminApprovalsPermissionHints } from "./AdminApprovalsPermissionHints";
import { AdminApprovalsQuickFilters } from "./AdminApprovalsQuickFilters";
import { AdminApprovalsTableSection } from "./AdminApprovalsTableSection";
import { useAdminApprovalsPage } from "./useAdminApprovalsPage";

export function AdminApprovalsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const statusFilterId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const approvalsListFilterHintId = useId();

  const vm = useAdminApprovalsPage();
  const { loading, error, meta, note } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_approvals_title")}
      subtitle={t("admin_approvals_subtitle_l5")}
      writePermissionId={ADMIN_PERM.APPROVE}
      headerAside={
        <>
          <Link
            href="/admin/users"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_approvals_linkUsers")}
          </Link>
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
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminApprovalsPermissionHints />
      <AdminApprovalsInboxStrip vm={vm} />
      <AdminApprovalsQuickFilters vm={vm} />
      <AdminApprovalsFiltersCard
        vm={vm}
        statusFilterId={statusFilterId}
        approvalsListFilterHintId={approvalsListFilterHintId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
      />
      <AdminApprovalsBatchBar vm={vm} />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      <AdminApprovalsAppliedFiltersSection vm={vm} adminAppliedFiltersDescId={adminAppliedFiltersDescId} />

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminApprovalsMetaNote loading={loading} error={error} note={note} />

      <AdminApprovalsTableSection vm={vm} />
    </AdminListPageChrome>
  );
}
