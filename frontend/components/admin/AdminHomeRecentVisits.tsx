"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_RECENT_PATH_TITLE_KEYS,
  adminRecentVisitHref,
  getAdminRecentVisits,
  type AdminRecentVisit,
} from "@/lib/admin/adminRecentVisits";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

export function AdminHomeRecentVisits() {
  const { t } = useTranslation();
  const [visits, setVisits] = useState<AdminRecentVisit[]>([]);

  useEffect(() => {
    setVisits(getAdminRecentVisits(6));
  }, []);

  if (visits.length === 0) return null;

  return (
    <section
      className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4"
      aria-label={t("admin_home_recent_aria")}
      data-tt-admin-home-recent="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_home_recent_title")}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {visits.map(({ path }) => {
          const titleKey = ADMIN_RECENT_PATH_TITLE_KEYS[path] ?? "admin_shell_nav_workspace";
          const href = adminRecentVisitHref(path);
          return (
            <li key={path}>
              <Link
                href={href}
                className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-full border border-ink-200 bg-ink-50 px-3 text-small font-medium text-ink-800 hover:border-ink-300 hover:bg-white ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t(titleKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
