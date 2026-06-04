"use client";

import Link from "next/link";

import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminConfigPublishApprovalNotice } from "@/components/admin/AdminConfigPublishApprovalNotice";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminPoliciesFilterCard } from "./AdminPoliciesFilterCard";
import { AdminPoliciesListSection } from "./AdminPoliciesListSection";
import { AdminPoliciesPublishModal } from "./AdminPoliciesPublishModal";
import { useAdminPoliciesPage } from "./useAdminPoliciesPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export function AdminPoliciesPageMain() {
  const vm = useAdminPoliciesPage();

  return (
    <AdminListPageChrome
      titleId={vm.pageTitleId}
      title={vm.t("admin_policies_title")}
      subtitle={vm.t("admin_policies_subtitle")}
      headerAside={
        <>
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
            {vm.t("admin_policies_back")}
          </Link>
        </>
      }
    >
      <AdminConfigPublishApprovalNotice />

      <AdminPoliciesFilterCard
        t={vm.t}
        apply={vm.apply}
        resetFilters={vm.resetFilters}
        hasActiveFilters={vm.hasActiveFilters}
        limitInputId={vm.limitInputId}
        policyCodeInputId={vm.policyCodeInputId}
        statusSelectId={vm.statusSelectId}
        scopeTypeInputId={vm.scopeTypeInputId}
        bindingRoleInputId={vm.bindingRoleInputId}
        adminListApplyResetHintId={vm.adminListApplyResetHintId}
        adminFilterHintId={vm.adminFilterHintId}
        policiesActiveCodeDescId={vm.policiesActiveCodeDescId}
        policiesActiveStatusDescId={vm.policiesActiveStatusDescId}
        policiesActiveScopeTypeDescId={vm.policiesActiveScopeTypeDescId}
        policiesActiveBindingRoleDescId={vm.policiesActiveBindingRoleDescId}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
        draftLimit={vm.draftLimit}
        setDraftLimit={vm.setDraftLimit}
        draftPolicyCode={vm.draftPolicyCode}
        setDraftPolicyCode={vm.setDraftPolicyCode}
        draftStatus={vm.draftStatus}
        setDraftStatus={vm.setDraftStatus}
        draftScopeType={vm.draftScopeType}
        setDraftScopeType={vm.setDraftScopeType}
        draftBindingRole={vm.draftBindingRole}
        setDraftBindingRole={vm.setDraftBindingRole}
        policyCode={vm.policyCode}
        status={vm.status}
        scopeType={vm.scopeType}
        bindingRole={vm.bindingRole}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
      />

      <AdminPoliciesListSection
        t={vm.t}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
        items={vm.items}
        meta={vm.meta}
        openPublish={vm.openPublish}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
      />

      <AdminPoliciesPublishModal
        t={vm.t}
        publishRow={vm.publishRow}
        closePublish={vm.closePublish}
        submitPublish={vm.submitPublish}
        publishDialogTitleId={vm.publishDialogTitleId}
        publishDialogDescId={vm.publishDialogDescId}
        publishModalFilterHintId={vm.publishModalFilterHintId}
        publishStatus={vm.publishStatus}
        setPublishStatus={vm.setPublishStatus}
        publishVersion={vm.publishVersion}
        setPublishVersion={vm.setPublishVersion}
        publishSubmitting={vm.publishSubmitting}
        publishError={vm.publishError}
        publishErrorKind={vm.publishErrorKind}
      />
    </AdminListPageChrome>
  );
}
