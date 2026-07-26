"use client";

import { useId } from "react";

import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
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

/** Batch-10 W13 · HU-214：待办条+快捷筛选+列表优先；说明墙/筛选默认折叠。 */
export function AdminApprovalsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const statusFilterId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const approvalsListFilterHintId = useId();

  const vm = useAdminApprovalsPage();
  const { loading, error, filteredItems } = vm;

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
      <AdminApprovalsBatchBar vm={vm} />

      {loading && filteredItems.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      <AdminApprovalsTableSection vm={vm} />

      <AdminApprovalsFiltersCard
        vm={vm}
        statusFilterId={statusFilterId}
        approvalsListFilterHintId={approvalsListFilterHintId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        defaultOpen={false}
      />
      <AdminApprovalsAppliedFiltersSection vm={vm} adminAppliedFiltersDescId={adminAppliedFiltersDescId} />
      <AdminApprovalsMetaNote loading={loading} error={error} note={vm.note} />
    </AdminListPageChrome>
  );
}
