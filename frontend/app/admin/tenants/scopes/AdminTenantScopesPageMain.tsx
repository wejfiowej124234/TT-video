"use client";

import Link from "next/link";

import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminConfigPublishApprovalNotice } from "@/components/admin/AdminConfigPublishApprovalNotice";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminTenantScopesFilterCard } from "./AdminTenantScopesFilterCard";
import { AdminTenantScopesListSection } from "./AdminTenantScopesListSection";
import { AdminTenantScopesPublishModal } from "./AdminTenantScopesPublishModal";
import { useAdminTenantScopesPage } from "./useAdminTenantScopesPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 320 / 70：租户作用域台账；发布须 super_admin（04 §3.5）。 */
export function AdminTenantScopesPageMain() {
  const vm = useAdminTenantScopesPage();

  return (
    <AdminListPageChrome
      titleId={vm.pageTitleId}
      title={vm.t("admin_tenant_scopes_title")}
      subtitle={vm.t("admin_tenant_scopes_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {vm.t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {vm.t("admin_tenant_scopes_back")}
          </Link>
        </>
      }
    >
      <AdminConfigPublishApprovalNotice />

      <AdminTenantScopesFilterCard
        t={vm.t}
        apply={vm.apply}
        resetFilters={vm.resetFilters}
        hasActiveFilters={vm.hasActiveFilters}
        limitInputId={vm.limitInputId}
        tenantKeyInputId={vm.tenantKeyInputId}
        regionCodeInputId={vm.regionCodeInputId}
        statusSelectId={vm.statusSelectId}
        scopeClassSelectId={vm.scopeClassSelectId}
        adminListApplyResetHintId={vm.adminListApplyResetHintId}
        adminFilterHintId={vm.adminFilterHintId}
        tenantScopesActiveKeyDescId={vm.tenantScopesActiveKeyDescId}
        tenantScopesActiveRegionDescId={vm.tenantScopesActiveRegionDescId}
        tenantScopesActiveStatusDescId={vm.tenantScopesActiveStatusDescId}
        tenantScopesActiveScopeClassDescId={vm.tenantScopesActiveScopeClassDescId}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
        draftLimit={vm.draftLimit}
        setDraftLimit={vm.setDraftLimit}
        draftTenantKey={vm.draftTenantKey}
        setDraftTenantKey={vm.setDraftTenantKey}
        draftRegionCode={vm.draftRegionCode}
        setDraftRegionCode={vm.setDraftRegionCode}
        draftStatus={vm.draftStatus}
        setDraftStatus={vm.setDraftStatus}
        draftScopeClass={vm.draftScopeClass}
        setDraftScopeClass={vm.setDraftScopeClass}
        tenantKey={vm.tenantKey}
        regionCode={vm.regionCode}
        status={vm.status}
        scopeClass={vm.scopeClass}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
      />

      <AdminTenantScopesListSection
        t={vm.t}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
        items={vm.items}
        meta={vm.meta}
        openPublish={vm.openPublish}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
      />

      <AdminTenantScopesPublishModal
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
