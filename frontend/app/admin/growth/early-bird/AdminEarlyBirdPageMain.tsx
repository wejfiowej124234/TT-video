"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";

import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import {
  adminConfirmEarlyBirdMultiplier,
  adminConfirmEarlyBirdToggle,
} from "@/lib/admin/adminOpsWriteConfirm";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";

import { useAdminEarlyBirdPage } from "./useAdminEarlyBirdPage";

export function AdminEarlyBirdPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const {
    stages,
    userCounts,
    summary,
    loading,
    error,
    busy,
    reload,
    toggleActive,
    saveMultiplier,
  } = useAdminEarlyBirdPage();
  const [editMult, setEditMult] = useState<Record<number, string>>({});

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_growth_early_bird_title")}
      subtitle={t("admin_growth_early_bird_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.GROWTH_READ} write={ADMIN_PERM.GROWTH_WRITE} publish={ADMIN_PERM.GROWTH_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_early_bird" variant="info" />

      <section className={`mb-6 ${ADMIN_FILTER_CARD_CLASS}`} data-tt-admin-growth-early-bird-lead="1">
        <h2 className="text-body font-medium text-ink-900">{t("admin_growth_early_bird_lead_title")}</h2>
        <p className={`mt-2 ${ADMIN_FILTER_HINT_CLASS}`}>{t("admin_growth_early_bird_lead_body")}</p>
        <p className={`mt-2 ${ADMIN_FILTER_HINT_CLASS}`}>{t("admin_growth_early_bird_scope_note")}</p>
      </section>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="ops_plane_loading"
        empty={!loading && !error && stages.length === 0}
        emptyMessageKey="admin_growth_early_bird_empty"
        skeleton
      >
        {summary ? (
          <section className={`mb-6 ${ADMIN_FILTER_CARD_CLASS}`} data-tt-admin-growth-early-bird-reconcile="1">
            <h2 className="text-body font-medium text-ink-900">{t("admin_growth_early_bird_reconcile_title")}</h2>
            <ul className={`mt-2 space-y-1 text-small text-ink-700`}>
              <li>
                {t("admin_growth_early_bird_next_rank")}: {summary.next_rank}
              </li>
              <li>
                {t("admin_growth_early_bird_users_with_rank")}: {summary.users_with_rank}
              </li>
              <li>
                {t("admin_growth_early_bird_users_with_stage")}: {summary.users_with_stage}
              </li>
              <li>
                {t("admin_growth_early_bird_mismatch")}: {summary.stage_mismatch_count}
              </li>
            </ul>
          </section>
        ) : null}

        <OfficialOpsDataTable dataAttr="early-bird">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_growth_early_bird_col_stage")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_early_bird_col_rank")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_early_bird_col_multiplier")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_early_bird_col_users")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_growth_early_bird_col_active")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {stages.map((row) => {
              const count = userCounts.find((c) => c.stage_number === row.stage_number)?.user_count ?? 0;
              return (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.stage_number}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    {row.user_rank_from}
                    {row.user_rank_to != null ? ` – ${row.user_rank_to}` : "+"}
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
                      <span className="sr-only">{t("admin_growth_early_bird_col_multiplier")}</span>
                      <input
                        className={`w-24 ${ADMIN_FILTER_INPUT_SM_CLASS}`}
                        type="number"
                        step="0.1"
                        min={0.1}
                        max={10}
                        value={editMult[row.stage_number] ?? String(row.multiplier)}
                        onChange={(e) => setEditMult((m) => ({ ...m, [row.stage_number]: e.target.value }))}
                      />
                    </label>
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{count}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.is_active ? "✓" : "—"}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className={adminTableRowSecondaryActionClass()}
                        onClick={() =>
                          requestConfirm(
                            adminConfirmEarlyBirdToggle(!row.is_active, () => toggleActive(row)),
                          )
                        }
                      >
                        {row.is_active ? t("admin_growth_early_bird_disable") : t("admin_growth_early_bird_enable")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={adminTableRowPrimaryActionClass()}
                        onClick={() => {
                          const raw = editMult[row.stage_number] ?? String(row.multiplier);
                          const n = Number(raw);
                          if (!Number.isFinite(n)) return;
                          requestConfirm(adminConfirmEarlyBirdMultiplier(() => saveMultiplier(row, n)));
                        }}
                      >
                        {t("admin_growth_early_bird_save_multiplier")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
