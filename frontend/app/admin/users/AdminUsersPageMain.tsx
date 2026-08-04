"use client";

import { useId } from "react";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAcquisitionPublishSuspendModal } from "@/components/admin/AdminAcquisitionPublishSuspendModal";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminOpsLeafDataSourceStrip } from "@/components/admin/AdminOpsLeafDataSourceStrip";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminUsersCapabilityStrip } from "@/components/admin/AdminUsersCapabilityStrip";
import type { UseAdminUsersPageResult } from "./useAdminUsersPage";
import { AdminUsersRoleSuccessBanner } from "./AdminUsersRoleSuccessBanner";
import { AdminUsersFiltersCard } from "./AdminUsersFiltersCard";
import { AdminUsersDataSection } from "./AdminUsersDataSection";
import { AdminUsersRoleChangeModal } from "./AdminUsersRoleChangeModal";
import { USERS_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminOpsListRelatedFoldLinks";
import {
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TEXT_META_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

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
    draftLimit,
    setDraftLimit,
    draftRole,
    setDraftRole,
    draftEmail,
    setDraftEmail,
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
    goPrevPage,
    goNextPage,
    listRange,
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
    meta,
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
      <AdminOpsLeafDataSourceStrip leaf="users" meta={meta} emphasizeUsersDrift />
      <AdminUsersCapabilityStrip />
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
        draftEmail={draftEmail}
        setDraftEmail={setDraftEmail}
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
        fetchErrorUserText={fetchErrorUserText}
        openRoleModal={openRoleModal}
        openSuspendModal={openSuspendModal}
        quickLiftSuspend={quickLiftSuspend}
        suspendInlineUserId={suspendInlineUserId}
        suspendInlineError={suspendInlineError}
        suspendInlineErrorKind={suspendInlineErrorKind}
        t={t}
      />

      {!loading && !error ? (
        <nav
          className="mt-4 flex flex-wrap items-center justify-between gap-3"
          aria-label={t("admin_users_pagination_aria")}
          data-tt-admin-users-pagination="1"
          data-tt-admin-users-pagination-offset={String(vm.offset)}
        >
          <p className={ADMIN_TEXT_META_CLASS} data-tt-admin-users-pagination-range="1">
            {listRange.total != null
              ? t("admin_users_pagination_range", {
                  from: String(listRange.from),
                  to: String(listRange.to),
                  total: String(listRange.total),
                })
              : t("admin_users_pagination_range_unknown", {
                  from: String(listRange.from),
                  to: String(listRange.to),
                })}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`inline-flex min-h-[44px] items-center justify-center px-3 ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              disabled={!listRange.hasPrev}
              onClick={goPrevPage}
              data-tt-admin-users-pagination-prev="1"
            >
              {t("admin_users_pagination_prev")}
            </button>
            <button
              type="button"
              className={`inline-flex min-h-[44px] items-center justify-center px-3 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
              disabled={!listRange.hasNext}
              onClick={goNextPage}
              data-tt-admin-users-pagination-next="1"
            >
              {t("admin_users_pagination_next")}
            </button>
          </div>
        </nav>
      ) : null}

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
