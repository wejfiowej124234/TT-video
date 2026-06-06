"use client";

import { useId } from "react";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAcquisitionPublishSuspendModal } from "@/components/admin/AdminAcquisitionPublishSuspendModal";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import type { UseAdminUsersPageResult } from "./useAdminUsersPage";
import { AdminUsersRoleSuccessBanner } from "./AdminUsersRoleSuccessBanner";
import { AdminUsersFiltersCard } from "./AdminUsersFiltersCard";
import { AdminUsersDataSection } from "./AdminUsersDataSection";
import { AdminUsersRoleChangeModal } from "./AdminUsersRoleChangeModal";
import { USERS_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminOpsListRelatedFoldLinks";
import { adminTableRowPrimaryActionClass } from "@/lib/adminUi";

export function AdminUsersPageMain({ vm }: { vm: UseAdminUsersPageResult }) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const roleChangeDialogTitleId = useId();
  const roleChangeDialogDescId = useId();
  const roleChangeModalFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    loading,
    refreshing,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftRole,
    setDraftRole,
    draftKyc,
    setDraftKyc,
    roleUser,
    targetRole,
    setTargetRole,
    roleReason,
    setRoleReason,
    roleSubmitting,
    roleModalError,
    roleModalErrorKind,
    roleSuccessApprovalId,
    setRoleSuccessApprovalId,
    applyFilters,
    resetFilters,
    openRoleModal,
    closeRoleModal,
    submitRoleChange,
    fetchErrorUserText,
    suspendUser,
    suspendInlineUserId,
    suspendInlineError,
    suspendInlineErrorKind,
    openSuspendModal,
    closeSuspendModal,
    applySuspendResult,
    quickLiftSuspend,
  } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_users_title")}
      subtitle={t("admin_users_subtitle_l5")}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={USERS_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_ops_list_related_aria"
        foldSummaryKey="admin_ops_list_related_fold"
        dataTtFold="users-list"
      />
      <div className="mb-4 flex flex-wrap gap-3" data-tt-admin-users-list-actions="1">
        <Link
          href="/admin/approvals"
          className={adminTableRowPrimaryActionClass()}
          data-tt-admin-ops-cross-approvals="1"
        >
          {t("admin_users_linkApprovals")}
        </Link>
      </div>
      {roleSuccessApprovalId ? (
        <AdminUsersRoleSuccessBanner
          roleSuccessApprovalId={roleSuccessApprovalId}
          setRoleSuccessApprovalId={setRoleSuccessApprovalId}
          t={t}
        />
      ) : null}

      <AdminUsersFiltersCard
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        loading={loading}
        error={error}
        appliedFilters={appliedFilters}
        draftLimit={draftLimit}
        setDraftLimit={setDraftLimit}
        draftRole={draftRole}
        setDraftRole={setDraftRole}
        draftKyc={draftKyc}
        setDraftKyc={setDraftKyc}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
        t={t}
      />

      <AdminUsersDataSection
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        loading={loading}
        refreshing={refreshing}
        error={error}
        appliedFilters={appliedFilters}
        items={items}
        meta={meta}
        fetchErrorUserText={fetchErrorUserText}
        openRoleModal={openRoleModal}
        openSuspendModal={openSuspendModal}
        quickLiftSuspend={quickLiftSuspend}
        suspendInlineUserId={suspendInlineUserId}
        suspendInlineError={suspendInlineError}
        suspendInlineErrorKind={suspendInlineErrorKind}
        t={t}
      />

      {roleUser ? (
        <AdminUsersRoleChangeModal
          roleUser={roleUser}
          roleChangeDialogTitleId={roleChangeDialogTitleId}
          roleChangeDialogDescId={roleChangeDialogDescId}
          roleChangeModalFilterHintId={roleChangeModalFilterHintId}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          roleReason={roleReason}
          setRoleReason={setRoleReason}
          roleSubmitting={roleSubmitting}
          roleModalError={roleModalError}
          roleModalErrorKind={roleModalErrorKind}
          closeRoleModal={closeRoleModal}
          submitRoleChange={submitRoleChange}
          t={t}
        />
      ) : null}

      <AdminAcquisitionPublishSuspendModal
        user={suspendUser}
        onClose={closeSuspendModal}
        onSuccess={applySuspendResult}
      />
    </AdminListPageChrome>
  );
}
