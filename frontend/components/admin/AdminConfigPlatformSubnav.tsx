"use client";

import Link from "next/link";

import { CONFIG_PLATFORM_SUBNAV_LINKS } from "@/app/admin/config/adminConfigHubPageModel";
import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_BREADCRUMB_SEPARATOR_CLASS,
  ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

/** 配置/平台维护子页：面包屑 + 相关页折叠（P2-1 · 非顶栏 link wall）。 */
export function AdminConfigPlatformSubnav(props: {
  currentLabelKey: string;
  parent?: { href: string; labelKey: string };
}) {
  const { t } = useTranslation();
  const { currentLabelKey, parent } = props;

  return (
    <nav
      className="mb-4 space-y-2"
      aria-label={t("admin_config_platform_subnav_aria")}
      data-tt-admin-config-platform-subnav="1"
    >
      <p className="text-small text-ink-600">
        <Link href="/admin/config" className={adminPageNavLinkClass()} data-tt-admin-config-platform-subnav-hub="1">
          {t("admin_config_hub_title")}
        </Link>
        {parent ? (
          <>
            <span className={`mx-2 ${ADMIN_BREADCRUMB_SEPARATOR_CLASS}`} aria-hidden>
              /
            </span>
            <Link
              href={parent.href}
              className={adminPageNavLinkClass()}
              data-tt-admin-config-platform-subnav-parent="1"
            >
              {t(parent.labelKey)}
            </Link>
          </>
        ) : null}
        <span className={`mx-2 ${ADMIN_BREADCRUMB_SEPARATOR_CLASS}`} aria-hidden>
          /
        </span>
        <span className="font-medium text-ink-800">{t(currentLabelKey)}</span>
      </p>
      <details
        className={ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS}
        data-tt-admin-config-platform-subnav-fold="1"
      >
        <summary className="cursor-pointer text-small font-medium text-ink-700">
          {t("admin_config_platform_subnav_related")}
        </summary>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
          {CONFIG_PLATFORM_SUBNAV_LINKS.map(({ href, labelKey }) => (
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
