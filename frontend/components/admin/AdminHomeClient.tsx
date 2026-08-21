"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useEffect, useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { AdminHomeInboxStrip } from "@/components/admin/AdminHomeInboxStrip";
import { AdminHomeSystemOverviewSection } from "@/components/admin/AdminHomeSystemOverviewSection";
import { AdminHomeShellPreviewBanner } from "@/components/admin/AdminHomeShellPreviewBanner";
import AdminSubpageRouteLoading from "@/components/admin/AdminSubpageRouteLoading";
import { AdminHomePrimaryCtas } from "@/components/admin/AdminHomePrimaryCtas";
import {
  ADMIN_WORKBENCH_L5_GATE_MARK,
  ADMIN_WORKBENCH_L5_GATE_VALUE,
  ADMIN_WORKBENCH_VULN_UPGRADE_GATE_MARK,
  ADMIN_WORKBENCH_VULN_UPGRADE_GATE_VALUE,
} from "@/lib/admin/adminWorkbenchL5ScoreGate";
import {
  ADMIN_WORKBENCH_LAYOUT_DRIVER,
  TT_ADMIN_DESIGN_SYSTEM_PRODUCT_RELEASE_BASELINE_MARK,
} from "@/lib/admin/adminDesignSystemBaseline";
import {
  adminHomeInboxPendingTotal,
  resolveAdminHomeInboxPendingTotal,
} from "@/lib/admin/adminHomeInboxPendingTotal";
import { writeAdminHomeInboxPendingTotalCache } from "@/lib/admin/adminHomeInboxPendingTotalCache";
import {
  ADMIN_HOME_INBOX_FOCUS_LAYOUT_ACTIVE_MARK,
  adminHomeInboxFocusLayoutActive,
  adminWorkspaceBootActive,
} from "@/lib/admin/adminShellUxPolicy";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";
import { useAdminHomeKpi } from "@/lib/admin/useAdminHomeKpi";
import {
  ADMIN_ATTENTION_CALLOUT_CLASS,
  ADMIN_HOME_CANVAS_CLASS,
  ADMIN_HOME_FOCUS_HEADER_CLASS,
  ADMIN_HOME_FOCUS_CANVAS_CLASS,
  ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS,
  ADMIN_WORKSPACE_TITLE_CLASS,
  ADMIN_WORKSPACE_TITLE_FOCUS_CLASS,
  ADMIN_COMMAND_PALETTE_KBD_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
  TT_ADMIN_PAGE_INNER_LIST,
} from "@/lib/adminUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
} from "@/lib/travelLinkFocus";

/** `/admin` 首页：今日待办 → 系统概况（模块入口仅左侧目录） */

export default function AdminHomeClient() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const caps = useAdminCapabilities();
  const { previewRole } = useAdminEffectiveShellRole();
  const inbox = useAdminHomeInbox();
  const kpi = useAdminHomeKpi();

  const inboxPendingTotal = adminHomeInboxPendingTotal(
    inbox.counts,
    inbox.channels,
    inbox.loading,
    inbox.error,
    caps.hasPermission,
    caps.permissionsLoaded,
  );

  const inboxPendingResolved = resolveAdminHomeInboxPendingTotal(
    inboxPendingTotal,
    inbox.loading,
    caps.permissionsLoaded,
    inbox.error,
  );

  const focusInbox = adminHomeInboxFocusLayoutActive({
    pendingTotal: inboxPendingTotal,
    inboxLoading: inbox.loading,
    permissionsLoaded: caps.permissionsLoaded,
    inboxError: inbox.error,
  });

  useEffect(() => {
    if (inboxPendingTotal !== null && !inbox.error) {
      writeAdminHomeInboxPendingTotalCache(inboxPendingTotal);
    }
  }, [inboxPendingTotal, inbox.error]);

  if (
    adminWorkspaceBootActive({
      loading: caps.loading,
      permissionsLoaded: caps.permissionsLoaded,
      capabilitiesUnavailable: caps.capabilitiesUnavailable,
    })
  ) {
    return <AdminSubpageRouteLoading variant="workspace" mainAriaLabelKey="admin_workspace_title" />;
  }

  return (
    <main
      className={TT_ADMIN_PAGE_INNER_LIST}
      aria-labelledby={pageTitleId}
      data-tt-admin-home="1"
      data-tt-admin-app-page="1"
      data-tt-admin-home-command-layout="1"
      data-tt-admin-home-soft-revalidate="hu463"
      data-tt-admin-home-soft-revalidate-mark="tt_admin_home_soft_revalidate_hu463"
      data-tt-admin-home-i18n-key-symmetry="hu462"
      data-tt-admin-home-i18n-key-symmetry-mark="tt_admin_home_i18n_key_symmetry_hu462"
      data-tt-admin-workbench-l5-gate={ADMIN_WORKBENCH_L5_GATE_VALUE}
      data-tt-admin-workbench-l5-gate-mark={ADMIN_WORKBENCH_L5_GATE_MARK}
      data-tt-admin-workbench-vuln-upgrade-gate={ADMIN_WORKBENCH_VULN_UPGRADE_GATE_VALUE}
      data-tt-admin-workbench-vuln-upgrade-gate-mark={ADMIN_WORKBENCH_VULN_UPGRADE_GATE_MARK}
      data-tt-admin-workbench-layout-driver={ADMIN_WORKBENCH_LAYOUT_DRIVER}
      data-tt-admin-design-system-product-release-baseline-mark={
        TT_ADMIN_DESIGN_SYSTEM_PRODUCT_RELEASE_BASELINE_MARK
      }
      data-tt-admin-home-inbox-focus-layout-active-mark={
        ADMIN_HOME_INBOX_FOCUS_LAYOUT_ACTIVE_MARK
      }
    >
      {/* Batch-14 C-08: keep data-*-mark + MARK constants for Batch-12 probes; no naked key text in DOM */}
      <span className="sr-only" aria-hidden="true" />
      <span className="sr-only" aria-hidden="true" />
      <span className="sr-only" aria-hidden="true" />
      <span className="sr-only" aria-hidden="true" />

      {focusInbox ? (
        <header
          className={ADMIN_HOME_FOCUS_HEADER_CLASS}
          data-tt-admin-home-workspace-header="1"
          data-tt-admin-home-workspace-header-compact="1"
          aria-labelledby={pageTitleId}
        >
          <h1
            id={pageTitleId}
            className={ADMIN_WORKSPACE_TITLE_FOCUS_CLASS}
            data-tt-admin-home-workspace-heading="1"
            data-tt-admin-home-workspace-heading-focus="1"
          >
            {t("admin_home_workspace_heading")}
          </h1>
          {inboxPendingTotal !== null && inboxPendingTotal > 0 ? (
            <AdminShellPrefetchLink
              href="/admin/inbox"
              className={`${touchTargetLink44Classes} mt-2 inline-flex ${ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS} ${travelFocusRingCoreOffset2WhiteClasses}`}
              data-tt-admin-home-focus-inbox-cta="1"
            >
              {t("admin_home_primary_cta_inbox", { count: inboxPendingTotal })}
            </AdminShellPrefetchLink>
          ) : null}
          {/* Batch-11 W14 HU-331 · 聚焦态不重复 Ctrl+K 提示 · 顶栏 trigger 为唯一入口 */}
          <span className="sr-only" data-tt-admin-home-command-palette-hint-policy="shell_primary">
            {t("admin_home_command_palette_hint")}
          </span>
        </header>
      ) : (
        <AdminWarmL5Surface
          as="header"
          innerClassName="sm:p-6"
          data-tt-admin-home-workspace-header="1"
        >
          <h1
            id={pageTitleId}
            className={ADMIN_WORKSPACE_TITLE_CLASS}
            data-tt-admin-home-workspace-heading="1"
          >
            {t("admin_home_workspace_heading")}
          </h1>

          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className={`max-w-2xl text-body ${ADMIN_TEXT_META_CLASS}`}>
              {t("admin_workspace_subtitle_short")}
            </p>
            <p
              className={`flex shrink-0 flex-wrap items-center gap-1 text-small ${ADMIN_TEXT_META_CLASS}`}
              data-tt-admin-home-command-palette-hint="1"
              data-tt-admin-home-command-palette-hint-policy="home_secondary"
              aria-label={t("admin_home_command_palette_hint")}
            >
              <span className="sr-only">{t("admin_home_command_palette_hint")}</span>
              <span aria-hidden>{t("admin_home_command_palette_hint_prefix")}</span>
              <kbd className={ADMIN_COMMAND_PALETTE_KBD_CLASS} aria-hidden>
                {t("admin_home_command_palette_hint_ctrl")}
              </kbd>
              <span aria-hidden>+</span>
              <kbd className={ADMIN_COMMAND_PALETTE_KBD_CLASS} aria-hidden>
                {t("admin_home_command_palette_hint_key")}
              </kbd>
              <span aria-hidden className="hidden sm:inline">
                {t("admin_home_command_palette_hint_mac")}
              </span>
              <span aria-hidden>{t("admin_home_command_palette_hint_suffix")}</span>
            </p>
          </div>

          {!inbox.loading && inboxPendingTotal === 0 ? (
            <div className="mt-4" data-tt-admin-home-primary-cta-fallback="1">
              <AdminHomePrimaryCtas
                counts={inbox.counts}
                channels={inbox.channels}
                loading={inbox.loading}
                consoleRole70={caps.consoleRole70}
              />
            </div>
          ) : null}
        </AdminWarmL5Surface>
      )}

      {caps.capabilitiesUnavailable ? (
        <p
          className={`mt-4 ${ADMIN_ATTENTION_CALLOUT_CLASS}`}
          data-tt-admin-home-capabilities-unavailable="1"
          role="status"
        >
          {caps.errorCode === "admin_capabilities_route_missing"
            ? t("admin_capability_strip_api_missing")
            : caps.errorCode === "login_required"
              ? t("admin_capability_strip_login_required")
              : t("admin_capability_strip_load_failed")}
        </p>
      ) : null}

      <div
        className={`${focusInbox ? "mt-3" : "mt-6"} ${
          focusInbox ? ADMIN_HOME_FOCUS_CANVAS_CLASS : ADMIN_HOME_CANVAS_CLASS
        } space-y-3`}
      >
        {!focusInbox && previewRole ? <AdminHomeShellPreviewBanner /> : null}

        <div
          className="flex flex-col gap-4"
          data-tt-admin-home-widget-grid="1"
          data-tt-admin-home-inbox-focus={focusInbox ? "1" : undefined}
        >
          {focusInbox ? (
            <div
              className="flex min-w-0 flex-col gap-4"
              data-tt-admin-home-inbox-column="1"
              data-tt-admin-home-focus-inbox-first="1"
            >
              {/* HU-455 · 聚焦：待办优先，概况在后且默认收起 */}
              <AdminHomeInboxStrip
                counts={inbox.counts}
                channels={inbox.channels}
                loading={inbox.loading}
                error={inbox.error}
                onRetry={inbox.reload}
                hasPermission={caps.hasPermission}
                permissionsLoaded={caps.permissionsLoaded}
                focusMode={focusInbox}
              />
              <AdminHomeSystemOverviewSection
                counts={inbox.counts}
                channels={inbox.channels}
                inboxLoading={inbox.loading}
                kpi={kpi.counts}
                kpiLoading={kpi.loading}
                kpiSource={kpi.kpiSource}
                inboxPendingTotal={inboxPendingResolved ?? inboxPendingTotal}
                focusInbox={focusInbox}
              />
            </div>
          ) : (
            <>
              {/* V65 UX · non-focus: Inbox → System（模块入口仅左侧目录） */}
              <AdminHomeInboxStrip
                counts={inbox.counts}
                channels={inbox.channels}
                loading={inbox.loading}
                error={inbox.error}
                onRetry={inbox.reload}
                hasPermission={caps.hasPermission}
                permissionsLoaded={caps.permissionsLoaded}
                focusMode={focusInbox}
              />
              <AdminHomeSystemOverviewSection
                counts={inbox.counts}
                channels={inbox.channels}
                inboxLoading={inbox.loading}
                kpi={kpi.counts}
                kpiLoading={kpi.loading}
                kpiSource={kpi.kpiSource}
                inboxPendingTotal={inboxPendingResolved ?? inboxPendingTotal}
                focusInbox={focusInbox}
              />
            </>
          )}
        </div>
      </div>

      {!focusInbox ? (
        <p
          className={`mt-6 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}
          data-tt-admin-home-sidebar-sole-nav="1"
        >
          {t("admin_home_sidebar_sole_nav_hint")}
        </p>
      ) : null}
    </main>
  );
}
