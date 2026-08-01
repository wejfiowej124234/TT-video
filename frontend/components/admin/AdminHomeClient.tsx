"use client";



import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";



import { useEffect, useId, useMemo, useState } from "react";

import { usePathname, useRouter } from "next/navigation";



import { useTranslation } from "@/components/LocaleProvider";



import { AdminHomeCollapsibleSection } from "@/components/admin/AdminHomeCollapsibleSection";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";



import { AdminHomeInboxStrip } from "@/components/admin/AdminHomeInboxStrip";



import { AdminHomeKpiStrip } from "@/components/admin/AdminHomeKpiStrip";



import { AdminHomeFocusCompanion } from "@/components/admin/AdminHomeFocusCompanion";
import { AdminHomeMaintainerFold } from "@/components/admin/AdminHomeMaintainerFold";
import { AdminHomeSystemOverviewSection } from "@/components/admin/AdminHomeSystemOverviewSection";
import { AdminHomeShellPreviewBanner } from "@/components/admin/AdminHomeShellPreviewBanner";

import AdminSubpageRouteLoading from "@/components/admin/AdminSubpageRouteLoading";
import { AdminHomePrimaryCtas } from "@/components/admin/AdminHomePrimaryCtas";

import { isSuperAdminActorRole } from "@/lib/admin/adminActorFromMe";
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

  ADMIN_HOME_CARDS,

  ADMIN_HOME_SECTION_ORDER,

  adminHomeCardsBySection,

  resolveAdminHomeCardTier,

  type AdminHomeCard,

  type AdminHomeCardTier,

  type AdminHomeInboxKey,

  type AdminHomeSectionId,

} from "@/lib/admin/adminHomeModel";



import { filterAdminHomeCardsForCapabilities } from "@/lib/admin/adminHomeCardPermission";

import {
  sectionDefaultOpenByPending,
  sectionPendingCount,
} from "@/lib/admin/adminHomeSectionPending";

import {
  adminHomeInboxPendingTotal,
  adminHomeModulesFoldDefaultOpen,
  resolveAdminHomeInboxPendingTotal,
} from "@/lib/admin/adminHomeInboxPendingTotal";
import { writeAdminHomeInboxPendingTotalCache } from "@/lib/admin/adminHomeInboxPendingTotalCache";
import { filterAdminHomeCardsForFocusMode } from "@/lib/admin/adminHomeFocusModuleFilter";
import {
  ADMIN_HOME_INBOX_FOCUS_LAYOUT_ACTIVE_MARK,
  adminHomeInboxFocusLayoutActive,
  adminHomeKpiFoldDefaultOpen,
  adminHomeMaintainerFoldVisible,
  adminHomeModuleCardTierBadgeVisible,
  adminWorkspaceBootActive,
} from "@/lib/admin/adminShellUxPolicy";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";

import {

  canAccessAdminInboxChannel,

} from "@/lib/admin/adminInboxChannelPermission";

import type { AdminHomeInboxChannels } from "@/lib/admin/useAdminHomeInbox";



import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";



import {

  adminHomeTierLabelKey,

  filterAdminHomeCardsForRole,

} from "@/lib/admin/adminHomeVisibility";



import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";



import { useAdminHomeKpi } from "@/lib/admin/useAdminHomeKpi";
import { adminHomeHonestMetricDisplay } from "@/lib/admin/adminHomeHonestMetricDisplay";

import { adminTruthBadgeLabelKey } from "@/lib/admin/adminTruthBadge";
import { scheduleAdminDeferredShellWork } from "@/lib/admin/adminDeferredShellWork";
import { prefetchAdminRoutesBatched } from "@/lib/admin/adminNavPrefetchBatch";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";



import {
  ADMIN_ATTENTION_CALLOUT_CLASS,
  ADMIN_HOME_CANVAS_CLASS,
  ADMIN_HOME_FOCUS_HEADER_CLASS,
  ADMIN_HOME_FOCUS_CANVAS_CLASS,
  ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_SUPER_WRITE_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_WRITE_BADGE_CLASS,
  ADMIN_KPI_CARD_IDLE_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_PENDING_COUNT_BADGE_CLASS,
  ADMIN_WARM_L5_FRAME_CLASS,
  ADMIN_WARM_L5_INNER_CLASS,
  ADMIN_WARM_L5_PAD_CLASS,
  ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS,
  ADMIN_COLLAPSE_CHEVRON_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS,
  ADMIN_WORKSPACE_TITLE_CLASS,
  ADMIN_WORKSPACE_TITLE_FOCUS_CLASS,
  ADMIN_COMMAND_PALETTE_KBD_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
  TT_ADMIN_PAGE_INNER_LIST,
} from "@/lib/adminUi";



import {

  touchTargetLink44Classes,

  travelFocusRingCoreOffset2WhiteClasses,
} from "@/lib/travelLinkFocus";



function cardTier(card: AdminHomeCard): AdminHomeCardTier {

  return resolveAdminHomeCardTier(card);

}

function homeCardTierBadgeClass(tier: AdminHomeCardTier): string {
  if (tier === "super_write") return ADMIN_HOME_CARD_TIER_SUPER_WRITE_BADGE_CLASS;
  if (tier === "write") return ADMIN_HOME_CARD_TIER_WRITE_BADGE_CLASS;
  if (tier === "read") return ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS;
  return ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS;
}



function inboxBadgeForCard(

  card: AdminHomeCard,

  counts: Record<AdminHomeInboxKey, number | null>,

  channels: AdminHomeInboxChannels,

  loading: boolean,

  hasPermission: (perm: string) => boolean,

  permissionsLoaded: boolean,

  t: (k: string, vars?: Record<string, string | number>) => string,

): string | null {

  if (!card.inboxKey) return null;

  if (!canAccessAdminInboxChannel(card.inboxKey, hasPermission, permissionsLoaded)) return null;

  if (channels[card.inboxKey]?.permissionDenied) return null;

  const n = counts[card.inboxKey];

  if (loading || n === null) return null;

  if (n <= 0) return null;

  return t("admin_home_card_pending_badge", { count: n });

}



/** `/admin` 首页：Batch-9 系统概况(+池图) → 今日待办 → 经营模块 · 维护者折叠 */

export default function AdminHomeClient() {

  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const pageTitleId = useId();

  const actor = useAdminShellActor();

  const caps = useAdminCapabilities();
  const { previewRole } = useAdminEffectiveShellRole();

  const inbox = useAdminHomeInbox();

  const kpi = useAdminHomeKpi();



  const cardsBySection = useMemo(() => {

    const byRole = filterAdminHomeCardsForRole(ADMIN_HOME_CARDS, actor.role);

    const byCaps = caps.permissionsLoaded

      ? filterAdminHomeCardsForCapabilities(byRole, caps.hasPermission)

      : byRole;



    return adminHomeCardsBySection(byCaps);

  }, [actor.role, caps.hasPermission, caps.permissionsLoaded]);

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

  const modulesFoldDefaultOpen = adminHomeModulesFoldDefaultOpen(
    inboxPendingResolved ?? inboxPendingTotal,
  );
  const focusInbox = adminHomeInboxFocusLayoutActive({
    pendingTotal: inboxPendingTotal,
    inboxLoading: inbox.loading,
    permissionsLoaded: caps.permissionsLoaded,
    inboxError: inbox.error,
  });
  const maintainerUi = isAdminMaintainerUi(actor.role);
  const showMaintainerFold = adminHomeMaintainerFoldVisible({ maintainerUi, focusInbox });
  const kpiFoldDefaultOpen = adminHomeKpiFoldDefaultOpen({
    pendingTotal: inboxPendingResolved ?? inboxPendingTotal,
    disputesKpi: kpi.counts.disputes,
    ordersKpi: kpi.counts.orders,
  });
  const [showAllModules, setShowAllModules] = useState(false);

  useEffect(() => {
    if (inboxPendingTotal !== null && !inbox.error) {
      writeAdminHomeInboxPendingTotalCache(inboxPendingTotal);
    }
  }, [inboxPendingTotal, inbox.error]);

  const visibleModuleCount = useMemo(() => {
    let n = 0;
    for (const { id } of ADMIN_HOME_SECTION_ORDER) {
      n += cardsBySection.get(id)?.length ?? 0;
    }
    return n;
  }, [cardsBySection]);

  const modulesDisplayBySection = useMemo(() => {
    if (!focusInbox || showAllModules) return cardsBySection;
    const next = new Map<AdminHomeSectionId, AdminHomeCard[]>();
    const focusInput = {
      counts: inbox.counts,
      channels: inbox.channels,
      loading: inbox.loading,
      consoleRole70: caps.consoleRole70,
    };
    for (const { id } of ADMIN_HOME_SECTION_ORDER) {
      const cards = cardsBySection.get(id) ?? [];
      const filtered = filterAdminHomeCardsForFocusMode(cards, focusInput);
      if (filtered.length > 0) next.set(id, filtered);
    }
    return next;
  }, [
    cardsBySection,
    caps.consoleRole70,
    focusInbox,
    inbox.channels,
    inbox.counts,
    inbox.loading,
    showAllModules,
  ]);

  const focusModuleShownCount = useMemo(() => {
    let n = 0;
    for (const { id } of ADMIN_HOME_SECTION_ORDER) {
      n += modulesDisplayBySection.get(id)?.length ?? 0;
    }
    return n;
  }, [modulesDisplayBySection]);

  const modulesFocusFilterActive =
    focusInbox && !showAllModules && focusModuleShownCount < visibleModuleCount;

  useEffect(() => {
    if (pathname !== "/admin") return;
    const hrefs: string[] = [];
    for (const cards of modulesDisplayBySection.values()) {
      for (const card of cards) hrefs.push(card.href);
    }
    if (hrefs.length === 0) return;
    return scheduleAdminDeferredShellWork(() => {
      prefetchAdminRoutesBatched(router, hrefs, { batchSize: 5, gapMs: 36 });
    }, { timeoutMs: 640 });
  }, [modulesDisplayBySection, pathname, router]);

  useEffect(() => {
    if (!focusInbox) setShowAllModules(false);
  }, [focusInbox]);

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
          <span
            className="sr-only"
            data-tt-admin-home-command-palette-hint-policy="shell_primary"
          >
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
          <p className={`max-w-2xl text-body ${ADMIN_TEXT_META_CLASS}`}>{t("admin_workspace_subtitle_short")}</p>
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
          className={
            focusInbox
              ? "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,19rem)]"
              : "flex flex-col gap-4"
          }
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
              {/* HU-432 · 非聚焦：概况已晋升唯一经营大数；此处仅明细/限额，不复渲染 KPI 磁贴 */}
              <AdminHomeKpiStrip
                counts={kpi.counts}
                loading={kpi.loading}
                kpiLoading={kpi.loading}
                permissionsLoaded={caps.permissionsLoaded}
                hasPermission={caps.hasPermission}
                error={kpi.error || inbox.error}
                detailOnly
                onRetry={() => {
                  inbox.reload();
                  kpi.reload();
                }}
              />
            </>
          )}
          {focusInbox ? (
            <AdminHomeFocusCompanion
              counts={inbox.counts}
              channels={inbox.channels}
              kpi={kpi.counts}
              inboxLoading={inbox.loading}
              kpiLoading={kpi.loading}
              kpiSource={kpi.kpiSource}
            />
          ) : null}
        </div>

        {focusInbox ? (
            <AdminHomeCollapsibleSection
              key={`home-kpi-focus-${inboxPendingTotal ?? "loading"}`}
              sectionId="home-kpi-detail"
              titleKey="admin_home_kpi_fold_title"
              defaultOpen={kpiFoldDefaultOpen}
              persistOpen={false}
              summaryAccent
              frame="compact"
              collapsedSummaryKey="admin_home_kpi_collapsed_summary"
              collapsedSummaryVars={{
                orders: adminHomeHonestMetricDisplay(t, {
                  loading: kpi.loading,
                  value: kpi.counts.orders,
                }),
                disputes: adminHomeHonestMetricDisplay(t, {
                  loading: kpi.loading,
                  value: kpi.counts.disputes,
                }),
              }}
            >
              <AdminHomeKpiStrip
                counts={kpi.counts}
                loading={kpi.loading}
                kpiLoading={kpi.loading}
                permissionsLoaded={caps.permissionsLoaded}
                hasPermission={caps.hasPermission}
                error={kpi.error || inbox.error}
                embedded
                detailOnly
                inboxFocusContext
                onRetry={() => {
                  inbox.reload();
                  kpi.reload();
                }}
              />
            </AdminHomeCollapsibleSection>
        ) : null}

      </div>



      {!focusInbox && showMaintainerFold ? (

        <div className="mt-6">

          <AdminHomeMaintainerFold />

        </div>

      ) : null}



      {visibleModuleCount > 0 ? (
<details
        key={modulesFoldDefaultOpen ? "admin-home-modules-open" : "admin-home-modules-fold"}
        className={`group overflow-hidden ${
          focusInbox ? `${ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS} mt-4` : `${ADMIN_WARM_L5_FRAME_CLASS} mt-8`
        }`}
        open={modulesFoldDefaultOpen}
        data-tt-admin-home-modules-fold="1"
        data-tt-admin-home-section-frame={focusInbox ? "compact" : "warm"}
      >
        <summary
          className={`flex cursor-pointer list-none items-center gap-2 marker:content-none [&::-webkit-details-marker]:hidden ${
            focusInbox
              ? "px-3 py-2.5"
              : `${ADMIN_WARM_L5_INNER_CLASS} ${ADMIN_WARM_L5_PAD_CLASS}`
          }`}
          data-tt-admin-home-modules-summary="1"
        >
          <span
            className={`${ADMIN_COLLAPSE_CHEVRON_CLASS} group-open:rotate-90 ${ADMIN_MOTION_CARD_HOVER_CLASS}`}
            aria-hidden
          >
            ›
          </span>
          <span className={`text-body-l font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>
            {modulesFocusFilterActive
              ? t("admin_home_modules_fold_summary_focus", {
                  shown: focusModuleShownCount,
                  total: visibleModuleCount,
                })
              : t("admin_home_modules_fold_summary", { count: visibleModuleCount })}
          </span>
        </summary>
        <div
          className={`border-t ${
            focusInbox ? "border-white/8 px-3 pb-3 pt-2" : `border-ref-sun/15 ${ADMIN_WARM_L5_INNER_CLASS} px-4 pb-4 pt-3`
          }`}
          aria-label={t("admin_home_modules_aria")}
          data-tt-admin-home-modules-focus-filter={modulesFocusFilterActive ? "1" : undefined}
        >
        <div className="space-y-3">
        {ADMIN_HOME_SECTION_ORDER.map(({ id, titleKey }) => {

          const cards = modulesDisplayBySection.get(id) ?? [];

          if (cards.length === 0) return null;

          const pending = sectionPendingCount(

            id,

            inbox.counts,

            inbox.channels,

            kpi.counts,

            kpi.loading,

            inbox.loading,

            caps.hasPermission,

            caps.permissionsLoaded,

          );

          const defaultOpen = focusInbox ? false : sectionDefaultOpenByPending(pending);

          const badge =

            pending !== null && pending > 0 ? String(pending) : null;

          return (

            <AdminHomeCollapsibleSection

              key={id}

              sectionId={id}

              titleKey={titleKey}

              defaultOpen={defaultOpen}

              persistOpen={!focusInbox}

              frame={focusInbox ? "compact" : "warm"}

              badge={badge}

              collapsedSummaryKey={!defaultOpen ? "admin_home_section_collapsed_summary" : undefined}

              collapsedSummaryVars={

                !defaultOpen

                  ? {

                      pending: pending ?? 0,

                      modules: cards.length,

                    }

                  : undefined

              }

            >

              <div className="grid gap-2 sm:grid-cols-2">

                {cards

                  .filter((card) => {

                    const tier = cardTier(card);

                    if (tier === "placeholder" && !isSuperAdminActorRole(actor.role)) return false;

                    return true;

                  })

                  .map((card) => {

                  const badgeCount = inboxBadgeForCard(

                    card,

                    inbox.counts,

                    inbox.channels,

                    inbox.loading,

                    caps.hasPermission,

                    caps.permissionsLoaded,

                    t,

                  );

                  const tier = cardTier(card);



                  return (

                    <AdminShellPrefetchLink

                      key={card.href}

                      href={card.href}

                      data-tt-admin-card-tier={tier}

                      className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-lg)] p-3 text-ink-800 ${ADMIN_MOTION_CARD_HOVER_CLASS} ${travelFocusRingCoreOffset2WhiteClasses} ${ADMIN_KPI_CARD_IDLE_CLASS}`}

                    >

                      <div className="flex items-start justify-between gap-2">

                        <h3 className="text-body font-semibold text-ink-900">{t(card.titleKey)}</h3>

                        <div className="flex shrink-0 flex-col items-end gap-1">

                          {adminHomeModuleCardTierBadgeVisible() && tier !== "placeholder" ? (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-meta font-medium ${homeCardTierBadgeClass(tier)}`}
                              title={t("admin_home_card_tier_hint")}
                            >
                              {t(adminHomeTierLabelKey(tier))}
                            </span>
                          ) : null}

                          {badgeCount ? (

                            <span className={ADMIN_PENDING_COUNT_BADGE_CLASS}>

                              {badgeCount}

                            </span>

                          ) : null}

                        </div>

                      </div>

                      <p className={`mt-1.5 text-small leading-relaxed ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t(card.descKey)}</p>
                      {card.truthBadge && card.truthBadge !== "HIDE" ? (
                        <p
                          className={`mt-1.5 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}
                          data-tt-admin-home-card-truth-badge={card.truthBadge}
                        >
                          {t(adminTruthBadgeLabelKey(card.truthBadge))}
                        </p>
                      ) : null}

                    </AdminShellPrefetchLink>

                  );

                })}

              </div>

            </AdminHomeCollapsibleSection>

          );

        })}

        {modulesFocusFilterActive ? (
          <button
            type="button"
            className={`${touchTargetLink44Classes} ${ADMIN_TEXT_BODY_CLASS} font-semibold text-ink-800 underline-offset-2 hover:text-ink-900 hover:underline ${ADMIN_LINK_FOCUS_CLASS}`}
            data-tt-admin-home-modules-expand-all="1"
            onClick={() => setShowAllModules(true)}
          >
            {t("admin_home_modules_expand_all", { total: visibleModuleCount })}
          </button>
        ) : null}

        </div>
        </div>
      </details>
      ) : !focusInbox ? (
        <p
          className={`mt-6 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}
          data-tt-admin-home-sidebar-sole-nav="1"
        >
          {t("admin_home_sidebar_sole_nav_hint")}
        </p>
      ) : null}



      {focusInbox && showMaintainerFold ? (
        <div className="mt-4">
          <AdminHomeMaintainerFold
            focusMode
            shellPreview={<AdminHomeShellPreviewBanner />}
          />
        </div>
      ) : null}

    </main>

  );

}

