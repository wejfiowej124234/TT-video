"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_ADMIN_HOME_FOCUS_COMPANION_RECENT_ONLY_MARK } from "@/lib/admin/adminHomeFocusCompanionTodoOnly";
import {
  adminRecentVisitHref,
  adminRecentVisitTitleKey,
  getAdminRecentVisits,
  type AdminRecentVisit,
} from "@/lib/admin/adminRecentVisits";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_HOME_FOCUS_COMPANION_CLASS,
  ADMIN_RECENT_VISIT_CHIP_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * ① 收件箱聚焦 · 主卡旁速览。
 * Cut B OD · REMOVE_TODO_DUPLICATE_KEEP_RECENT_ONLY（R012/R019）：
 * 不再复列今日待办；仅最近访问。域灯只留概况 `AdminHomeDomainHealthStrip`。
 * HU-444 · todo-only companion superseded by OD-R012 recent-only.
 * HU-442 · 最近访问触控 ≥44。
 */
export function AdminHomeFocusCompanion(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  kpi: AdminHomeKpiCounts;
  inboxLoading: boolean;
  kpiLoading: boolean;
  kpiSource?: string | null;
}) {
  void props.counts;
  void props.channels;
  void props.inboxLoading;
  void props.kpi;
  void props.kpiLoading;
  void props.kpiSource;
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const [visits, setVisits] = useState<AdminRecentVisit[]>([]);

  useEffect(() => {
    setVisits(getAdminRecentVisits(4));
  }, []);

  if (!caps.permissionsLoaded) return null;

  return (
    <aside
      className={ADMIN_HOME_FOCUS_COMPANION_CLASS}
      aria-label={t("admin_home_focus_companion_aria")}
      data-tt-admin-home-focus-companion="1"
      data-tt-admin-home-focus-companion-recent-only="od-r012"
      data-tt-admin-home-focus-companion-recent-only-mark={
        TT_ADMIN_HOME_FOCUS_COMPANION_RECENT_ONLY_MARK
      }
    >
      <span className="sr-only">{TT_ADMIN_HOME_FOCUS_COMPANION_RECENT_ONLY_MARK}</span>
      <h2 className={`text-small font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>
        {t("admin_home_focus_companion_title")}
      </h2>
      <p className={`mt-1 ${ADMIN_TEXT_FOOTNOTE_CLASS}`} data-tt-admin-focus-companion-recent-hint="1">
        {t("admin_home_focus_companion_recent_only_hint")}
      </p>

      {visits.length > 0 ? (
        <div className="mt-2" data-tt-admin-home-focus-companion-recent="1">
          <p className={`text-small font-medium ${ADMIN_TEXT_BODY_CLASS}`}>
            {t("admin_home_recent_title")}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {visits.map(({ path }) => {
              const label = t(adminRecentVisitTitleKey(path));
              return (
                <li key={path}>
                  <AdminShellPrefetchLink
                    href={adminRecentVisitHref(path)}
                    className={`${touchTargetLink44Classes} ${ADMIN_RECENT_VISIT_CHIP_CLASS} text-small ${travelFocusRingOffset2Classes}`}
                    data-tt-admin-recent-visit-path={path}
                    data-tt-admin-recent-visit-touch="hu442"
                  >
                    {label}
                  </AdminShellPrefetchLink>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className={`mt-2 ${ADMIN_TEXT_FOOTNOTE_CLASS}`} data-tt-admin-home-focus-companion-recent-empty="1">
          {t("admin_home_focus_companion_recent_empty")}
        </p>
      )}

      <p className={`mt-3 ${ADMIN_TEXT_FOOTNOTE_CLASS}`} role="note">
        {t("admin_home_focus_companion_hint")}
      </p>
    </aside>
  );
}
