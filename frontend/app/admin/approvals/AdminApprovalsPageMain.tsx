"use client";

import { useId } from "react";

import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { APPROVALS_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminOpsListRelatedFoldLinks";

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
  const { loading, refreshing, error, meta, note, filteredItems } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_approvals_title")}
      subtitle={t("admin_approvals_subtitle_l5")}
      writePermissionId={ADMIN_PERM.APPROVE}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={APPROVALS_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_ops_list_related_aria"
        foldSummaryKey="admin_ops_list_related_fold"
        dataTtFold="approvals-list"
      />
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

      {loading && filteredItems.length === 0 ? (
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
