"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { outboundUrlFromPersisted } from "@/lib/communityMediaClientUrl";
import {
  ADMIN_GUIDE_CREDENTIAL_URL_KEYS,
  adminGuideDetailFmt,
  buildAdminGuideDetailRowDefs,
  GUIDE_DETAIL_RELATED_FOLD_LINKS,
} from "./adminGuideDetailPageModel";
import { useAdminGuideDetailPage } from "./useAdminGuideDetailPage";
import {
  ADMIN_DETAIL_FIELD_LABEL_CLASS,
  ADMIN_DETAIL_FIELD_ROW_CLASS,
  ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS,
  ADMIN_DETAIL_SECTION_TITLE_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS,
  adminTableInlineLinkClass,
  adminTableRowPrimaryActionClass,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
export function AdminGuideDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { guideId, loading, refreshing, error, guide, meta } = useAdminGuideDetailPage();

  const rows = guide ? buildAdminGuideDetailRowDefs(guide) : [];

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_guide_detail_title")}
      subtitle={
        <>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS}>{guideId || t("admin_em_dash")}</p>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS}>{t("admin_guide_detail_subtitle_l5")}</p>
        </>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={GUIDE_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_guide_detail_related_aria"
        foldSummaryKey="admin_guide_detail_related_fold"
        dataTtFold="guide-detail"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_guide_detail_panel_aria")}>
        {!guideId ? (
          <AdminAlertError message={t("admin_guide_detail_missingId")} />
        ) : loading && !guide ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error && !guide ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !guide ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <AdminDetailContentPanel
            className={refreshing ? ADMIN_LIST_REFRESHING_SURFACE_CLASS : undefined}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
            <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>
              {t("admin_guide_detail_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
              {rows.map(({ key, labelKey, display: preset }) => {
                const raw = guide[key];
                const display = (preset !== undefined ? preset : adminGuideDetailFmt(raw)) || t("admin_em_dash");
                const rawStr = typeof raw === "string" ? raw.trim() : "";
                const credentialHref =
                  ADMIN_GUIDE_CREDENTIAL_URL_KEYS.has(key) && rawStr.length > 0
                    ? outboundUrlFromPersisted(rawStr)
                    : "";
                return (
                  <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                    <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t(labelKey)}</dt>
                    <dd className={ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS}>
                      {credentialHref ? (
                        <a
                          href={credentialHref}
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
            {guideId ? (
              <div className="mt-4 flex flex-wrap gap-3" data-tt-admin-guide-detail-actions="1">
                <Link
                  href={`/guides/${encodeURIComponent(guideId)}`}
                  className={adminTableRowPrimaryActionClass()}
                  data-tt-admin-guide-detail-action-primary="public"
                >
                  {t("admin_guides_linkPublic")}
                </Link>
              </div>
            ) : null}
          </AdminDetailContentPanel>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
