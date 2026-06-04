"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminConfigReleaseDetailPage } from "./useAdminConfigReleaseDetailPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export function AdminConfigReleaseDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { releaseId, releasesListHref, loading, error, release, meta } = useAdminConfigReleaseDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_config_release_detail_title")}
      subtitle={t("admin_config_release_detail_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href={releasesListHref}
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_config_release_detail_back_list")}
          </Link>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_config_releases_back")}
          </Link>
        </>
      }
    >
      {!releaseId ? (
        <AdminAlertError className="mt-6" message={t("admin_config_release_detail_missing_id")} />
      ) : null}

      {releaseId && loading ? (
        <AdminListLoadingStatus message={t("admin_config_release_detail_loading")} className="mt-6 text-body text-ink-500" />
      ) : null}

      {releaseId && error && (
        <AdminListFetchError
          className="mt-6"
          errorKind={error}
          message={adminErrorUserText(error, t)}
        />
      )}

      <AdminMetaBuildSection meta={meta} loading={Boolean(releaseId) && loading} error={releaseId ? error : null} />

      {releaseId && !loading && !error && release && (
        <section
          className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} shadow-soft`}
          aria-label={t("admin_config_release_detail_section_aria")}
        >
          <p className="text-meta text-ink-500">
            {t("admin_config_release_detail_id_label")}:{" "}
            <span className="font-mono text-ink-800">{release.id ?? releaseId}</span>
          </p>
          <dl className="mt-4 grid gap-3 text-body text-ink-800 sm:grid-cols-2">
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colKey")}</dt>
              <dd className="font-mono text-small">{release.release_key ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colLabel")}</dt>
              <dd className="font-mono text-small">{release.version_label ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colStatus")}</dt>
              <dd className="font-mono text-small">{release.status ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colEffective")}</dt>
              <dd className="font-mono text-small">{release.effective_from ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colRollback")}</dt>
              <dd className="font-mono text-small">{release.rolled_back_at ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_release_detail_created")}</dt>
              <dd className="font-mono text-small">{release.created_at ?? t("admin_em_dash")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("admin_config_release_detail_updated")}</dt>
              <dd className="font-mono text-small">{release.updated_at ?? t("admin_em_dash")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("admin_config_release_detail_notes")}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-small text-ink-700">
                {release.notes?.trim() ? release.notes : t("admin_em_dash")}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </AdminDetailPageChrome>
  );
}
