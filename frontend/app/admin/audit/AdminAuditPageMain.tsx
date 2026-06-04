"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminAuditFiltersBlock } from "./AdminAuditFiltersBlock";
import { AdminAuditTableSection } from "./AdminAuditTableSection";
import type { AdminAuditPageViewModel } from "./useAdminAuditPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

type Props = AdminAuditPageViewModel;

export function AdminAuditPageMain(props: Props) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    listQ,
    loading,
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
      subtitle={t("admin_audit_list_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/auth-audit-events"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_auth_audit_events_title")}
          </Link>
          <Link
            href="/admin/audit/operations"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_audit_link_operations")}
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

      {loading ? (
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

      {!loading && !error && <AdminAuditTableSection listQ={listQ} items={items} />}
    </AdminListPageChrome>
  );
}
