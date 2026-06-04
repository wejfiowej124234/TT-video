"use client";

import Link from "next/link";

import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminConfigPublishApprovalNotice } from "@/components/admin/AdminConfigPublishApprovalNotice";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminFlagsFilterCard } from "./AdminFlagsFilterCard";
import { AdminFlagsListSection } from "./AdminFlagsListSection";
import { AdminFlagsPublishModal } from "./AdminFlagsPublishModal";
import { useAdminFlagsPage } from "./useAdminFlagsPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export function AdminFlagsPageMain() {
  const vm = useAdminFlagsPage();

  return (
    <AdminListPageChrome
      titleId={vm.pageTitleId}
      title={vm.t("admin_flags_title")}
      subtitle={vm.t("admin_flags_subtitle")}
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
            {vm.t("admin_flags_back")}
          </Link>
        </>
      }
    >
      <AdminConfigPublishApprovalNotice />

      <AdminFlagsFilterCard
        t={vm.t}
        apply={vm.apply}
        resetFilters={vm.resetFilters}
        hasActiveFilters={vm.hasActiveFilters}
        limitInputId={vm.limitInputId}
        flagCodeInputId={vm.flagCodeInputId}
        enabledSelectId={vm.enabledSelectId}
        scopeInputId={vm.scopeInputId}
        adminListApplyResetHintId={vm.adminListApplyResetHintId}
        adminFilterHintId={vm.adminFilterHintId}
        flagsActiveCodeDescId={vm.flagsActiveCodeDescId}
        flagsActiveEnabledDescId={vm.flagsActiveEnabledDescId}
        flagsActiveScopeDescId={vm.flagsActiveScopeDescId}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
        draftLimit={vm.draftLimit}
        setDraftLimit={vm.setDraftLimit}
        draftFlagCode={vm.draftFlagCode}
        setDraftFlagCode={vm.setDraftFlagCode}
        draftEnabled={vm.draftEnabled}
        setDraftEnabled={vm.setDraftEnabled}
        draftScope={vm.draftScope}
        setDraftScope={vm.setDraftScope}
        flagCode={vm.flagCode}
        enabled={vm.enabled}
        scope={vm.scope}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
      />

      <AdminFlagsListSection
        t={vm.t}
        loading={vm.loading}
        error={vm.error}
        appliedFilters={vm.appliedFilters}
        items={vm.items}
        meta={vm.meta}
        openPublish={vm.openPublish}
        canPublish={vm.canPublish}
        adminAppliedFiltersDescId={vm.adminAppliedFiltersDescId}
      />

      <AdminFlagsPublishModal
        t={vm.t}
        publishRow={vm.publishRow}
        closePublish={vm.closePublish}
        submitPublish={vm.submitPublish}
        publishDialogTitleId={vm.publishDialogTitleId}
        publishDialogDescId={vm.publishDialogDescId}
        publishModalFilterHintId={vm.publishModalFilterHintId}
        pubEnabled={vm.pubEnabled}
        setPubEnabled={vm.setPubEnabled}
        pubRollout={vm.pubRollout}
        setPubRollout={vm.setPubRollout}
        pubRegionMode={vm.pubRegionMode}
        setPubRegionMode={vm.setPubRegionMode}
        pubRegionText={vm.pubRegionText}
        setPubRegionText={vm.setPubRegionText}
        pubVersion={vm.pubVersion}
        setPubVersion={vm.setPubVersion}
        publishSubmitting={vm.publishSubmitting}
        publishError={vm.publishError}
        publishErrorKind={vm.publishErrorKind}
      />
    </AdminListPageChrome>
  );
}
