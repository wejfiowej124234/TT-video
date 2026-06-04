"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAcquisitionPublishSuspendModal } from "@/components/admin/AdminAcquisitionPublishSuspendModal";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { UseAdminUsersPageResult } from "./useAdminUsersPage";
import { AdminUsersRoleSuccessBanner } from "./AdminUsersRoleSuccessBanner";
import { AdminUsersFiltersCard } from "./AdminUsersFiltersCard";
import { AdminUsersDataSection } from "./AdminUsersDataSection";
import { AdminUsersRoleChangeModal } from "./AdminUsersRoleChangeModal";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

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
      subtitle={t("admin_users_subtitle")}
      headerAside={
        <>
          <Link href="/admin/approvals" className={`${adminPageNavLinkClass()}`}>
            {t("admin_users_linkApprovals")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
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
