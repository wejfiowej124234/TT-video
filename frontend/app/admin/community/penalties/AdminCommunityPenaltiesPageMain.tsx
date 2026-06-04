"use client";

import Link from "next/link";
import { AdminCommunityRelatedLinks } from "@/components/admin/AdminCommunityRelatedLinks";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { AdminCommunityPenaltiesCreateModal } from "./AdminCommunityPenaltiesCreateModal";
import { AdminCommunityPenaltiesFilterCard } from "./AdminCommunityPenaltiesFilterCard";
import { AdminCommunityPenaltiesListSection } from "./AdminCommunityPenaltiesListSection";
import { useAdminCommunityPenaltiesPage } from "./useAdminCommunityPenaltiesPage";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
export function AdminCommunityPenaltiesPageMain() {
  const vm = useAdminCommunityPenaltiesPage();
  const { canWrite } = useAdminCanWrite(ADMIN_PERM.COMMUNITY_MODERATE);

  return (
    <AdminListPageChrome
      titleId={vm.pageTitleId}
      title={vm.t("admin_penalties_title")}
      subtitle={
        <>
          <span>{vm.t("admin_penalties_subtitle")}</span>
          <AdminCommunityRelatedLinks />
        </>
      }
      headerAside={
        <>
          {canWrite ? (
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              vm.openCreate();
            }}
          >
            <button
              type="submit"
              className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
            >
              {vm.t("admin_penalties_createOpen")}
            </button>
          </form>
          ) : null}
          <Link
            href="/admin/community/reports"
            className={`${adminPageNavLinkClass()}`}
          >
            {vm.t("admin_penalties_linkReports")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {vm.t("admin_observability_title")}
          </Link>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {vm.t("admin_penalties_back")}
          </Link>
        </>
      }
    >
      <AdminCommunityPenaltiesFilterCard
        t={vm.t}
        apply={vm.apply}
        resetFilters={vm.resetFilters}
        hasActiveFilters={vm.hasActiveFilters}
        limitInputId={vm.limitInputId}
        subjectInputId={vm.subjectInputId}
        reportIdInputId={vm.reportIdInputId}
        statusSelectId={vm.statusSelectId}
        adminListApplyResetHintId={vm.adminListApplyResetHintId}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
        draftLimit={vm.draftLimit}
        setDraftLimit={vm.setDraftLimit}
        draftSubject={vm.draftSubject}
        setDraftSubject={vm.setDraftSubject}
        draftReportId={vm.draftReportId}
        setDraftReportId={vm.setDraftReportId}
        draftStatus={vm.draftStatus}
        setDraftStatus={vm.setDraftStatus}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
        penaltyStatusOptions={vm.penaltyStatusOptions}
      />

      <AdminCommunityPenaltiesListSection
        t={vm.t}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
        items={vm.items}
        meta={vm.meta}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
      />

      <AdminCommunityPenaltiesCreateModal
        t={vm.t}
        showCreate={vm.showCreate}
        closeCreate={vm.closeCreate}
        submitCreate={vm.submitCreate}
        createDialogTitleId={vm.createDialogTitleId}
        createDialogDescId={vm.createDialogDescId}
        createModalFilterHintId={vm.createModalFilterHintId}
        cSubject={vm.cSubject}
        setCSubject={vm.setCSubject}
        cAction={vm.cAction}
        setCAction={vm.setCAction}
        cReportId={vm.cReportId}
        setCReportId={vm.setCReportId}
        cReason={vm.cReason}
        setCReason={vm.setCReason}
        cExpires={vm.cExpires}
        setCExpires={vm.setCExpires}
        cMetaJson={vm.cMetaJson}
        setCMetaJson={vm.setCMetaJson}
        cSubmitting={vm.cSubmitting}
        cError={vm.cError}
        cErrorKind={vm.cErrorKind}
        penaltyActions={vm.penaltyActions}
      />
    </AdminListPageChrome>
  );
}
