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

import { useAdminContentGeoValidationPage } from "./useAdminContentGeoValidationPage";

export function AdminContentGeoValidationPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { summary, history, loading, error } = useAdminContentGeoValidationPage();

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_geo_validation_title"
      subtitleKey="admin_content_geo_validation_subtitle"
      loading={loading}
      error={error}
    >
      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_geo_validation" variant="info" />
      {summary ? (
        <div data-tt-admin-content-geo-validation="1" className="space-y-6">
          <AdminContentKpiGrid>
            <AdminContentKpiTile
              labelKey="admin_content_geo_flag"
              value={
                summary.flags.catalog_server_geo_validation_enabled
                  ? t("admin_content_geo_flag_on")
                  : t("admin_content_geo_flag_off")
              }
            />
            <AdminContentKpiTile labelKey="admin_content_geo_meta_source" value={summary.read_source.meta_read_source} />
            <AdminContentKpiTile
              labelKey="admin_content_geo_post_source"
              value={summary.read_source.post_itineraries_geo_source}
            />
            <AdminContentKpiTile
              labelKey="admin_content_geo_drift"
              value={t(summary.drift_detected ? "admin_content_geo_drift_hold" : "admin_content_geo_drift_go")}
            />
          </AdminContentKpiGrid>

          <AdminContentPanelCard title={t("admin_content_geo_dual_write_order")}>
            <p className="text-body-s text-ink-600">{summary.read_source.dual_write_order}</p>
          </AdminContentPanelCard>

          <AdminContentPanelCard title={t("admin_content_geo_fe_flag")}>
            <p className="text-body-s text-ink-600">
              {t("admin_content_consumer_enabled_flag")}：{" "}
              {summary.flags.next_public_catalog_api_enabled_env
                ? t("admin_content_geo_flag_on")
                : t("admin_content_geo_flag_off")}
              — {summary.flags.next_public_catalog_api_enabled_note}
            </p>
          </AdminContentPanelCard>

          <div data-tt-admin-content-geo-meta-parity="1">
            <AdminContentPanelCard title={t("admin_content_geo_meta_parity_title")}>
              <AdminContentDataTable dataAttr="geo-meta-parity">
              <AdminContentTableHead>
                <tr>
                  <AdminContentTableTh>#</AdminContentTableTh>
                  <AdminContentTableTh>{t("admin_content_col_iso")}</AdminContentTableTh>
                  <AdminContentTableTh>{t("admin_content_field_name_zh")}</AdminContentTableTh>
                  <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
                </tr>
              </AdminContentTableHead>
              <AdminContentTableBody>
                {summary.meta_product_countries_parity.map((row) => (
                  <tr key={row.index}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.index}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      {row.core_iso}
                      {row.catalog_iso && row.catalog_iso !== row.core_iso ? ` ≠ ${row.catalog_iso}` : ""}
                    </td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.core_name_zh}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      {row.passed ? t("admin_content_geo_parity_pass") : t("admin_content_geo_parity_fail")}
                    </td>
                  </tr>
                ))}
              </AdminContentTableBody>
            </AdminContentDataTable>
            </AdminContentPanelCard>
          </div>

          <div data-tt-admin-content-geo-drift-list="1">
            <AdminContentPanelCard title={t("admin_content_geo_drift_title")}>
              <AdminContentDataTable dataAttr="geo-drift-list">
              <AdminContentTableHead>
                <tr>
                  <AdminContentTableTh>{t("admin_content_col_id")}</AdminContentTableTh>
                  <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
                  <AdminContentTableTh>{t("admin_content_col_detail")}</AdminContentTableTh>
                </tr>
              </AdminContentTableHead>
              <AdminContentTableBody>
                {summary.drift_items.map((row) => (
                  <tr key={row.id}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.id}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      {row.passed ? t("admin_content_geo_parity_pass") : t("admin_content_geo_parity_fail")}
                    </td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.detail}</td>
                  </tr>
                ))}
              </AdminContentTableBody>
            </AdminContentDataTable>
            </AdminContentPanelCard>
          </div>

          <div data-tt-admin-content-geo-validation-history="1">
            <AdminContentPanelCard title={t("admin_content_geo_history_title")}>
              <AdminContentDataTable dataAttr="geo-validation-history">
              <AdminContentTableHead>
                <tr>
                  <AdminContentTableTh>{t("admin_content_col_action")}</AdminContentTableTh>
                  <AdminContentTableTh>{t("admin_content_col_created")}</AdminContentTableTh>
                </tr>
              </AdminContentTableHead>
              <AdminContentTableBody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.action}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.created_at ?? "—"}</td>
                  </tr>
                ))}
              </AdminContentTableBody>
            </AdminContentDataTable>
            </AdminContentPanelCard>
          </div>
        </div>
      ) : null}
    </AdminContentPageShell>
  );
}
