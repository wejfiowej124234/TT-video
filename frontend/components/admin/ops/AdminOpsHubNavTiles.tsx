"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";
import {
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  adminHubEntryLinkClass,
} from "@/lib/adminUi";
import { travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

export const ADMIN_OPS_HUB_NAV_TILES_MAX = 6;

/** Hub page tiles from shell nav SSOT (≤6 · skip hub self · permission-aware). */
export function selectAdminOpsHubNavTiles(
  links: readonly AdminShellNavLinkDef[],
  options?: {
    max?: number;
    hasPermission?: (perm: string) => boolean;
    permissionsLoaded?: boolean;
  },
): AdminShellNavLinkDef[] {
  const max = options?.max ?? ADMIN_OPS_HUB_NAV_TILES_MAX;
  return links
    .filter((link) => !link.activeExact)
    .filter((link) => {
      if (!link.permission) return true;
      if (!options?.permissionsLoaded) return true;
      return options.hasPermission?.(link.permission) ?? true;
    })
    .slice(0, max);
}

/** Remaining hub links after the first `max` tiles (Batch-10 W14 · HU-259). */
export function selectAdminOpsHubNavOverflow(
  links: readonly AdminShellNavLinkDef[],
  options?: {
    max?: number;
    hasPermission?: (perm: string) => boolean;
    permissionsLoaded?: boolean;
  },
): AdminShellNavLinkDef[] {
  const max = options?.max ?? ADMIN_OPS_HUB_NAV_TILES_MAX;
  return links
    .filter((link) => !link.activeExact)
    .filter((link) => {
      if (!link.permission) return true;
      if (!options?.permissionsLoaded) return true;
      return options.hasPermission?.(link.permission) ?? true;
    })
    .slice(max);
}

type AdminOpsHubNavTilesProps = {
  links: readonly AdminShellNavLinkDef[];
  maxTiles?: number;
  /** data-* attribute name; value is the tile href (official e2e uses data-tt-admin-official-hub-link). */
  dataTtAttr?: string;
  className?: string;
  /** Batch-10 W14 · HU-259：展开剩余叶导航 */
  showMoreFold?: boolean;
};

export function AdminOpsHubNavTiles({
  links,
  maxTiles = ADMIN_OPS_HUB_NAV_TILES_MAX,
  dataTtAttr = "data-tt-admin-ops-hub-nav-tile",
  className,
  showMoreFold = false,
}: AdminOpsHubNavTilesProps) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const selectOpts = {
    max: maxTiles,
    hasPermission: caps.hasPermission,
    permissionsLoaded: caps.permissionsLoaded,
  };
  const tiles = selectAdminOpsHubNavTiles(links, selectOpts);
  const overflow = showMoreFold ? selectAdminOpsHubNavOverflow(links, selectOpts) : [];

  if (tiles.length === 0) {
    return (
      <div
        className={className}
        data-tt-admin-ops-hub-nav-tiles-empty="1"
        data-tt-admin-ops-hub-nav-tiles-state="DISABLED"
      >
        <p className="mb-6 text-body-s text-ink-600" data-tt-admin-ops-hub-tiles-empty-honesty="1">
          {t("admin_ops_hub_tiles_empty_not_open")}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        data-tt-admin-ops-hub-nav-tiles="1"
      >
        {tiles.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${adminHubEntryLinkClass()} ${travelFocusRingCoreOffset2WhiteClasses}`}
            {...{ [dataTtAttr]: link.href }}
          >
            <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
              <span className="text-body-l font-medium text-ink-900">{t(link.labelKey)}</span>
            </span>
          </Link>
        ))}
      </div>
      {overflow.length > 0 ? (
        <details
          className="mb-6 rounded-[var(--radius-md)] border border-ref-sun/16 bg-bg-console/40 px-4 py-3"
          data-tt-admin-ops-hub-more-fold="1"
        >
          <summary className="cursor-pointer text-body font-medium text-ink-800">
            {t("admin_ops_hub_more_modules")}
          </summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {overflow.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-body-s text-ref-sun underline"
                  data-tt-admin-ops-hub-more-link={link.href}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
