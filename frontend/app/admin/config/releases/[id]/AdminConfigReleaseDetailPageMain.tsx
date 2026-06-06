"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import { useId } from "react";

import { AdminConfigPlatformSubnav } from "@/components/admin/AdminConfigPlatformSubnav";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { useAdminConfigReleaseDetailPage } from "./useAdminConfigReleaseDetailPage";
import {
  ADMIN_DETAIL_FIELD_LABEL_CLASS,
  ADMIN_DETAIL_FIELD_ROW_CLASS,
  ADMIN_DETAIL_FIELD_VALUE_CLASS,
  ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";

export function AdminConfigReleaseDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { releaseId, releasesListHref, loading, refreshing, error, release, meta } =
    useAdminConfigReleaseDetailPage();

  return (
    <>
      <AdminConfigPlatformSubnav
        currentLabelKey="admin_config_release_detail_title"
        parent={{ href: releasesListHref, labelKey: "admin_config_releases_title" }}
      />
      <AdminDetailPageChrome
        titleId={pageTitleId}
        title={t("admin_config_release_detail_title")}
        subtitle={t("admin_config_release_detail_subtitle_l5")}
      >
        {!releaseId ? (
          <AdminAlertError className="mt-6" message={t("admin_config_release_detail_missing_id")} />
        ) : null}

        {releaseId && loading && !release ? (
          <AdminListLoadingStatus
            message={t("admin_config_release_detail_loading")}
            className="mt-6 text-body text-ink-500"
          />
        ) : null}

        {releaseId && error && !release && (
          <AdminListFetchError
            className="mt-6"
            errorKind={error}
            message={adminErrorUserText(error, t)}
          />
        )}

        <AdminMetaBuildSection meta={meta} loading={Boolean(releaseId) && loading && !release} error={releaseId ? error : null} />

        {releaseId && release && (
          <AdminDetailContentPanel
            as="section"
            className={`mt-6${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
            aria-label={t("admin_config_release_detail_section_aria")}
            data-tt-admin-config-release-detail-panel="1"
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
            <p className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>
              {t("admin_config_release_detail_id_label")}:{" "}
              <span className={`${ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS} break-all`}>{release.id ?? releaseId}</span>
            </p>
            <dl className="mt-4 grid gap-3 text-body sm:grid-cols-2">
              {(
                [
                  ["admin_config_releases_colKey", release.release_key],
                  ["admin_config_releases_colLabel", release.version_label],
                  ["admin_config_releases_colStatus", release.status],
                  ["admin_config_releases_colEffective", release.effective_from],
                  ["admin_config_releases_colRollback", release.rolled_back_at],
                  ["admin_config_release_detail_created", release.created_at],
                ] as const
              ).map(([labelKey, value]) => (
                <div key={labelKey} className={ADMIN_DETAIL_FIELD_ROW_CLASS}>
                  <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t(labelKey)}</dt>
                  <dd className={ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS}>{value ?? t("admin_em_dash")}</dd>
                </div>
              ))}
              <div className={`sm:col-span-2 ${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t("admin_config_release_detail_updated")}</dt>
                <dd className={ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS}>{release.updated_at ?? t("admin_em_dash")}</dd>
              </div>
              <div className={`sm:col-span-2 ${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t("admin_config_release_detail_notes")}</dt>
                <dd className={`${ADMIN_DETAIL_FIELD_VALUE_CLASS} mt-1 whitespace-pre-wrap`}>
                  {release.notes?.trim() ? release.notes : t("admin_em_dash")}
                </dd>
              </div>
            </dl>
          </AdminDetailContentPanel>
        )}
      </AdminDetailPageChrome>
    </>
  );
}
