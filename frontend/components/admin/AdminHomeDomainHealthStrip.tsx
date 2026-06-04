"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { buildAdminHomeDomainHealth, type AdminDomainHealthTone } from "@/lib/admin/adminHomeDomainHealth";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_DOMAIN_HEALTH_ATTENTION_CARD_CLASS,
  ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  ADMIN_HOME_WIDGET_CARD_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

const TONE_CLASS: Record<AdminDomainHealthTone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  attention: ADMIN_DOMAIN_HEALTH_ATTENTION_CARD_CLASS,
  neutral: "border-ink-200 bg-ink-50 text-ink-700",
  unknown: "border-ink-200 bg-ink-50/60 text-ink-500",
};

const DOT_CLASS: Record<AdminDomainHealthTone, string> = {
  ok: "bg-emerald-500",
  attention: ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  neutral: "bg-ink-400",
  unknown: "bg-ink-300",
};

export function AdminHomeDomainHealthStrip(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  kpi: AdminHomeKpiCounts;
  inboxLoading: boolean;
  kpiLoading: boolean;
}) {
  const { t } = useTranslation();
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

  return (
    <section
      className={ADMIN_HOME_WIDGET_CARD_CLASS}
      aria-label={t("admin_home_domain_health_aria")}
      data-tt-admin-home-domain-health="1"
    >
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
    </section>
  );
}
