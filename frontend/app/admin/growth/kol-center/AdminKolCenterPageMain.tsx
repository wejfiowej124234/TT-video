"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import {
  OfficialOpsFilterBar,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/components/admin/ops/OfficialOpsFilterBar";
import { OfficialOpsPanelCard } from "@/components/admin/ops/OfficialOpsPanelCard";

import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";

import { useAdminKolCenterPage } from "./useAdminKolCenterPage";

export function AdminKolCenterPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    days,
    setDays,
    windowOptions,
    items,
    selectedId,
    detail,
    loading,
    detailLoading,
    error,
    reload,
    loadDetail,
  } = useAdminKolCenterPage();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_growth_kol_title")}
      subtitle={t("admin_growth_kol_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.GROWTH_READ} write={ADMIN_PERM.GROWTH_WRITE} publish={ADMIN_PERM.GROWTH_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_kol_center" variant="info" />
      <p className="mb-4 text-body-s text-ink-600" data-tt-admin-growth-kol-disclaimer="1">
        {t("admin_growth_kol_disclaimer")}
      </p>

      <OfficialOpsFilterBar dataAttr="kol-window">
        <label className="flex items-center gap-2" htmlFor="kol-center-window">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_analytics_window_label")}</span>
          <select
            id="kol-center-window"
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            data-tt-admin-growth-kol-window="1"
          >
            {windowOptions.map((opt) => (
              <option key={opt.days} value={opt.days}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={loading}
          onClick={() => void reload()}
        >
          {t("admin_growth_kol_reload")}
        </button>
      </OfficialOpsFilterBar>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="ops_plane_loading"
        empty={!loading && !error && items.length === 0}
        emptyMessageKey="admin_growth_kol_empty"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <OfficialOpsDataTable dataAttr="growth-kol-list">
            <OfficialOpsTableHead>
              <tr>
                <OfficialOpsTableTh>{t("admin_growth_kol_col_code")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{t("admin_growth_kol_col_invites")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{t("admin_growth_kol_col_points")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{t("admin_growth_kol_col_active")}</OfficialOpsTableTh>
              </tr>
            </OfficialOpsTableHead>
            <OfficialOpsTableBody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer ${selectedId === row.id ? "bg-ref-sun/8" : ""}`}
                  onClick={() => void loadDetail(row.id)}
                >
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.code}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.invite_count}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.points_awarded}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.is_active ? "✓" : "—"}</td>
                </tr>
              ))}
            </OfficialOpsTableBody>
          </OfficialOpsDataTable>

          <OfficialOpsPanelCard
            title={t("admin_growth_kol_detail_title")}
            dataAttrs={{ "data-tt-admin-growth-kol-detail": "1" }}
            className="mb-0"
          >
            {detailLoading ? (
              <p className="mt-2 text-body-s text-ink-600">…</p>
            ) : detail ? (
              <div className="mt-2 space-y-3 text-body-s">
                <p>
                  {t("admin_growth_kol_col_code")}: <strong>{detail.item.code}</strong>
                </p>
                {detail.item.label ? <p>{detail.item.label}</p> : null}
                <p>
                  {t("admin_growth_kol_col_invites")}: {detail.item.invite_count} ·{" "}
                  {t("admin_growth_kol_col_uses")}: {detail.item.use_count}
                </p>
                {detail.recent_invites.length > 0 ? (
                  <ul className="space-y-1">
                    {detail.recent_invites.map((ev) => (
                      <li key={`${ev.referred_user_id}-${ev.created_at}`}>
                        {ev.referred_user_id.slice(0, 8)} · +{ev.points_awarded_referrer} ·{" "}
                        {new Date(ev.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-600">{t("admin_growth_kol_no_invites")}</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-body-s text-ink-600">{t("admin_growth_kol_select_hint")}</p>
            )}
          </OfficialOpsPanelCard>
        </div>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
