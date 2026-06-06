"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOnboardingHubBackLinks } from "@/components/admin/AdminOnboardingHubBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { ADMIN_PRIMARY_ACTION_BTN_CLASS, adminPageNavLinkClass,
  ADMIN_CONSOLE_MUTED_BLOCK_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_DESTRUCTIVE_SOFT_BTN_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,} from "@/lib/adminUi";
import { useAdminOnboardingEntitlementDetailPage } from "./useAdminOnboardingEntitlementDetailPage";
import { ONBOARDING_ENTITLEMENT_DETAIL_RELATED_FOLD_LINKS } from "@/lib/admin/adminOnboardingEntitlementDetailRelatedFoldLinks";

export function AdminOnboardingEntitlementDetailPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    id,
    canWrite,
    loading,
    refreshing,
    error,
    ent,
    metaJson,
    setMetaJson,
    revokeReason,
    setRevokeReason,
    busy,
    actionMsg,
    patchMetadata,
    revoke,
  } = useAdminOnboardingEntitlementDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_onb_ent_detail_title")}
      subtitle={<p className="font-mono text-small text-ink-800 text-ink-500">{id}</p>}
      headerAside={
        <AdminOnboardingHubBackLinks>
          <Link href="/admin/onboarding/entitlements" className={adminPageNavLinkClass()}>
            {t("admin_onb_ent_back_list")}
          </Link>
        </AdminOnboardingHubBackLinks>
      }
      mainDataAttrs={{ "data-tt-admin-onboarding-entitlement-detail": "1" }}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={ONBOARDING_ENTITLEMENT_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_onb_ent_detail_related_aria"
        foldSummaryKey="admin_onb_ent_detail_related_fold"
        dataTtFold="onboarding-entitlement-detail"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.ONBOARDING_WRITE}
        messageKey="admin_perm_denied_onboarding_write"
      />

      {loading && !ent ? (
        <AdminListLoadingStatus message={t("admin_home_inbox_loading")} className="mt-6 text-small text-ink-600" />
      ) : null}
      {error && !ent ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} className="mt-6" />
      ) : null}

      {ent ? (
        <pre
          className={`mt-6 overflow-x-auto p-3 text-meta ${ADMIN_CONSOLE_MUTED_BLOCK_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
        >
          {JSON.stringify(ent, null, 2)}
        </pre>
      ) : null}

      {canWrite && ent ? (
        <AdminDetailContentPanel className="mt-6 space-y-4">
          <div>
            <label className="text-small font-medium text-ink-800">{t("admin_onb_ent_meta_patch")}</label>
            <textarea
              className={`mt-1 block w-full min-h-[120px] ${ADMIN_FORM_CONTROL_SM_CLASS} font-mono text-small text-ink-800 p-2`}
              value={metaJson}
              onChange={(e) => setMetaJson(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              className={`mt-2 ${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-50`}
              onClick={() => void patchMetadata()}
            >
              {t("admin_onb_ent_patch_btn")}
            </button>
          </div>
          <div>
            <label className="text-small font-medium text-ink-800">{t("admin_onb_ent_revoke")}</label>
            <input
              className={`mt-1 block w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 text-small`}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder={t("admin_onb_ent_revoke_ph")}
            />
            <button
              type="button"
              disabled={busy || !revokeReason.trim()}
              className={`mt-2 ${ADMIN_DESTRUCTIVE_SOFT_BTN_CLASS}`}
              onClick={() => void revoke()}
            >
              {t("admin_onb_ent_revoke_btn")}
            </button>
          </div>
        </AdminDetailContentPanel>
      ) : (
        <p className="mt-6 text-small text-ink-600">{t("admin_onb_ent_readonly_hint")}</p>
      )}

      {actionMsg ? <p className="mt-4 text-small text-ink-700">{actionMsg}</p> : null}
    </AdminDetailPageChrome>
  );
}
