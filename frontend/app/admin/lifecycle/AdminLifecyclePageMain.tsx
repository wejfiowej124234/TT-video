"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminLifecyclePage } from "./useAdminLifecyclePage";
import { AdminLifecycleAppliedFiltersInline } from "./AdminLifecycleAppliedFiltersInline";
import { AdminLifecycleFiltersBlock } from "./AdminLifecycleFiltersBlock";
import { AdminLifecycleMetaAndNoteSection } from "./AdminLifecycleMetaAndNoteSection";
import { AdminLifecycleStatusBlock } from "./AdminLifecycleStatusBlock";
import { AdminLifecycleTableSection } from "./AdminLifecycleTableSection";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 350 / 70：生命周期状态机台账只读（须 admin + DB）。 */
export function AdminLifecyclePageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const machineInputId = useId();
  const domainInputId = useId();
  const entityInputId = useId();
  const versionInputId = useId();
  const sotInputId = useId();
  const anomalyInputId = useId();
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
    draftMachine,
    setDraftMachine,
    draftDomain,
    setDraftDomain,
    draftEntity,
    setDraftEntity,
    draftVersion,
    setDraftVersion,
    draftSot,
    setDraftSot,
    draftAnomaly,
    setDraftAnomaly,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = useAdminLifecyclePage();

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_lifecycle_title")}
      subtitle={t("admin_lifecycle_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_lifecycle_back")}
          </Link>
        </>
      }
    >
      <AdminLifecycleFiltersBlock
        limitInputId={limitInputId}
        machineInputId={machineInputId}
        domainInputId={domainInputId}
        entityInputId={entityInputId}
        versionInputId={versionInputId}
        sotInputId={sotInputId}
        anomalyInputId={anomalyInputId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminFilterHintId={adminFilterHintId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        appliedFilters={appliedFilters}
        draftLimit={draftLimit}
        setDraftLimit={setDraftLimit}
        draftMachine={draftMachine}
        setDraftMachine={setDraftMachine}
        draftDomain={draftDomain}
        setDraftDomain={setDraftDomain}
        draftEntity={draftEntity}
        setDraftEntity={setDraftEntity}
        draftVersion={draftVersion}
        setDraftVersion={setDraftVersion}
        draftSot={draftSot}
        setDraftSot={setDraftSot}
        draftAnomaly={draftAnomaly}
        setDraftAnomaly={setDraftAnomaly}
        apply={apply}
        clearNonLimitFilters={clearNonLimitFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {appliedFilters ? (
        <AdminLifecycleAppliedFiltersInline id={adminAppliedFiltersDescId} appliedFilters={appliedFilters} />
      ) : null}

      <AdminLifecycleStatusBlock loading={loading} error={error} />

      <AdminLifecycleMetaAndNoteSection meta={meta} loading={loading} error={error} />

      {!loading && !error && <AdminLifecycleTableSection items={items} />}
    </AdminListPageChrome>
  );
}
