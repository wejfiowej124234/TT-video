"use client";

import { adminPageNavLinkClass,
  ADMIN_TEXT_SECONDARY_CLASS,
} from "@/lib/adminUi";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminOpsHubNavTiles } from "@/components/admin/ops/AdminOpsHubNavTiles";
import { AdminFinanceThreeTrackMapSection } from "@/components/admin/AdminFinanceThreeTrackMapSection";
import { AdminHomeTreasuryPoolStrip } from "@/components/admin/AdminHomeTreasuryPoolStrip";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { travelFocusRingOffset2Classes, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { financeSuiteNavTiles } from "@/lib/admin/financeOpsL5";
import { FINANCE_SUITE_MODULES } from "./adminFinanceSuitePageModel";
import { AdminFinanceWorkflowStrip } from "@/components/admin/AdminFinanceWorkflowStrip";
import { AdminFinanceSuiteSupplementStrip } from "@/components/admin/AdminFinanceSuiteSupplementStrip";
import { AdminFinancePspPhase2DepthNotice } from "@/components/admin/AdminFinancePspPhase2DepthNotice";
import { AdminFinanceSuiteModuleStatusBadge } from "./AdminFinanceSuiteModuleStatusBadge";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

export function AdminFinanceSuitePageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { canWrite: canFinance } = useAdminCanWrite(ADMIN_PERM.FINANCE_READ);
  const navTiles = financeSuiteNavTiles();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_fin_suite_title")}
      subtitle={
        <div className="space-y-2">
          <p>{t("admin_fin_suite_subtitle_l5")}</p>
          <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`} data-tt-admin-fin-suite-readonly-hint="1">
            <span
              className="mr-2 inline-flex items-center rounded-[var(--radius-sm)] border border-ink-300 px-2 py-0.5 text-meta font-medium text-ink-800"
              data-tt-admin-fin-suite-readonly-badge="1"
            >
              {t("admin_fin_suite_readonly_badge")}
            </span>
            {t("admin_fin_suite_readonly_hint")}
          </p>
          {/* HU-450 · 财务入口固定禁写脚注（≠ 可操作资金 / Escrow 写） */}
          <p
            className="text-meta font-medium text-ink-700"
            role="note"
            data-tt-admin-fin-suite-no-write="1"
          >
            {t("admin_home_treasury_no_write_footnote")}
          </p>
        </div>
      }
      mainDataAttrs={{
        "data-tt-admin-finance-suite": "1",
        "data-tt-admin-batch9-l5-sample": "finance-suite",
      }}
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminWarmL5Surface
        as="section"
        className="mb-4"
        data-tt-admin-fin-suite-daily-todo="1"
        aria-label={t("admin_fin_suite_daily_todo_title")}
      >
        <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_suite_daily_todo_title")}</h2>
        <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`} data-tt-admin-fin-suite-daily-todo-empty="1">
          {t("admin_fin_suite_daily_todo_empty")}
        </p>
      </AdminWarmL5Surface>

      <AdminFinanceThreeTrackMapSection />

      {/* Batch-13 FN2/FN5 · 七步 workflow 为唯一主导航；磁贴墙降级折叠 */}
      <section
        className="mb-6"
        data-tt-admin-fin-suite-primary-nav="workflow"
        aria-label={t("admin_fin_suite_workflow_primary_aria")}
      >
        <AdminFinanceWorkflowStrip />
      </section>
      <AdminFinancePspPhase2DepthNotice />

      <details
        className="mb-6"
        data-tt-admin-fin-suite-nav-tiles-fold="1"
        data-tt-admin-fin-suite-secondary-nav="tiles"
      >
        <summary
          className={`${touchTargetLink44Classes} cursor-pointer list-none text-body font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_fin_suite_nav_tiles_fold")}
        </summary>
        <p className={`mt-2 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_fin_suite_nav_lead")}</p>
        <div className="mt-3" data-tt-admin-fin-suite-nav-tiles="1">
          <AdminOpsHubNavTiles
            links={navTiles}
            maxTiles={Math.max(navTiles.length, 1)}
            dataTtAttr="data-tt-admin-fin-suite-nav-link"
            showMoreFold={navTiles.length > 6}
          />
        </div>
      </details>

      {/* FN6/FN10 · 系统头寸进高级折叠 · 禁首屏墙 */}
      <details
        className="mb-6"
        data-tt-admin-fin-suite-treasury-fold="1"
        data-tt-admin-fin-suite-secondary-nav="treasury"
      >
        <summary
          className={`${touchTargetLink44Classes} cursor-pointer list-none text-body font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_fin_suite_treasury_fold")}
        </summary>
        <div className="mt-3">
          <AdminHomeTreasuryPoolStrip positionVariant="finance-suite" />
        </div>
      </details>

      <details
        className="mt-8"
        data-tt-admin-fin-suite-module-catalog="1"
        data-tt-admin-fin-suite-secondary-nav="module-catalog"
      >
        <summary
          className={`${touchTargetLink44Classes} cursor-pointer list-none text-body font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_fin_suite_module_catalog_fold")}
        </summary>
        <p className={`mt-2 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_fin_suite_module_catalog_lead")}</p>
        <ul
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          data-tt-admin-fin-suite-module-grid="1"
        >
          {FINANCE_SUITE_MODULES.filter((m) => m.status !== "placeholder").map((m) => {
            const hasPerm = m.perm === ADMIN_PERM.READ || canFinance;
            const navOpen = hasPerm && (m.status === "active" || m.status === "partial");
            const href =
              m.status === "partial" ? adminFinancePartialDepthHref(m.href, m.id) : m.href;
            return (
              <AdminWarmL5Surface
                as="li"
                key={m.id}
                className="flex min-h-[12rem] flex-col"
                data-tt-admin-fin-suite-module={m.id}
                data-tt-admin-fin-suite-status={m.status}
                data-tt-admin-fin-suite-nav-blocked={navOpen ? undefined : "1"}
              >
                <h2 className="text-body font-semibold text-ink-900">{t(m.titleKey)}</h2>
                <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t(m.descKey)}</p>
                <p className="mt-2">
                  <AdminFinanceSuiteModuleStatusBadge
                    status={m.status}
                    targetSnapshotClaim={m.targetSnapshotClaim}
                  />
                </p>
                {m.status === "partial" ? (
                  <p className={`mt-2 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_fin_suite_partial_hint")}</p>
                ) : null}
                {navOpen ? (
                  <Link
                    href={href}
                    className={`mt-3 inline-block ${adminPageNavLinkClass()}`}
                    data-tt-admin-fin-suite-open={m.status === "partial" ? "partial" : "active"}
                  >
                    {m.status === "partial"
                      ? t("admin_fin_suite_open_partial")
                      : t("admin_fin_suite_open")}
                  </Link>
                ) : (
                  <span className="mt-3 block text-small text-ink-400">{t("admin_permissions_no")}</span>
                )}
              </AdminWarmL5Surface>
            );
          })}
        </ul>
      </details>
      <AdminFinanceSuiteSupplementStrip />
    </AdminDetailPageChrome>
  );
}
