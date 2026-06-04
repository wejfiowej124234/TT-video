"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminComplianceDsarWorkflowNotice } from "@/components/admin/AdminComplianceDsarWorkflowNotice";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminComplianceRequestsPage } from "./useAdminComplianceRequestsPage";
import { AdminComplianceRequestsAppliedFiltersInline } from "./AdminComplianceRequestsAppliedFiltersInline";
import { AdminComplianceRequestsFiltersBlock } from "./AdminComplianceRequestsFiltersBlock";
import { AdminComplianceRequestsMetaSection } from "./AdminComplianceRequestsMetaSection";
import { AdminComplianceRequestsStatusBlock } from "./AdminComplianceRequestsStatusBlock";
import { AdminComplianceRequestsTableSection } from "./AdminComplianceRequestsTableSection";
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
      subtitle={t("admin_compliance_requests_subtitle")}
      headerAside={
        <>
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
            {t("admin_compliance_requests_back")}
          </Link>
        </>
      }
    >
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

      <AdminComplianceRequestsStatusBlock loading={loading} error={error} />

      {!loading && !error && <AdminComplianceRequestsTableSection items={items} />}
    </AdminListPageChrome>
  );
}
