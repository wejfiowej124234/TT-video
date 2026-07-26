"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  adminRecentVisitHref,
  adminRecentVisitTitleKey,
  getAdminRecentVisits,
  type AdminRecentVisit,
} from "@/lib/admin/adminRecentVisits";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_RECENT_VISIT_CHIP_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

/** Batch-12 HU-434 · recent visit chips use product i18n titles（禁 eng slug） */
export function AdminHomeRecentVisits() {
  const { t } = useTranslation();
  const [visits, setVisits] = useState<AdminRecentVisit[]>([]);

  useEffect(() => {
    setVisits(getAdminRecentVisits(6));
  }, []);

  if (visits.length === 0) return null;

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_home_recent_aria")}
      data-tt-admin-home-recent="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_home_recent_title")}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {visits.map(({ path }) => {
          const href = adminRecentVisitHref(path);
          const label = t(adminRecentVisitTitleKey(path));
          return (
            <li key={path}>
              <AdminShellPrefetchLink
                href={href}
                className={`${touchTargetLink44Classes} ${ADMIN_RECENT_VISIT_CHIP_CLASS} ${travelFocusRingCoreOffset2WhiteClasses}`}
                data-tt-admin-recent-visit-path={path}
              >
                {label}
              </AdminShellPrefetchLink>
            </li>
          );
        })}
      </ul>
    </AdminWarmL5Surface>
  );
}
