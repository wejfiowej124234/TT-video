"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { buildAdminHomeDomainHealth, type AdminDomainHealthTone } from "@/lib/admin/adminHomeDomainHealth";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
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
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

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

export function AdminHomeDomainHealthStrip(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  kpi: AdminHomeKpiCounts;
  inboxLoading: boolean;
  kpiLoading: boolean;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const { embedded } = props;
  const caps = useAdminCapabilities();
  const items = useMemo(
    () =>
      buildAdminHomeDomainHealth({
        ...props,
        hasPermission: caps.hasPermission,
        permissionsLoaded: caps.permissionsLoaded,
        t,
      }),
    [props, caps.hasPermission, caps.permissionsLoaded, t],
  );

  if (!caps.permissionsLoaded) return null;

  const body = (
    <>
      <h2 className="text-body font-semibold text-ink-900">{t("admin_home_domain_health_title")}</h2>
      <p className="mt-1 text-meta text-ink-500" data-tt-admin-domain-health-legend="1">
        {t("admin_home_domain_health_legend")}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`${touchTargetLink44Classes} flex min-h-[44px] items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-small ${TONE_CLASS[item.tone]} ${travelFocusRingCoreOffset2WhiteClasses}`}
              data-tt-admin-domain-health={item.id}
            >
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[item.tone]}`}
                  aria-hidden
                />
                <span className="truncate">{t(item.labelKey)}</span>
              </span>
              {item.countLabel ? (
                <span className="shrink-0 text-meta tabular-nums">{item.countLabel}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) {
    return (
      <div data-tt-admin-home-domain-health="1" data-tt-admin-home-domain-health-embedded="1">
        {body}
      </div>
    );
  }

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_home_domain_health_aria")}
      data-tt-admin-home-domain-health="1"
    >
      {body}
    </AdminWarmL5Surface>
  );
}
