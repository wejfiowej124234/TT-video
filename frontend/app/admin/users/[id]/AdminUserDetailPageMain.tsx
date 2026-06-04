"use client";

import Link from "next/link";
import { useEffect, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAcquisitionPublishSuspendCard } from "@/components/admin/AdminAcquisitionPublishSuspendCard";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminProviderApplicationReviewCard } from "@/components/admin/AdminProviderApplicationReviewCard";
import { AdminStewardApplicationReviewCard } from "@/components/admin/AdminStewardApplicationReviewCard";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { outboundUrlFromPersisted } from "@/lib/communityMediaClientUrl";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_USER_OUTBOUND_URL_KEYS, USER_DETAIL_ROW_DEFS, fmtUserDetailValue } from "./adminUserDetailPageModel";
import { useAdminUserDetailPage } from "./useAdminUserDetailPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass, adminTableInlineLinkClass } from "@/lib/adminUi";

/** 70：用户监管详情；须 admin；响应不含 password_hash。 */
export function AdminUserDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { userId, loading, error, user, meta, acquisitionSuspendInitial } = useAdminUserDetailPage();

  useEffect(() => {
    if (loading || error || !user) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#admin-acquisition-suspend") return;
    document.getElementById("admin-acquisition-suspend")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [loading, error, user]);

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_user_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-meta break-all">{userId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_user_detail_subtitle")}</p>
        </>
      }
      headerAside={
        <>
          <Link href="/admin/users" className={`${adminPageNavLinkClass()}`}>
            {t("admin_user_detail_back_list")}
          </Link>
          <Link href="/admin/approvals" className={`${adminPageNavLinkClass()}`}>
            {t("admin_users_linkApprovals")}
          </Link>
          <Link
            href="/admin/provider-applications"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_provider_list_title")}
          </Link>
          <Link
            href="/admin/steward-applications"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_steward_list_title")}
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
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_user_detail_panel_aria")}>
        {!userId ? (
          <AdminAlertError message={t("admin_user_detail_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_users_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !user ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`} data-tt-admin-user-identity="1">
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_user_detail_identity_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
              {USER_DETAIL_ROW_DEFS.map(({ key, labelKey }) => {
                const raw = user[key];
                const display = fmtUserDetailValue(raw) || t("admin_em_dash");
                const rawStr = typeof raw === "string" ? raw.trim() : "";
                const outboundHref =
                  ADMIN_USER_OUTBOUND_URL_KEYS.has(key) && rawStr.length > 0 ? outboundUrlFromPersisted(rawStr) : "";
                return (
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">
                      {outboundHref ? (
                        <a
                          href={outboundHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${adminTableInlineLinkClass()} break-all`}
                        >
                          {display}
                        </a>
                      ) : (
                        display
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
        {userId && !loading && !error ? (
          <div className="space-y-4" data-tt-admin-user-onboarding="1">
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_user_detail_onboarding_section")}
            </h2>
            <AdminProviderApplicationReviewCard userId={userId} />
            <AdminStewardApplicationReviewCard userId={userId} />
            <div id="admin-acquisition-suspend" data-tt-admin-user-acquisition="1">
              <h2 className="mb-3 text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_user_detail_acquisition_section")}
              </h2>
              <AdminAcquisitionPublishSuspendCard
                userId={userId}
                initialSnapshot={acquisitionSuspendInitial}
              />
            </div>
          </div>
        ) : null}
      </section>
    </AdminDetailPageChrome>
  );
}
