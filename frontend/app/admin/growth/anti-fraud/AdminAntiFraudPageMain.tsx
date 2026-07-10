"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsPlanePermissionBanners } from "@/components/admin/ops/AdminOpsPlanePermissionBanners";

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
import { adminConfirmGrowthFraudStatus } from "@/lib/admin/adminOpsWriteConfirm";
import { adminGrowthFraudStatusLabel } from "@/lib/admin/adminGeoValidationLabels";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";

import { useAdminAntiFraudPage } from "./useAdminAntiFraudPage";

export function AdminAntiFraudPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    rules,
    signals,
    scanRuns,
    users,
    loading,
    error,
    busyUserId,
    statusFilter,
    setStatusFilter,
    reload,
    setUserStatus,
    fraudStatuses,
  } = useAdminAntiFraudPage();
  const requestConfirm = useAdminL5ConfirmRequest();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_growth_anti_fraud_title")}
      subtitle={t("admin_growth_anti_fraud_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.GROWTH_READ} write={ADMIN_PERM.GROWTH_WRITE} publish={ADMIN_PERM.GROWTH_PUBLISH} fraud={ADMIN_PERM.GROWTH_FRAUD} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_anti_fraud" variant="warning" />
      <OfficialOpsFilterBar dataAttr="anti-fraud">
        <label className="flex items-center gap-2">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_anti_fraud_filter_all")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-tt-admin-growth-anti-fraud-filter="1"
          >
            <option value="">{t("admin_growth_anti_fraud_filter_all")}</option>
            {fraudStatuses.map((s) => (
              <option key={s} value={s}>
                {t(adminGrowthFraudStatusLabel(s))}
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
          {t("admin_growth_anti_fraud_reload")}
        </button>
      </OfficialOpsFilterBar>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="ops_plane_loading"
        empty={
          !loading &&
          !error &&
          rules.length === 0 &&
          signals.length === 0 &&
          scanRuns.length === 0 &&
          users.length === 0
        }
        emptyMessageKey="ops_plane_empty"
      >
      <OfficialOpsPanelCard title={t("admin_growth_anti_fraud_rules_title")} dataAttrs={{ "data-tt-admin-growth-anti-fraud-rules": "1" }}>
        {rules.length === 0 ? (
          <p className="mt-2 text-body-s text-ink-600">{t("admin_growth_anti_fraud_rules_empty")}</p>
        ) : (
          <ul className="mt-2 space-y-2 text-body-s">
            {rules.map((r) => (
              <li key={r.id} className={`${ADMIN_FILTER_CARD_CLASS} p-2`}>
                <span className="font-medium">{r.signal_type}</span> · {r.risk_level} — {r.description}
              </li>
            ))}
          </ul>
        )}
      </OfficialOpsPanelCard>

      <OfficialOpsPanelCard title={t("admin_growth_anti_fraud_signals_title")} dataAttrs={{ "data-tt-admin-growth-anti-fraud-signals": "1" }}>
        {signals.length === 0 ? (
          <p className="mt-2 text-body-s text-ink-600">{t("admin_growth_anti_fraud_signals_empty")}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-body-s">
            {signals.map((s) => (
              <li key={s.id}>
                {s.signal_type} · {s.risk_level} · {s.subject_user_id.slice(0, 8)}… ·{" "}
                {s.created_at?.slice(0, 19) ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </OfficialOpsPanelCard>

      <OfficialOpsPanelCard title={t("admin_growth_anti_fraud_scan_runs_title")} dataAttrs={{ "data-tt-admin-growth-anti-fraud-scan-runs": "1" }}>
        {scanRuns.length === 0 ? (
          <p className="mt-2 text-body-s text-ink-600">{t("admin_growth_anti_fraud_scan_runs_empty")}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-body-s">
            {scanRuns.map((r) => (
              <li key={r.id}>
                {r.trigger} · {r.outcome} · {r.subject_user_id.slice(0, 8)}… ·{" "}
                {r.created_at?.slice(0, 19) ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </OfficialOpsPanelCard>

      <OfficialOpsPanelCard title={t("admin_growth_anti_fraud_users_title")} dataAttrs={{ "data-tt-admin-growth-anti-fraud-users": "1" }}>
        {users.length === 0 ? (
          <p className="mt-2 text-body-s text-ink-600">{t("admin_growth_anti_fraud_users_empty")}</p>
        ) : (
          <OfficialOpsDataTable dataAttr="anti-fraud-users">
            <OfficialOpsTableHead>
              <tr>
                <OfficialOpsTableTh>{t("admin_growth_anti_fraud_col_user")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{t("admin_growth_anti_fraud_col_code")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{t("admin_growth_anti_fraud_col_status")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{t("admin_growth_anti_fraud_col_signals")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{t("admin_growth_anti_fraud_col_points")}</OfficialOpsTableTh>
                <OfficialOpsTableTh>{"\u00a0"}</OfficialOpsTableTh>
              </tr>
            </OfficialOpsTableHead>
            <OfficialOpsTableBody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-xs`}>{u.user_id}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{u.referral_code ?? "—"}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{t(adminGrowthFraudStatusLabel(u.growth_fraud_status))}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{u.signal_count}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{u.growth_points}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-2`}>
                      {u.growth_fraud_status !== "points_frozen" ? (
                        <button
                          type="button"
                          disabled={busyUserId === u.user_id}
                          className="text-ref-sun underline disabled:opacity-50"
                          onClick={() =>
                            requestConfirm(
                              adminConfirmGrowthFraudStatus("freeze", () =>
                                setUserStatus(u.user_id, "points_frozen"),
                              ),
                            )
                          }
                        >
                          {t("admin_growth_anti_fraud_freeze")}
                        </button>
                      ) : null}
                      {u.growth_fraud_status !== "normal" ? (
                        <button
                          type="button"
                          disabled={busyUserId === u.user_id}
                          className="text-ref-sun underline disabled:opacity-50"
                          onClick={() =>
                            requestConfirm(
                              adminConfirmGrowthFraudStatus("unfreeze", () =>
                                setUserStatus(u.user_id, "normal"),
                              ),
                            )
                          }
                        >
                          {t("admin_growth_anti_fraud_unfreeze")}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
            </OfficialOpsTableBody>
          </OfficialOpsDataTable>
        )}
      </OfficialOpsPanelCard>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
