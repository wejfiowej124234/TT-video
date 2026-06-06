"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { buildAdminHomeDomainHealth } from "@/lib/admin/adminHomeDomainHealth";
import {
  ADMIN_RECENT_PATH_TITLE_KEYS,
  adminRecentVisitHref,
  getAdminRecentVisits,
  type AdminRecentVisit,
} from "@/lib/admin/adminRecentVisits";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_NEUTRAL_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_OK_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_UNKNOWN_DOT_CLASS,
  ADMIN_HOME_FOCUS_COMPANION_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_RECENT_VISIT_CHIP_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
} from "@/lib/adminUi";
import type { AdminDomainHealthTone } from "@/lib/admin/adminHomeDomainHealth";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const DOT: Record<AdminDomainHealthTone, string> = {
  ok: ADMIN_DOMAIN_HEALTH_OK_DOT_CLASS,
  attention: ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  neutral: ADMIN_DOMAIN_HEALTH_NEUTRAL_DOT_CLASS,
  unknown: ADMIN_DOMAIN_HEALTH_UNKNOWN_DOT_CLASS,
};

/** ① 收件箱聚焦 · 主卡旁速览（域健康 + 最近访问；经营数字 SSOT 在下方 KPI 折叠） */
export function AdminHomeFocusCompanion(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  kpi: AdminHomeKpiCounts;
  inboxLoading: boolean;
  kpiLoading: boolean;
}) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const [visits, setVisits] = useState<AdminRecentVisit[]>([]);

  useEffect(() => {
    setVisits(getAdminRecentVisits(4));
  }, []);

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
    <aside
      className={ADMIN_HOME_FOCUS_COMPANION_CLASS}
      aria-label={t("admin_home_focus_companion_aria")}
      data-tt-admin-home-focus-companion="1"
    >
      <h2 className={`text-small font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>
        {t("admin_home_focus_companion_title")}
      </h2>
      <ul className="mt-2 space-y-1.5" data-tt-admin-home-focus-companion-health="1">
        {items.map((item) => (
          <li key={item.id}>
            <AdminShellPrefetchLink
              href={item.href}
              className={`flex min-h-[44px] items-center justify-between gap-2 rounded-[var(--radius-md)] border border-white/10 px-2.5 py-2 text-small ${ADMIN_TEXT_BODY_CLASS} ${travelFocusRingOffset2Classes}`}
              data-tt-admin-focus-companion-domain={item.id}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[item.tone]}`} aria-hidden />
                <span className="truncate">{t(item.labelKey)}</span>
              </span>
              {item.countLabel ? (
                <span className={`shrink-0 text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>
                  {item.countLabel}
                </span>
              ) : null}
            </AdminShellPrefetchLink>
          </li>
        ))}
      </ul>

      <p className={`mt-3 ${ADMIN_TEXT_FOOTNOTE_CLASS}`} data-tt-admin-focus-companion-kpi-links="1">
        {t("admin_home_focus_companion_kpi_links_prefix")}
        <a
          href="#home-kpi-snapshot"
          className={`font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_home_kpi_fold_title")}
        </a>
        {t("admin_home_focus_companion_kpi_links_mid")}
        <AdminShellPrefetchLink href="/admin/orders" className={`font-medium ${ADMIN_INLINE_LINK_CLASS}`}>
          {t("admin_home_kpi_orders_label")}
        </AdminShellPrefetchLink>
        <span aria-hidden> · </span>
        <AdminShellPrefetchLink href="/admin/disputes" className={`font-medium ${ADMIN_INLINE_LINK_CLASS}`}>
          {t("admin_home_kpi_disputes_label")}
        </AdminShellPrefetchLink>
      </p>

      {visits.length > 0 ? (
        <div className="mt-3" data-tt-admin-home-focus-companion-recent="1">
          <p className={`text-small font-medium ${ADMIN_TEXT_BODY_CLASS}`}>{t("admin_home_recent_title")}</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {visits.map(({ path }) => {
              const titleKey = ADMIN_RECENT_PATH_TITLE_KEYS[path] ?? "admin_shell_nav_workspace";
              return (
                <li key={path}>
                  <AdminShellPrefetchLink
                    href={adminRecentVisitHref(path)}
                    className={`${touchTargetLink44Classes} ${ADMIN_RECENT_VISIT_CHIP_CLASS} !min-h-[36px] !px-2.5 !py-1 text-small ${travelFocusRingOffset2Classes}`}
                  >
                    {t(titleKey)}
                  </AdminShellPrefetchLink>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className={`mt-3 ${ADMIN_TEXT_FOOTNOTE_CLASS}`} role="note">
        {t("admin_home_focus_companion_hint")}
      </p>
    </aside>
  );
}
