"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { adminConfirmPesAnalyticsClear } from "@/lib/admin/adminOpsWriteConfirm";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_KPI_CARD_IDLE_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";
import { PES_AB_TEST_REGISTRY } from "@/lib/conversionAnalyticsAbRegistry";
import {
  buildConversionAnalyticsSnapshot,
  clearPesAnalyticsEvents,
  exportPesAnalyticsJson,
  getPesAnalyticsEvents,
  type ConversionAnalyticsSnapshot,
} from "@/lib/conversionAnalyticsLayer";
import { PES_TOUCHPOINT_ORDER } from "@/lib/productEnhancementSprint";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function MetricCard({ label, value, admin }: { label: string; value: string | number; admin?: boolean }) {
  const cardClass = admin
    ? ADMIN_KPI_CARD_IDLE_CLASS
    : "rounded-[var(--radius-md)] border border-ink-200/80 bg-white px-3 py-2.5 dark:border-ink-600/40 dark:bg-ink-900/40";
  return (
    <div className={cardClass}>
      <p className="text-meta text-ink-500 dark:text-ink-400">{label}</p>
      <p className="text-h4 font-semibold text-ink-900 dark:text-ink-50 tabular-nums">{value}</p>
    </div>
  );
}

function FunnelTableShell({
  admin,
  dataAttr,
  title,
  ariaLabel,
  children,
}: {
  admin: boolean;
  dataAttr: string;
  title: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={ariaLabel}>
      <h3 className="mb-2 text-body font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      {admin ? (
        <OfficialOpsDataTable dataAttr={dataAttr}>{children}</OfficialOpsDataTable>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-ink-200/80 dark:border-ink-600/40">
          <table className="min-w-full text-small">{children}</table>
        </div>
      )}
    </section>
  );
}

function FunnelThead({ admin, children }: { admin: boolean; children: ReactNode }) {
  if (admin) return <OfficialOpsTableHead>{children}</OfficialOpsTableHead>;
  return <thead className="bg-ink-50/80 dark:bg-ink-900/50">{children}</thead>;
}

function FunnelTh({ admin, children, align = "left" }: { admin: boolean; children: ReactNode; align?: "left" | "right" }) {
  if (admin) return <OfficialOpsTableTh>{children}</OfficialOpsTableTh>;
  return (
    <th className={`px-3 py-2 font-medium text-ink-600 dark:text-ink-300 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function FunnelTbody({ admin, children }: { admin: boolean; children: ReactNode }) {
  if (admin) return <OfficialOpsTableBody>{children}</OfficialOpsTableBody>;
  return <tbody>{children}</tbody>;
}

function FunnelTd({
  admin,
  children,
  align = "left",
}: {
  admin: boolean;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const alignClass = align === "right" ? "text-right tabular-nums" : "";
  if (admin) return <td className={`${ADMIN_TABLE_TD_CELL_CLASS} ${alignClass}`.trim()}>{children}</td>;
  return (
    <td className={`px-3 py-2 text-ink-800 dark:text-ink-100 ${alignClass}`.trim()}>{children}</td>
  );
}

function FunnelRow({ admin, children }: { admin: boolean; children: ReactNode }) {
  if (admin) return <tr>{children}</tr>;
  return <tr className="border-t border-ink-100 dark:border-ink-700/50">{children}</tr>;
}

export type ConversionFunnelDashboardProps = {
  className?: string;
  /** Admin 暖金 L5 · 与营销页默认白底区分 */
  variant?: "marketing" | "admin";
};

/** Wave 3 · 转化漏斗看板（客户端聚合 · 无 API） */
export function ConversionFunnelDashboard({ className = "", variant = "marketing" }: ConversionFunnelDashboardProps) {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const admin = variant === "admin";
  const btnPrimary = admin
    ? adminTableRowPrimaryActionClass()
    : `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-meta font-medium text-ink-800 hover:bg-ink-50 dark:border-ink-600 dark:bg-ink-800 dark:text-ink-100 ${travelFocusRingCoreOffset2Classes}`;
  const btnSecondary = admin
    ? adminTableRowSecondaryActionClass()
    : `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 text-meta font-medium text-cyan-800 dark:text-cyan-100 ${travelFocusRingCoreOffset2Classes}`;
  const btnClear = admin
    ? adminTableRowSecondaryActionClass()
    : `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-warning/45 bg-warning/10 px-3 py-2 text-meta font-medium text-ink-800 dark:text-ink-100 ${travelFocusRingCoreOffset2Classes}`;
  const listRowClass = admin
    ? `${ADMIN_FILTER_CARD_CLASS} flex justify-between px-3 py-1.5 text-small`
    : "flex justify-between rounded-[var(--radius-sm)] bg-ink-50/60 px-3 py-1.5 text-small dark:bg-ink-900/30";

  const snapshot: ConversionAnalyticsSnapshot = useMemo(() => {
    void tick;
    return buildConversionAnalyticsSnapshot(getPesAnalyticsEvents());
  }, [tick]);

  return (
    <div
      className={`space-y-8 ${className}`}
      data-tt-pes-funnel-dashboard="1"
      {...(admin ? { "data-tt-admin-conversion-funnel-admin-l5": "1" } : {})}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-h3 font-semibold text-ink-900 dark:text-ink-50">{t("pes3_dashboard_title")}</h2>
          <p className="mt-1 text-small text-ink-600 dark:text-ink-300">{t("pes3_dashboard_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} className={btnPrimary}>
            {t("pes3_dashboard_refresh")}
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([exportPesAnalyticsJson()], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `pes-conversion-analytics-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className={btnSecondary}
          >
            {t("pes3_dashboard_export")}
          </button>
          <button
            type="button"
            onClick={() =>
              requestConfirm(
                adminConfirmPesAnalyticsClear(() => {
                  clearPesAnalyticsEvents();
                  refresh();
                }),
              )
            }
            className={btnClear}
          >
            {t("pes3_dashboard_clear")}
          </button>
        </div>
      </div>

      <section aria-label={t("pes3_dashboard_kpi_aria")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard admin={admin} label={t("pes3_kpi_events")} value={snapshot.totalEvents} />
          <MetricCard admin={admin} label={t("pes3_kpi_sessions")} value={snapshot.uniqueSessions} />
          <MetricCard admin={admin} label={t("pes3_kpi_registration")} value={snapshot.registrationIntents} />
          <MetricCard admin={admin} label={t("pes3_kpi_identity")} value={snapshot.identityIntents} />
          <MetricCard admin={admin} label={t("pes3_kpi_guide_recruit")} value={snapshot.guideRecruitClicks} />
          <MetricCard admin={admin} label={t("pes3_kpi_governance")} value={snapshot.governanceParticipation} />
        </div>
      </section>

      <FunnelTableShell
        admin={admin}
        dataAttr="conversion-funnel-stages"
        title={t("pes3_funnel_table_title")}
        ariaLabel={t("pes3_funnel_table_aria")}
      >
        <FunnelThead admin={admin}>
          <tr>
            <FunnelTh admin={admin}>{t("pes3_col_stage")}</FunnelTh>
            <FunnelTh admin={admin} align="right">
              {t("pes3_col_sessions")}
            </FunnelTh>
            <FunnelTh admin={admin} align="right">
              {t("pes3_col_events")}
            </FunnelTh>
          </tr>
        </FunnelThead>
        <FunnelTbody admin={admin}>
          {snapshot.funnelStages.map((row) => (
            <FunnelRow admin={admin} key={row.stageId}>
              <FunnelTd admin={admin}>{t(row.labelKey)}</FunnelTd>
              <FunnelTd admin={admin} align="right">
                {row.sessions}
              </FunnelTd>
              <FunnelTd admin={admin} align="right">
                {row.events}
              </FunnelTd>
            </FunnelRow>
          ))}
        </FunnelTbody>
      </FunnelTableShell>

      <FunnelTableShell
        admin={admin}
        dataAttr="conversion-funnel-dropoff"
        title={t("pes3_dropoff_matrix_title")}
        ariaLabel={t("pes3_dropoff_matrix_aria")}
      >
        <FunnelThead admin={admin}>
          <tr>
            <FunnelTh admin={admin}>{t("pes3_col_from")}</FunnelTh>
            <FunnelTh admin={admin}>{t("pes3_col_to")}</FunnelTh>
            <FunnelTh admin={admin} align="right">
              {t("pes3_col_dropoff")}
            </FunnelTh>
            <FunnelTh admin={admin} align="right">
              {t("pes3_col_retention")}
            </FunnelTh>
          </tr>
        </FunnelThead>
        <FunnelTbody admin={admin}>
          {snapshot.dropoffMatrix.map((row) => (
            <FunnelRow admin={admin} key={`${row.fromStageId}-${row.toStageId}`}>
              <FunnelTd admin={admin}>{row.fromStageId}</FunnelTd>
              <FunnelTd admin={admin}>{row.toStageId}</FunnelTd>
              <FunnelTd admin={admin} align="right">
                <span className="text-warning">{pct(row.dropoffRate)}</span>
              </FunnelTd>
              <FunnelTd admin={admin} align="right">
                <span className="text-emerald-400">{pct(row.retentionRate)}</span>
              </FunnelTd>
            </FunnelRow>
          ))}
        </FunnelTbody>
      </FunnelTableShell>

      <section className="grid gap-6 lg:grid-cols-2" aria-label={t("pes3_touchpoint_stats_aria")}>
        <div>
          <h3 className="mb-2 text-body font-semibold text-ink-900 dark:text-ink-50">{t("pes3_touchpoint_views_title")}</h3>
          <ul className="space-y-1 text-small">
            {PES_TOUCHPOINT_ORDER.map((tp) => {
              const row = snapshot.touchpointViews.find((r) => r.touchpoint === tp);
              return (
                <li key={tp} className={listRowClass}>
                  <span className="text-ink-700 dark:text-ink-200">{tp}</span>
                  <span className="tabular-nums font-medium text-ink-900 dark:text-ink-50">{row?.count ?? 0}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-body font-semibold text-ink-900 dark:text-ink-50">{t("pes3_cta_clicks_title")}</h3>
          <ul className="space-y-1 text-small">
            {PES_TOUCHPOINT_ORDER.map((tp) => {
              const row = snapshot.ctaClicks.find((r) => r.touchpoint === tp);
              return (
                <li key={tp} className={listRowClass}>
                  <span className="text-ink-700 dark:text-ink-200">{tp}</span>
                  <span className="tabular-nums font-medium text-ink-900 dark:text-ink-50">{row?.count ?? 0}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <FunnelTableShell
        admin={admin}
        dataAttr="conversion-funnel-ab"
        title={t("pes3_ab_registry_title")}
        ariaLabel={t("pes3_ab_registry_aria")}
      >
        <FunnelThead admin={admin}>
          <tr>
            <FunnelTh admin={admin}>{t("pes3_col_test")}</FunnelTh>
            <FunnelTh admin={admin}>{t("pes3_col_variant")}</FunnelTh>
            <FunnelTh admin={admin} align="right">
              {t("pes3_col_exposures")}
            </FunnelTh>
            <FunnelTh admin={admin} align="right">
              {t("pes3_col_conversions")}
            </FunnelTh>
            <FunnelTh admin={admin} align="right">
              {t("pes3_col_cvr")}
            </FunnelTh>
          </tr>
        </FunnelThead>
        <FunnelTbody admin={admin}>
          {PES_AB_TEST_REGISTRY.flatMap((test) =>
            test.variants.map((variantKey) => {
              const row = snapshot.abTests.find((r) => r.testId === test.id && r.variant === variantKey);
              return (
                <FunnelRow admin={admin} key={`${test.id}-${variantKey}`}>
                  <FunnelTd admin={admin}>
                    <span className="font-medium">{test.id}</span>
                    <span className="block text-meta text-ink-500">{t(test.hypothesisKey)}</span>
                  </FunnelTd>
                  <FunnelTd admin={admin}>{variantKey}</FunnelTd>
                  <FunnelTd admin={admin} align="right">
                    {row?.exposures ?? 0}
                  </FunnelTd>
                  <FunnelTd admin={admin} align="right">
                    {row?.conversions ?? 0}
                  </FunnelTd>
                  <FunnelTd admin={admin} align="right">
                    {pct(row?.conversionRate ?? 0)}
                  </FunnelTd>
                </FunnelRow>
              );
            }),
          )}
        </FunnelTbody>
      </FunnelTableShell>
    </div>
  );
}
