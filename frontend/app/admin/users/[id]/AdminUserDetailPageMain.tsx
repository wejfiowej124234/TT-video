"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";
import { useEffect, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAcquisitionPublishSuspendCard } from "@/components/admin/AdminAcquisitionPublishSuspendCard";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminProviderApplicationReviewCard } from "@/components/admin/AdminProviderApplicationReviewCard";
import { AdminGuideApplicationReviewCard } from "@/components/admin/AdminGuideApplicationReviewCard";
import { AdminStewardApplicationReviewCard } from "@/components/admin/AdminStewardApplicationReviewCard";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { outboundUrlFromPersisted } from "@/lib/communityMediaClientUrl";
import {
  ADMIN_USER_OUTBOUND_URL_KEYS,
  USER_DETAIL_RELATED_FOLD_LINKS,
  USER_DETAIL_ROW_DEFS,
  fmtUserDetailValue,
} from "./adminUserDetailPageModel";
import { useAdminUserDetailPage } from "./useAdminUserDetailPage";
import {
  ADMIN_DETAIL_FIELD_LABEL_CLASS,
  ADMIN_DETAIL_FIELD_ROW_CLASS,
  ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS,
  ADMIN_DETAIL_SECTION_TITLE_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS,
  adminPageNavLinkClass,
  adminTableInlineLinkClass,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";

/** 70：用户监管详情；须 admin；响应不含 password_hash。 */
export function AdminUserDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { userId, loading, refreshing, error, user, meta, acquisitionSuspendInitial } = useAdminUserDetailPage();

  useEffect(() => {
    if ((loading && !user) || (error && !user) || !user) return;
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
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS}>{userId || t("admin_em_dash")}</p>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS}>{t("admin_user_detail_subtitle_l5")}</p>
        </>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={USER_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_user_detail_related_aria"
        foldSummaryKey="admin_user_detail_related_fold"
        dataTtFold="user"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_user_detail_panel_aria")}>
        {!userId ? (
          <AdminAlertError message={t("admin_user_detail_missingId")} />
        ) : loading && !user ? (
            <AdminListLoadingStatus message={t("admin_users_loading")} className="text-body text-ink-600" />
          ) : error && !user ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !user ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <AdminDetailContentPanel
            data-tt-admin-user-identity="1"
            className={refreshing ? ADMIN_LIST_REFRESHING_SURFACE_CLASS : undefined}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
            <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>
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
                  <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                    <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t(labelKey)}</dt>
                    <dd className={ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS}>
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
          </AdminDetailContentPanel>
        )}
        {userId && !(loading && !user) && !(error && !user) ? (
          <div className="space-y-4" data-tt-admin-user-onboarding="1">
            <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>
              {t("admin_user_detail_onboarding_section")}
            </h2>
            <AdminProviderApplicationReviewCard userId={userId} />
            <AdminGuideApplicationReviewCard userId={userId} />
            <AdminStewardApplicationReviewCard userId={userId} />
            <div id="admin-acquisition-suspend" data-tt-admin-user-acquisition="1">
              <h2 className={`mb-3 ${ADMIN_DETAIL_SECTION_TITLE_CLASS}`}>
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
