"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminComplianceSectionBackLinks } from "@/components/admin/AdminComplianceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminComplianceDsarWorkflowNotice } from "@/components/admin/AdminComplianceDsarWorkflowNotice";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminComplianceRequestsPage } from "./useAdminComplianceRequestsPage";
import { AdminComplianceRequestsAppliedFiltersInline } from "./AdminComplianceRequestsAppliedFiltersInline";
import { AdminComplianceRequestsFiltersBlock } from "./AdminComplianceRequestsFiltersBlock";
import { AdminComplianceRequestsMetaSection } from "./AdminComplianceRequestsMetaSection";
import { AdminComplianceRequestsStatusBlock } from "./AdminComplianceRequestsStatusBlock";
import { AdminComplianceRequestsTableSection } from "./AdminComplianceRequestsTableSection";
import { COMPLIANCE_REQUESTS_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminComplianceRelatedFoldLinks";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 500：DSAR 请求台账只读（须 admin + DB）。 */
export function AdminComplianceRequestsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const refInputId = useId();
  const subjectInputId = useId();
  const typeInputId = useId();
  const statusInputId = useId();
  const jurisInputId = useId();
  const adminFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftRequestRef,
    setDraftRequestRef,
    draftSubjectId,
    setDraftSubjectId,
    draftRequestType,
    setDraftRequestType,
    draftStatus,
    setDraftStatus,
    draftJurisdiction,
    setDraftJurisdiction,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = useAdminComplianceRequestsPage();

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_compliance_requests_title")}
      subtitle={t("admin_compliance_requests_subtitle_l5")}
      headerAside={
        <AdminComplianceSectionBackLinks />
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={COMPLIANCE_REQUESTS_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_compliance_dsar_related_aria"
        foldSummaryKey="admin_compliance_dsar_related_fold"
        dataTtFold="compliance-requests-list"
      />
      <AdminComplianceDsarWorkflowNotice />

      <AdminComplianceRequestsFiltersBlock
        limitInputId={limitInputId}
        refInputId={refInputId}
        subjectInputId={subjectInputId}
        typeInputId={typeInputId}
        statusInputId={statusInputId}
        jurisInputId={jurisInputId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminFilterHintId={adminFilterHintId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        appliedFilters={appliedFilters}
        draftLimit={draftLimit}
        setDraftLimit={setDraftLimit}
        draftRequestRef={draftRequestRef}
        setDraftRequestRef={setDraftRequestRef}
        draftSubjectId={draftSubjectId}
        setDraftSubjectId={setDraftSubjectId}
        draftRequestType={draftRequestType}
        setDraftRequestType={setDraftRequestType}
        draftStatus={draftStatus}
        setDraftStatus={setDraftStatus}
        draftJurisdiction={draftJurisdiction}
        setDraftJurisdiction={setDraftJurisdiction}
        apply={apply}
        clearNonLimitFilters={clearNonLimitFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {appliedFilters ? (
        <AdminComplianceRequestsAppliedFiltersInline id={adminAppliedFiltersDescId} appliedFilters={appliedFilters} />
      ) : null}

      <AdminComplianceRequestsMetaSection meta={meta} loading={loading} error={error} />

      <AdminComplianceRequestsStatusBlock
        loading={loading && items.length === 0}
        error={error}
      />

      {!error && (!loading || items.length > 0) ? (
        <AdminComplianceRequestsTableSection items={items} refreshing={refreshing} />
      ) : null}
    </AdminListPageChrome>
  );
}
