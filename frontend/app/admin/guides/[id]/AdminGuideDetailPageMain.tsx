"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { outboundUrlFromPersisted } from "@/lib/communityMediaClientUrl";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  ADMIN_GUIDE_CREDENTIAL_URL_KEYS,
  adminGuideDetailFmt,
  buildAdminGuideDetailRowDefs,
} from "./adminGuideDetailPageModel";
import { useAdminGuideDetailPage } from "./useAdminGuideDetailPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass, adminTableInlineLinkClass } from "@/lib/adminUi";
export function AdminGuideDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { guideId, loading, error, guide, meta } = useAdminGuideDetailPage();

  const rows = guide ? buildAdminGuideDetailRowDefs(guide) : [];

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_guide_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-meta break-all">{guideId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_guide_detail_subtitle")}</p>
        </>
      }
      headerAside={
        <>
          <Link
            href="/admin/guides"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_guide_detail_back_list")}
          </Link>
          {guideId ? (
            <Link
              href={`/guides/${encodeURIComponent(guideId)}`}
              className={`${adminPageNavLinkClass()}`}
            >
              {t("admin_guides_linkPublic")}
            </Link>
          ) : null}
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_guide_detail_panel_aria")}>
        {!guideId ? (
          <AdminAlertError message={t("admin_guide_detail_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !guide ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}>
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
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
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">
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
          </div>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
