"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_BREADCRUMB_SEPARATOR_CLASS,
  ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

export type AdminPlatformHubRelatedLink = { href: string; labelKey: string };

/** 平台枢纽页 · 面包屑 + 交叉域折叠入口（顶栏仅保留收件箱回链）。 */
export function AdminPlatformHubRelatedNav(props: {
  currentLabelKey: string;
  relatedLinks: readonly AdminPlatformHubRelatedLink[];
  ariaLabelKey: string;
  foldSummaryKey: string;
  dataTtNav: string;
  dataTtFold: string;
}) {
  const { t } = useTranslation();

  return (
    <nav
      className="mb-4 space-y-2"
      aria-label={t(props.ariaLabelKey)}
      data-tt-admin-platform-hub-related-nav={props.dataTtNav}
    >
      <p className="text-small text-ink-600">
        <Link href="/admin" className={adminPageNavLinkClass()}>
          {t("admin_shell_nav_workspace")}
        </Link>
        <span className={`mx-2 ${ADMIN_BREADCRUMB_SEPARATOR_CLASS}`} aria-hidden>
          /
        </span>
        <span className="font-medium text-ink-800">{t(props.currentLabelKey)}</span>
      </p>
      <details
        className={ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS}
        data-tt-admin-platform-hub-related-fold={props.dataTtFold}
      >
        <summary className="cursor-pointer text-small font-medium text-ink-700">
          {t(props.foldSummaryKey)}
        </summary>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
          {props.relatedLinks.map(({ href, labelKey }) => (
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
