"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { useAdminOnboardingEntitlementDetailPage } from "./useAdminOnboardingEntitlementDetailPage";

export function AdminOnboardingEntitlementDetailPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    id,
    canWrite,
    loading,
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
      subtitle={<p className="font-mono text-meta text-ink-500">{id}</p>}
      headerAside={
        <Link href="/admin/onboarding/entitlements" className={adminPageNavLinkClass()}>
          {t("admin_onb_ent_back_list")}
        </Link>
      }
      mainDataAttrs={{ "data-tt-admin-onboarding-entitlement-detail": "1" }}
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.ONBOARDING_WRITE}
        messageKey="admin_perm_denied_onboarding_write"
      />

      {loading ? <AdminListLoadingStatus message={t("admin_home_inbox_loading")} className="mt-6 text-small text-ink-600" /> : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} className="mt-6" />
      ) : null}

      {ent && !loading ? (
        <pre className="mt-6 overflow-x-auto rounded border border-ink-200 bg-ink-50 p-3 text-meta">
          {JSON.stringify(ent, null, 2)}
        </pre>
      ) : null}

      {canWrite ? (
        <div className={`${ADMIN_FILTER_CARD_CLASS} mt-6 space-y-4`}>
          <div>
            <label className="text-small font-medium text-ink-800">{t("admin_onb_ent_meta_patch")}</label>
            <textarea
              className="mt-1 block w-full min-h-[120px] rounded border border-ink-200 font-mono text-meta p-2"
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
              className="mt-1 block w-full rounded border border-ink-200 px-2 py-1.5 text-small"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder={t("admin_onb_ent_revoke_ph")}
            />
            <button
              type="button"
              disabled={busy || !revokeReason.trim()}
              className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-small font-medium text-red-800 disabled:opacity-50"
              onClick={() => void revoke()}
            >
              {t("admin_onb_ent_revoke_btn")}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-small text-ink-600">{t("admin_onb_ent_readonly_hint")}</p>
      )}

      {actionMsg ? <p className="mt-4 text-small text-ink-700">{actionMsg}</p> : null}
    </AdminDetailPageChrome>
  );
}
