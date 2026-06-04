"use client";



import Link from "next/link";



import { useId, useMemo } from "react";



import { useTranslation } from "@/components/LocaleProvider";



import { AdminHomeDevApiReference } from "@/components/admin/AdminHomeDevApiReference";



import { AdminHomeCollapsibleSection } from "@/components/admin/AdminHomeCollapsibleSection";



import { AdminHomeInboxStrip } from "@/components/admin/AdminHomeInboxStrip";



import { AdminHomeKpiStrip } from "@/components/admin/AdminHomeKpiStrip";



import { AdminHomeDomainHealthStrip } from "@/components/admin/AdminHomeDomainHealthStrip";
import { AdminHomeMaintainerFold } from "@/components/admin/AdminHomeMaintainerFold";

import { AdminHomeRecentVisits } from "@/components/admin/AdminHomeRecentVisits";
import { AdminHomeShellPreviewBanner } from "@/components/admin/AdminHomeShellPreviewBanner";

import { AdminHomePrimaryCtas } from "@/components/admin/AdminHomePrimaryCtas";

import { isSuperAdminActorRole } from "@/lib/admin/adminActorFromMe";



import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";



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
} from "@/lib/admin/adminHomeInboxPendingTotal";

import {

  canAccessAdminInboxChannel,

} from "@/lib/admin/adminInboxChannelPermission";

import type { AdminHomeInboxChannels } from "@/lib/admin/useAdminHomeInbox";



import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";



import {

  adminHomeTierLabelKey,

  filterAdminHomeCardsForRole,

} from "@/lib/admin/adminHomeVisibility";



import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";



import { useAdminHomeKpi } from "@/lib/admin/useAdminHomeKpi";



import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";



import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";



import {
  ADMIN_ATTENTION_CALLOUT_CLASS,
  ADMIN_HOME_CANVAS_CLASS,
  ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_SUPER_WRITE_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_WRITE_BADGE_CLASS,
  ADMIN_HOME_WIDGET_CARD_CLASS,
  ADMIN_PENDING_COUNT_BADGE_CLASS,
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

  if (channels[card.inboxKey].permissionDenied) return null;

  const n = counts[card.inboxKey];

  if (loading || n === null) return null;

  if (n <= 0) return null;

  return t("admin_home_card_pending_badge", { count: n });

}



/** `/admin` 首页：运营首屏（待办 → 概览 → 模块）· 维护者折叠 · dev API 仅 super_admin */

export default function AdminHomeClient() {

  const { t } = useTranslation();

  const pageTitleId = useId();

  const actor = useAdminShellActor();

  const caps = useAdminCapabilities();

  const { meta: buildMeta, loading: buildLoading, error: buildError } =

    useAdminMetaBuildFromPublicMeta("AdminHomeMetaBuild");

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

  const modulesFoldDefaultOpen = adminHomeModulesFoldDefaultOpen(inboxPendingTotal);

  const visibleModuleCount = useMemo(() => {
    let n = 0;
    for (const { id } of ADMIN_HOME_SECTION_ORDER) {
      n += cardsBySection.get(id)?.length ?? 0;
    }
    return n;
  }, [cardsBySection]);



  return (

    <main className={TT_ADMIN_PAGE_INNER_LIST} aria-labelledby={pageTitleId} data-tt-admin-home="1">

      <header className={`${ADMIN_HOME_WIDGET_CARD_CLASS} sm:p-6`}>

        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">

          {t("admin_workspace_title")}

        </h1>

        <p className="mt-1 max-w-2xl text-body text-ink-600">{t("admin_workspace_subtitle_short")}</p>
        <p
          className="mt-2 text-meta text-ink-500"
          data-tt-admin-home-command-palette-hint="1"
        >
          {t("admin_home_command_palette_hint")}
        </p>

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

      </header>



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



      <div className={`mt-6 ${ADMIN_HOME_CANVAS_CLASS} space-y-4`}>

        <AdminHomeShellPreviewBanner />

        <div className="grid gap-4 lg:grid-cols-2" data-tt-admin-home-widget-grid="1">
          <AdminHomeInboxStrip
            counts={inbox.counts}
            channels={inbox.channels}
            loading={inbox.loading}
            error={inbox.error}
            onRetry={inbox.reload}
            hasPermission={caps.hasPermission}
            permissionsLoaded={caps.permissionsLoaded}
          />
          <AdminHomeKpiStrip
            counts={kpi.counts}
            loading={kpi.loading}
            kpiLoading={kpi.loading}
            permissionsLoaded={caps.permissionsLoaded}
            hasPermission={caps.hasPermission}
            error={kpi.error || inbox.error}
            onRetry={() => {
              inbox.reload();
              kpi.reload();
            }}
          />
        </div>

        <AdminHomeDomainHealthStrip
          counts={inbox.counts}
          channels={inbox.channels}
          kpi={kpi.counts}
          inboxLoading={inbox.loading}
          kpiLoading={kpi.loading}
        />

        <AdminHomeRecentVisits />

      </div>



      <div className="mt-6">

        <AdminHomeMaintainerFold />

      </div>



      <details
        key={modulesFoldDefaultOpen ? "admin-home-modules-open" : "admin-home-modules-fold"}
        className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft sm:p-5"
        open={modulesFoldDefaultOpen}
        data-tt-admin-home-modules-fold="1"
      >
        <summary className="cursor-pointer text-body-l font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden">
          {t("admin_home_modules_fold_summary", { count: visibleModuleCount })}
        </summary>
        <div className="mt-4 space-y-3" aria-label={t("admin_home_modules_aria")}>
        {ADMIN_HOME_SECTION_ORDER.map(({ id, titleKey }) => {

          const cards = cardsBySection.get(id) ?? [];

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

          const defaultOpen = sectionDefaultOpenByPending(pending);

          const badge =

            pending !== null && pending > 0 ? String(pending) : null;

          return (

            <AdminHomeCollapsibleSection

              key={id}

              sectionId={id}

              titleKey={titleKey}

              defaultOpen={defaultOpen}

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

              <div className="grid gap-3 sm:grid-cols-2">

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

                    <Link

                      key={card.href}

                      href={card.href}

                      data-tt-admin-card-tier={tier}

                      className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/30 p-3 text-ink-800 transition motion-reduce:transition-none hover:border-ink-400 hover:bg-white hover:text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}

                    >

                      <div className="flex items-start justify-between gap-2">

                        <h3 className="text-body font-semibold text-ink-900">{t(card.titleKey)}</h3>

                        <div className="flex shrink-0 flex-col items-end gap-1">

                          {tier !== "placeholder" ? (
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

                      <p className="mt-1.5 text-small leading-relaxed text-ink-600">{t(card.descKey)}</p>

                    </Link>

                  );

                })}

              </div>

            </AdminHomeCollapsibleSection>

          );

        })}

        </div>
      </details>



      {isSuperAdminActorRole(actor.role) ? (

        <details className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-ink-50/50 p-4" data-tt-admin-home-tech-fold="1">

          <summary className="cursor-pointer text-small font-medium text-ink-600">

            {t("admin_home_tech_fold_summary")}

          </summary>

          <div className="mt-3 space-y-4">

            <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

          </div>

        </details>

      ) : null}



      {isSuperAdminActorRole(actor.role) ? <AdminHomeDevApiReference /> : null}

    </main>

  );

}

