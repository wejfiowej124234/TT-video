"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { buildAdminHomeDomainHealth, type AdminDomainHealthTone } from "@/lib/admin/adminHomeDomainHealth";
import { useAdminHomeDomainHealthExtras } from "@/lib/admin/useAdminHomeDomainHealthExtras";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { classifyOpsKpiSource } from "@/lib/admin/opsWorkbenchL5";
import { AdminHomeDomainHealthLegend } from "@/components/admin/AdminHomeDomainHealthLegend";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

import {
  ADMIN_DOMAIN_HEALTH_OK_CARD_CLASS,
  ADMIN_DOMAIN_HEALTH_OK_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_ATTENTION_CARD_CLASS,
  ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_NEUTRAL_CARD_CLASS,
  ADMIN_DOMAIN_HEALTH_NEUTRAL_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_UNKNOWN_CARD_CLASS,
  ADMIN_DOMAIN_HEALTH_UNKNOWN_DOT_CLASS,
  ADMIN_MOTION_SKELETON_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const TONE_CLASS: Record<AdminDomainHealthTone, string> = {
  ok: ADMIN_DOMAIN_HEALTH_OK_CARD_CLASS,
  attention: ADMIN_DOMAIN_HEALTH_ATTENTION_CARD_CLASS,
  neutral: ADMIN_DOMAIN_HEALTH_NEUTRAL_CARD_CLASS,
  unknown: ADMIN_DOMAIN_HEALTH_UNKNOWN_CARD_CLASS,
};

const DOT_CLASS: Record<AdminDomainHealthTone, string> = {
  ok: ADMIN_DOMAIN_HEALTH_OK_DOT_CLASS,
  attention: ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  neutral: ADMIN_DOMAIN_HEALTH_NEUTRAL_DOT_CLASS,
  unknown: ADMIN_DOMAIN_HEALTH_UNKNOWN_DOT_CLASS,
};

const DOMAIN_HEALTH_GRID_CLASS = "mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4";

export function AdminHomeDomainHealthStrip(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  kpi: AdminHomeKpiCounts;
  inboxLoading: boolean;
  kpiLoading: boolean;
  kpiSource?: string | null;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const { embedded, kpiSource = null } = props;
  const caps = useAdminCapabilities();
  const extras = useAdminHomeDomainHealthExtras();
  const items = useMemo(
    () =>
      buildAdminHomeDomainHealth({
        ...props,
        kpiSource,
        hasPermission: caps.hasPermission,
        permissionsLoaded: caps.permissionsLoaded,
        t,
        communityReportsCount: extras.communityReportsCount,
        communityReportsLoading: extras.communityReportsLoading,
        contentQueueCount: extras.contentQueueCount,
        contentQueueLoading: extras.contentQueueLoading,
        officialQueueCount: extras.officialQueueCount,
        officialQueueLoading: extras.officialQueueLoading,
        treasurySource: extras.treasurySource,
        treasuryLoading: extras.treasuryLoading,
        treasuryEventTotal: extras.treasuryEventTotal,
        growthRegistrations: extras.growthRegistrations,
        growthReferrals: extras.growthReferrals,
        growthFrozen: extras.growthFrozen,
        growthLoading: extras.growthLoading,
        governorAddress: extras.governorAddress,
        governanceLive: extras.governanceLive,
        governanceLoading: extras.governanceLoading,
      }),
    [props, kpiSource, caps.hasPermission, caps.permissionsLoaded, t, extras],
  );

  const kpiSourceKind = classifyOpsKpiSource(kpiSource);

  const heading = (
    <h2 className={`text-body font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>
      {t("admin_home_domain_health_title")}
    </h2>
  );

  if (!caps.permissionsLoaded) {
    const skeleton = (
      <>
        {heading}
        <ul
          className={DOMAIN_HEALTH_GRID_CLASS}
          aria-busy="true"
          aria-label={t("admin_home_empty_state_loading")}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <li
              key={i}
              className={`min-h-[72px] rounded-[var(--radius-md)] border ${ADMIN_DOMAIN_HEALTH_UNKNOWN_CARD_CLASS} ${ADMIN_MOTION_SKELETON_CLASS}`}
            />
          ))}
        </ul>
      </>
    );
    if (embedded) {
      return (
        <div data-tt-admin-home-domain-health="1" data-tt-admin-home-domain-health-embedded="1">
          {skeleton}
        </div>
      );
    }
    return (
      <AdminWarmL5Surface as="section" aria-label={t("admin_home_domain_health_aria")}>
        {skeleton}
      </AdminWarmL5Surface>
    );
  }

  const body = (
    <>
      {heading}
      <AdminHomeDomainHealthLegend />
      <p className={`mt-1 text-meta ${ADMIN_TEXT_FOOTNOTE_CLASS}`} data-tt-admin-domain-health-legend="1">
        {t("admin_home_domain_health_legend")}
      </p>
      <ul
        className={DOMAIN_HEALTH_GRID_CLASS}
        data-tt-admin-domain-health-no-fake-green="1"
        data-tt-admin-domain-health-kpi-source-kind={kpiSourceKind}
      >
        {items.map((item) => (
          <li key={item.id} className="min-w-0 overflow-hidden">
            <Link
              href={item.href}
              className={`${touchTargetLink44Classes} flex min-h-[72px] min-w-0 flex-col justify-center gap-1 overflow-hidden rounded-[var(--radius-md)] border px-3 py-2 text-small ${TONE_CLASS[item.tone]} ${travelFocusRingOffset2Classes}`}
              data-tt-admin-domain-health={item.id}
              data-tt-admin-domain-health-tone={item.tone}
              data-tt-admin-domain-health-ops-source={
                item.id === "operations" ? (item.sourceBadgeKey ?? undefined) : undefined
              }
            >
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[item.tone]}`}
                  aria-hidden
                />
                <span className="truncate">{t(item.labelKey)}</span>
              </span>
              {item.countLabel ? (
                <span className="min-w-0 truncate pl-[1.125rem] text-meta tabular-nums leading-snug">
                  {item.countLabel}
                </span>
              ) : null}
              {item.sourceBadgeKey ? (
                <span
                  className="min-w-0 truncate pl-[1.125rem] text-meta opacity-90"
                  data-tt-admin-domain-health-source-badge="1"
                  title={t(item.sourceBadgeKey)}
                >
                  {t(item.sourceBadgeKey)}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <p className={`mt-2 ${ADMIN_TEXT_FOOTNOTE_CLASS}`} data-tt-admin-domain-health-hub-footnote="1">
        {t("admin_home_domain_health_hub_footnote")}
      </p>
    </>
  );

  if (embedded) {
    return (
      <div
        data-tt-admin-home-domain-health="1"
        data-tt-admin-home-domain-health-embedded="1"
        data-tt-admin-cross-domain-health="1"
      >
        {body}
      </div>
    );
  }

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_home_domain_health_aria")}
      data-tt-admin-home-domain-health="1"
      data-tt-admin-cross-domain-health="1"
    >
      {body}
    </AdminWarmL5Surface>
  );
}
