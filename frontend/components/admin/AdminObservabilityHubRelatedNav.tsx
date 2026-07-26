"use client";

import Link from "next/link";

import { OBSERVABILITY_PEER_RELATED_FOLD_LINKS } from "@/lib/admin/adminObservabilityRelatedFoldLinks";
import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_BREADCRUMB_SEPARATOR_CLASS,
  ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

/** 可观测枢纽 · 相关运维入口折叠（顶栏仅保留收件箱回链）。 */
export function AdminObservabilityHubRelatedNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="mb-4 space-y-2"
      aria-label={t("admin_observability_hub_related_aria")}
      data-tt-admin-obs-hub-related-nav="1"
    >
      <p className="text-small text-ink-600">
        <Link href="/admin" className={adminPageNavLinkClass()}>
          {t("admin_shell_nav_workspace")}
        </Link>
        <span className={`mx-2 ${ADMIN_BREADCRUMB_SEPARATOR_CLASS}`} aria-hidden>
          /
        </span>
        <span className="font-medium text-ink-800">{t("admin_observability_title")}</span>
      </p>
      <details className={ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS} data-tt-admin-obs-hub-related-fold="1">
        <summary className="cursor-pointer text-small font-medium text-ink-700">
          {t("admin_observability_hub_related_fold")}
        </summary>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
          {OBSERVABILITY_PEER_RELATED_FOLD_LINKS.map(({ href, labelKey }) => (
            <li key={href}>
              <Link href={href} className={adminPageNavLinkClass()}>
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
