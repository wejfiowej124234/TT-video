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
  adminTableRowSecondaryActionClass,
} from "@/components/admin/ops/OfficialOpsFilterBar";
import { OfficialOpsPanelCard } from "@/components/admin/ops/OfficialOpsPanelCard";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS } from "@/lib/adminUi";

import { useAdminGrowthAnalyticsPage } from "./useAdminGrowthAnalyticsPage";

export function AdminGrowthAnalyticsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    days,
    setDays,
    windowOptions,
    overview,
    funnel,
    topReferrers,
    loading,
    error,
    reload,
  } = useAdminGrowthAnalyticsPage();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_growth_analytics_title")}
      subtitle={t("admin_growth_analytics_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.GROWTH_READ} write={ADMIN_PERM.GROWTH_WRITE} publish={ADMIN_PERM.GROWTH_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_growth_analytics" variant="info" />
      <p className="mb-4 text-body-s text-ink-600" data-tt-admin-growth-analytics-disclaimer="1">
        {t("admin_growth_analytics_disclaimer")}
      </p>

      <OfficialOpsFilterBar dataAttr="growth-analytics">
        <label className="flex items-center gap-2" htmlFor="growth-analytics-window">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_analytics_window_label")}</span>
          <select
            id="growth-analytics-window"
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            data-tt-admin-growth-analytics-window="1"
          >
            {windowOptions.map((opt) => (
              <option key={opt.days} value={opt.days}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <div
          className="flex flex-wrap gap-2"
          data-tt-admin-growth-analytics-presets="1"
          role="group"
          aria-label={t("admin_growth_analytics_presets_aria")}
        >
          {[7, 30, 90].map((preset) => (
            <button
              key={preset}
              type="button"
              className={`rounded border px-2 py-1 text-body-s ${
                days === preset ? ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS : adminTableRowSecondaryActionClass()
              }`}
              data-tt-admin-growth-analytics-preset={preset}
              onClick={() => setDays(preset)}
            >
              {t(`admin_growth_analytics_window_${preset}d`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={loading}
          onClick={() => void reload()}
        >
          {t("admin_growth_analytics_reload")}
        </button>
      </OfficialOpsFilterBar>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="ops_plane_loading"
        empty={!loading && !error && !overview}
        emptyMessageKey="admin_growth_analytics_empty"
      >
      {overview ? (
        <div className="space-y-6" data-tt-admin-growth-analytics-overview="1">
          <OfficialOpsPanelCard title={t("admin_growth_analytics_summary_title")} className="mb-0">
            <ul className="mt-2 grid gap-2 text-body-s sm:grid-cols-2 lg:grid-cols-3">
              <li>{t("admin_growth_analytics_registrations")}: {overview.registrations_total}</li>
              <li>{t("admin_growth_analytics_with_referral")}: {overview.registrations_with_referral}</li>
              <li>{t("admin_growth_analytics_referral_events")}: {overview.referral_events_total}</li>
              <li>{t("admin_growth_analytics_users_with_points")}: {overview.users_with_points}</li>
              <li>{t("admin_growth_analytics_total_points")}: {overview.total_growth_points}</li>
              <li>
                {t("admin_growth_analytics_code_uses")}: {overview.referral_code_conversion_uses} /{" "}
                {overview.referral_code_active_count}
              </li>
              <li>
                {t("admin_growth_analytics_frozen_pct")}: {overview.frozen_or_ineligible_pct.toFixed(1)}% (
                {overview.frozen_or_ineligible_count})
              </li>
            </ul>
          </OfficialOpsPanelCard>

          {funnel && funnel.steps.length > 0 ? (
            <OfficialOpsPanelCard
              title={t("admin_growth_analytics_funnel_title")}
              dataAttrs={{ "data-tt-admin-growth-analytics-funnel": "1" }}
              className="mb-0"
            >
              <OfficialOpsDataTable dataAttr="growth-analytics-funnel">
                <OfficialOpsTableHead>
                  <tr>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_funnel_step")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_funnel_count")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_funnel_from_start")}</OfficialOpsTableTh>
                  </tr>
                </OfficialOpsTableHead>
                <OfficialOpsTableBody>
                  {funnel.steps.map((step) => (
                    <tr key={step.step}>
                      <td className="px-2 py-2">{t(`admin_growth_analytics_funnel_${step.step}`)}</td>
                      <td className="px-2 py-2">{step.count}</td>
                      <td className="px-2 py-2">{step.rate_from_start_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </OfficialOpsTableBody>
              </OfficialOpsDataTable>
            </OfficialOpsPanelCard>
          ) : null}

          <OfficialOpsPanelCard
            title={t("admin_growth_analytics_airdrop_title")}
            dataAttrs={{ "data-tt-admin-growth-analytics-airdrop": "1" }}
            className="mb-0"
          >
            <ul className="mt-2 space-y-1 text-body-s">
              <li>{t("admin_growth_analytics_airdrop_campaigns")}: {overview.airdrop.campaign_count}</li>
              <li>{t("admin_growth_analytics_airdrop_calculated")}: {overview.airdrop.calculated_count}</li>
              <li>{t("admin_growth_analytics_airdrop_snapshots")}: {overview.airdrop.total_snapshot_rows}</li>
              <li>{t("admin_growth_analytics_airdrop_eligible")}: {overview.airdrop.total_eligible_rows}</li>
              {overview.airdrop.latest_campaign_name ? (
                <li>
                  {t("admin_growth_analytics_airdrop_latest")}: {overview.airdrop.latest_campaign_name} (
                  {overview.airdrop.latest_campaign_status})
                </li>
              ) : null}
            </ul>
          </OfficialOpsPanelCard>

          {overview.early_bird_distribution.length > 0 ? (
            <OfficialOpsPanelCard title={t("admin_growth_analytics_early_bird_title")} className="mb-0">
              <OfficialOpsDataTable dataAttr="growth-analytics-early-bird">
                <OfficialOpsTableHead>
                  <tr>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_early_bird_stage")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_early_bird_users")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_early_bird_points")}</OfficialOpsTableTh>
                  </tr>
                </OfficialOpsTableHead>
                <OfficialOpsTableBody>
                  {overview.early_bird_distribution.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-2">{row.early_bird_stage ?? "—"}</td>
                      <td className="px-2 py-2">{row.user_count}</td>
                      <td className="px-2 py-2">{row.points_sum}</td>
                    </tr>
                  ))}
                </OfficialOpsTableBody>
              </OfficialOpsDataTable>
            </OfficialOpsPanelCard>
          ) : null}

          {overview.fraud_breakdown.length > 0 ? (
            <OfficialOpsPanelCard
              title={t("admin_growth_analytics_fraud_title")}
              dataAttrs={{ "data-tt-admin-growth-analytics-fraud": "1" }}
              className="mb-0"
            >
              <ul className="mt-2 space-y-1 text-body-s">
                {overview.fraud_breakdown.map((row) => (
                  <li key={row.growth_fraud_status}>
                    {row.growth_fraud_status}: {row.user_count}
                  </li>
                ))}
              </ul>
            </OfficialOpsPanelCard>
          ) : null}

          {topReferrers.length > 0 ? (
            <OfficialOpsPanelCard
              title={t("admin_growth_analytics_top_referrers_title")}
              dataAttrs={{ "data-tt-admin-growth-analytics-top-referrers": "1" }}
              className="mb-0"
            >
              <OfficialOpsDataTable dataAttr="growth-analytics-top-referrers">
                <OfficialOpsTableHead>
                  <tr>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_col_code")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_col_invites")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_col_points")}</OfficialOpsTableTh>
                    <OfficialOpsTableTh>{t("admin_growth_analytics_col_fraud")}</OfficialOpsTableTh>
                  </tr>
                </OfficialOpsTableHead>
                <OfficialOpsTableBody>
                  {topReferrers.map((row) => (
                    <tr key={row.user_id}>
                      <td className="px-2 py-2">{row.referral_code ?? row.email ?? row.user_id.slice(0, 8)}</td>
                      <td className="px-2 py-2">{row.invite_count}</td>
                      <td className="px-2 py-2">{row.points_awarded_referrer}</td>
                      <td className="px-2 py-2">{row.growth_fraud_status}</td>
                    </tr>
                  ))}
                </OfficialOpsTableBody>
              </OfficialOpsDataTable>
            </OfficialOpsPanelCard>
          ) : null}
        </div>
      ) : null}
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
