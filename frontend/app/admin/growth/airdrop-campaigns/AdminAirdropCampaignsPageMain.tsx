"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";

import {
  OfficialOpsFilterBar,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/components/admin/ops/OfficialOpsFilterBar";
import { OfficialOpsPanelCard } from "@/components/admin/ops/OfficialOpsPanelCard";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";

import { useAdminAirdropCampaignsPage } from "./useAdminAirdropCampaignsPage";

export function AdminAirdropCampaignsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const vm = useAdminAirdropCampaignsPage();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_growth_airdrop_title")}
      subtitle={t("admin_growth_airdrop_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.GROWTH_READ} write={ADMIN_PERM.GROWTH_WRITE} publish={ADMIN_PERM.GROWTH_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_airdrop" variant="warning" />
      <p className="mb-4 text-meta text-ink-500">{t("admin_growth_airdrop_disclaimer")}</p>

      <OfficialOpsPanelCard
        title={t("admin_growth_airdrop_create_title")}
        dataAttrs={{ "data-tt-admin-growth-airdrop-create": "1" }}
        className="mb-6"
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            placeholder={t("admin_growth_airdrop_name_placeholder")}
            value={vm.newName}
            onChange={(e) => vm.setNewName(e.target.value)}
          />
          <input
            className={`w-40 ${ADMIN_FILTER_INPUT_SM_CLASS}`}
            type="number"
            min={1}
            placeholder={t("admin_growth_airdrop_pool_placeholder")}
            value={vm.newPool}
            onChange={(e) => vm.setNewPool(e.target.value)}
          />
          <button
            type="button"
            disabled={vm.busy}
            className={adminTableRowPrimaryActionClass()}
            onClick={() => void vm.createCampaign()}
          >
            {t("admin_growth_airdrop_create_btn")}
          </button>
        </div>
      </OfficialOpsPanelCard>

      <OpsPlaneFetchStates
        loading={vm.loading}
        error={vm.error}
        onRetry={() => void vm.reload()}
        loadingMessageKey="ops_plane_loading"
        empty={!vm.loading && !vm.error && vm.campaigns.length === 0}
        emptyMessageKey="admin_growth_airdrop_empty"
      >
        <div className="space-y-4" data-tt-admin-growth-airdrop-list="1">
          <OfficialOpsFilterBar dataAttr="airdrop-select">
            <label className="flex items-center gap-2 text-body-s">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_airdrop_select")}</span>
              <select
                className={ADMIN_FILTER_INPUT_SM_CLASS}
                value={vm.selectedId}
                onChange={(e) => vm.setSelectedId(e.target.value)}
              >
                <option value="">—</option>
                {vm.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </label>
          </OfficialOpsFilterBar>

          {vm.selected ? (
            <OfficialOpsPanelCard dataAttr="airdrop-detail" className="mb-0">
              <ul className="text-body-s space-y-1">
                <li>
                  {t("admin_growth_airdrop_col_status")}: {vm.selected.status}
                </li>
                <li>
                  {t("admin_growth_airdrop_col_pool")}: {vm.selected.gov_pool_amount}
                </li>
                <li>
                  {t("admin_growth_airdrop_col_snapshot_users")}:{" "}
                  {vm.selected.snapshot_user_count ?? "—"}
                </li>
                <li>
                  {t("admin_growth_airdrop_col_eligible_points")}:{" "}
                  {vm.selected.eligible_points_total ?? "—"}
                </li>
                <li>
                  {t("admin_growth_airdrop_col_calc_version")}:{" "}
                  {vm.selected.calculation_version ?? 0}
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={vm.busy || vm.selected.status !== "draft"}
                  className={adminTableRowSecondaryActionClass()}
                  onClick={() => void vm.runAction("snapshot")}
                >
                  {t("admin_growth_airdrop_snapshot_btn")}
                </button>
                <button
                  type="button"
                  disabled={vm.busy || vm.selected.status !== "snapshot_locked"}
                  className={adminTableRowSecondaryActionClass()}
                  onClick={() => void vm.runAction("calculate")}
                >
                  {t("admin_growth_airdrop_calculate_btn")}
                </button>
                <button
                  type="button"
                  disabled={
                    vm.busy ||
                    !["snapshot_locked", "calculated"].includes(vm.selected.status)
                  }
                  className={adminTableRowSecondaryActionClass()}
                  onClick={() => void vm.runAction("recalculate")}
                >
                  {t("admin_growth_airdrop_recalculate_btn")}
                </button>
                <button
                  type="button"
                  disabled={vm.busy || vm.exportInProgress || vm.selected.status === "draft"}
                  className={adminTableRowSecondaryActionClass()}
                  onClick={() => void vm.runAction("export")}
                >
                  {t("admin_growth_airdrop_export_btn")}
                </button>
              </div>
              {vm.exportInProgress ? (
                <p
                  className="mt-3 text-body-s text-ink-600"
                  data-tt-admin-growth-airdrop-export-progress="1"
                  role="status"
                  aria-live="polite"
                >
                  {t("admin_growth_airdrop_export_progress")}
                </p>
              ) : null}
            </OfficialOpsPanelCard>
          ) : null}

          {vm.reconcile ? (
            <OfficialOpsPanelCard
              title={t("admin_growth_airdrop_reconcile_title")}
              dataAttrs={{ "data-tt-admin-growth-airdrop-reconcile": "1" }}
              className="mb-0"
            >
              <ul className="mt-2 text-body-s space-y-1">
                <li>
                  {t("admin_growth_airdrop_reconcile_snapshots")}: {vm.reconcile.snapshot_rows}
                </li>
                <li>
                  {t("admin_growth_airdrop_reconcile_eligible")}: {vm.reconcile.eligible_rows}
                </li>
                <li>
                  {t("admin_growth_airdrop_reconcile_allocations")}: {vm.reconcile.allocation_rows}
                </li>
                <li>
                  {t("admin_growth_airdrop_reconcile_drift_points")}: {vm.reconcile.drift_points}
                </li>
                <li>
                  {t("admin_growth_airdrop_reconcile_gov_sum")}: {vm.reconcile.allocation_gov_sum}
                </li>
              </ul>
            </OfficialOpsPanelCard>
          ) : null}
        </div>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
