"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { AUDIT_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminFinanceRelatedFoldLinks";
import { AdminAuditFiltersBlock } from "./AdminAuditFiltersBlock";
import { AdminAuditTableSection } from "./AdminAuditTableSection";
import type { AdminAuditPageViewModel } from "./useAdminAuditPage";

type Props = AdminAuditPageViewModel;

export function AdminAuditPageMain(props: Props) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    listQ,
    loading,
    refreshing,
    error,
    items,
    note,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftActorId,
    setDraftActorId,
    draftAction,
    setDraftAction,
    draftResourceType,
    setDraftResourceType,
    apply,
    reset,
  } = props;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_audit_list_title")}
      subtitle={t("admin_audit_list_subtitle_l5")}
      headerAside={<AdminFinanceSectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={AUDIT_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="audit-list"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.READ}
        messageKey="admin_perm_denied_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        audit={{
          entryCount: items.length,
          latestAction: items[0]?.action ?? null,
          latestActor: items[0]?.actor_id ?? null,
          loading,
          error: Boolean(error),
        }}
      />

      <AdminAuditFiltersBlock
        listQ={listQ}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        loading={loading}
        error={error}
        appliedFilters={appliedFilters}
        draftLimit={draftLimit}
        setDraftLimit={setDraftLimit}
        draftActorId={draftActorId}
        setDraftActorId={setDraftActorId}
        draftAction={draftAction}
        setDraftAction={setDraftAction}
        draftResourceType={draftResourceType}
        setDraftResourceType={setDraftResourceType}
        apply={apply}
        reset={reset}
      />

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && note ? <AdminMetaNoteLink className="mt-3">{note}</AdminMetaNoteLink> : null}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_audit_list_appliedPrefix")} {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      )}

      {!error && (!loading || items.length > 0) ? (
        <AdminAuditTableSection listQ={listQ} items={items} refreshing={refreshing} />
      ) : null}
    </AdminListPageChrome>
  );
}
