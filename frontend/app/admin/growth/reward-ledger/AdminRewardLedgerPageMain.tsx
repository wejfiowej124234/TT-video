"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";

import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminRewardLedgerPage } from "./useAdminRewardLedgerPage";

export function AdminRewardLedgerPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    items,
    driftItems,
    loading,
    error,
    busy,
    userIdFilter,
    setUserIdFilter,
    sourceFilter,
    setSourceFilter,
    fraudFilter,
    setFraudFilter,
    reload,
    fixDrift,
    markSuspect,
  } = useAdminRewardLedgerPage();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_growth_reward_ledger_title")}
      subtitle={t("admin_growth_reward_ledger_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.GROWTH_READ} write={ADMIN_PERM.GROWTH_WRITE} publish={ADMIN_PERM.GROWTH_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_reward_ledger" variant="info" />
      <section
        className={`mb-6 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-growth-reward-ledger-filters="1"
      >
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1">
            <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_growth_reward_ledger_user_filter")}
            </span>
            <input
              className={ADMIN_FILTER_INPUT_SM_CLASS}
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_growth_reward_ledger_source_filter")}
            </span>
            <input
              className={ADMIN_FILTER_INPUT_SM_CLASS}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_growth_reward_ledger_fraud_filter")}
            </span>
            <input
              className={ADMIN_FILTER_INPUT_SM_CLASS}
              value={fraudFilter}
              onChange={(e) => setFraudFilter(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`self-end ${adminTableRowPrimaryActionClass()}`}
            disabled={loading || busy}
            onClick={() => void reload()}
          >
            {t("admin_growth_reward_ledger_reload")}
          </button>
        </div>
      </section>

      {driftItems.length > 0 ? (
        <AdminNoticeBanner
          tone="warning"
          className="mb-6"
          dataAttrs={{ "data-tt-admin-growth-ledger-drift": "1" }}
          message={
            <>
              <h2 className="text-body-m font-medium">{t("admin_growth_reward_ledger_drift_title")}</h2>
              <ul className="mt-2 text-body-s">
                {driftItems.map((d) => (
                  <li key={d.user_id} className="flex flex-wrap items-center gap-2">
                    <span>
                      {d.user_id}: cache={d.cached_points} ledger={d.ledger_sum} drift={d.drift}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      className="text-ref-sun underline disabled:opacity-50"
                      onClick={() => void fixDrift(d.user_id)}
                    >
                      {t("admin_growth_reward_ledger_fix_drift")}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          }
        />
      ) : (
        <p className="mb-4 text-body-s text-ink-600" data-tt-admin-growth-ledger-drift-ok="1">
          {t("admin_growth_reward_ledger_drift_ok")}
        </p>
      )}

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="ops_plane_loading"
        empty={!loading && !error && items.length === 0}
        emptyMessageKey="admin_growth_reward_ledger_empty"
      >
        <OfficialOpsDataTable dataAttr="growth-ledger-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_growth_reward_ledger_col_created")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_reward_ledger_col_user")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_reward_ledger_col_source")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_reward_ledger_col_points")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_reward_ledger_col_fraud")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_reward_ledger_col_idempotency")}</OfficialOpsTableTh>
              <OfficialOpsTableTh />
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.created_at?.slice(0, 19) ?? "—"}</td>
                <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-xs`}>{row.user_id}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.source}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.points}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.fraud_status ?? "cleared"}</td>
                <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-xs`}>{row.idempotency_key}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                  {row.fraud_status === "cleared" || !row.fraud_status ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="text-ref-sun underline disabled:opacity-50"
                      onClick={() => void markSuspect(row.id)}
                    >
                      {t("admin_growth_reward_ledger_mark_suspect")}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
