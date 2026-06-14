"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell } from "@/components/admin/content/AdminContentPageShell";
import { AdminContentKpiGrid, AdminContentKpiTile } from "@/components/admin/content/AdminContentKpiGrid";
import {
  AdminContentDataTable,
  AdminContentPanelCard,
  AdminContentTableBody,
  AdminContentTableHead,
  AdminContentTableTh,
} from "@/components/admin/content/AdminContentL5Surfaces";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";

import { useAdminContentCatalogDashboardPage } from "./useAdminContentCatalogDashboardPage";

export function AdminContentCatalogDashboardPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { entities, parity, parityPass, geo, stats, loading, error } = useAdminContentCatalogDashboardPage();

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_catalog_dashboard_title"
      subtitleKey="admin_content_catalog_dashboard_subtitle"
      loading={loading}
      error={error}
    >
      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_catalog_dashboard" variant="info" />
      <div data-tt-admin-content-catalog-dashboard="1">
        <AdminContentKpiGrid>
          <AdminContentKpiTile labelKey="admin_content_obs_revisions" value={stats.revisions} />
          <AdminContentKpiTile labelKey="admin_content_obs_rollbacks" value={stats.rollbacks} />
          <AdminContentKpiTile labelKey="admin_content_obs_import_batches" value={stats.batches} />
          <AdminContentKpiTile
            labelKey="admin_content_obs_parity"
            value={parityPass ? t("admin_content_parity_pass_label") : t("admin_content_parity_hold_label")}
          />
        </AdminContentKpiGrid>

        <div data-tt-admin-content-parity-list="1">
          <AdminContentPanelCard title={t("admin_content_parity_title")} className="mb-6">
            <AdminContentDataTable dataAttr="content-parity-list">
            <AdminContentTableHead>
              <tr>
                <AdminContentTableTh>{t("admin_content_col_id")}</AdminContentTableTh>
                <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
                <AdminContentTableTh>{t("admin_content_col_expected")}</AdminContentTableTh>
                <AdminContentTableTh>{t("admin_content_col_actual")}</AdminContentTableTh>
              </tr>
            </AdminContentTableHead>
            <AdminContentTableBody>
              {parity.map((row) => (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.id}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    {row.passed ? t("admin_content_parity_pass_label") : t("admin_content_parity_fail_label")}
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.expected}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.actual}</td>
                </tr>
              ))}
            </AdminContentTableBody>
          </AdminContentDataTable>
        </AdminContentPanelCard>
        </div>

        <AdminContentPanelCard title={t("admin_content_obs_entities_title")}>
          <AdminContentDataTable dataAttr="content-entity-stats">
            <AdminContentTableHead>
              <tr>
                <AdminContentTableTh>{t("admin_content_col_entity")}</AdminContentTableTh>
                <AdminContentTableTh>{t("admin_content_col_published")}</AdminContentTableTh>
                <AdminContentTableTh>{t("admin_content_col_in_review")}</AdminContentTableTh>
                <AdminContentTableTh>{t("admin_content_col_draft")}</AdminContentTableTh>
              </tr>
            </AdminContentTableHead>
            <AdminContentTableBody>
              {entities.map((row) => (
                <tr key={row.entity_type}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.entity_type}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.published}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.in_review}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.draft}</td>
                </tr>
              ))}
            </AdminContentTableBody>
          </AdminContentDataTable>
        </AdminContentPanelCard>

        {geo ? (
          <AdminContentPanelCard
            title={t("admin_content_geo_dashboard_section")}
            dataAttrs={{ "data-tt-admin-content-catalog-geo-summary": "1" }}
            className="mt-6"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-body-xs text-ink-500">{t("admin_content_geo_flag")}</div>
                <div className="text-body-m">
                  {geo.flags.catalog_server_geo_validation_enabled
                    ? t("admin_content_geo_flag_on")
                    : t("admin_content_geo_flag_off")}
                </div>
              </div>
              <div>
                <div className="text-body-xs text-ink-500">{t("admin_content_geo_meta_source")}</div>
                <div className="text-body-m">{geo.read_source.meta_read_source}</div>
              </div>
              <div>
                <div className="text-body-xs text-ink-500">{t("admin_content_geo_drift")}</div>
                <div className="text-body-m">
                  {geo.drift_detected ? t("admin_content_geo_drift_hold") : t("admin_content_geo_drift_go")}
                </div>
              </div>
            </div>
            <AdminContentPanelCard
              title={t("admin_content_consumer_opt_in_section")}
              dataAttrs={{ "data-tt-admin-content-catalog-consumer-summary": "1" }}
              className="mb-0 mt-4"
            >
              <div className="grid gap-2 text-body-s md:grid-cols-2">
                <div>
                  <span className="text-ink-500">{t("admin_content_consumer_enabled_flag")}: </span>
                  {geo.flags.next_public_catalog_api_enabled_env
                    ? t("admin_content_geo_flag_on")
                    : t("admin_content_geo_flag_off")}
                </div>
                <div className="text-ink-600">{t("admin_content_consumer_staging_note")}</div>
              </div>
            </AdminContentPanelCard>
          </AdminContentPanelCard>
        ) : null}
      </div>
    </AdminContentPageShell>
  );
}
