"use client";

import Link from "next/link";
import { ROLE_ENTRY_LINKS } from "@/lib/conversionFunnelModel";
import { trackPesRoleEntryClick } from "@/lib/conversionAnalyticsLayer";
import { buildPesAuthHref } from "@/lib/pesAuthReturnFlow";
import { PES_UI } from "@/lib/productEnhancementSprint";
import { usePesTouchpointImpression } from "@/lib/usePesAnalytics";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type RoleEntryQuickGridProps = {
  t: (key: string) => string;
  variant?: "dark" | "light";
  className?: string;
};

/** 四角色快速入口 — 首屏价值 + 招募转化（叠加层） */
function gridHrefForRole(role: (typeof ROLE_ENTRY_LINKS)[number]): string {
  if (role.id === "traveler") return buildPesAuthHref("register", "/", "register", "/");
  if (role.id === "guide") return buildPesAuthHref("login", "/guide/register", "guide_recruit", "/guide/register");
  if (role.id === "merchant") return buildPesAuthHref("register", "/provider/register", "merchant_onboard", "/provider/register");
  return role.href;
}

export function RoleEntryQuickGrid({ t, variant = "dark", className = "" }: RoleEntryQuickGridProps) {
  usePesTouchpointImpression("home");
  const shell =
    variant === "light"
      ? "rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/60 p-4 dark:border-ink-600/40 dark:bg-ink-900/30"
      : PES_UI.emptyPanel;

  return (
    <section
      className={`${shell} ${className}`}
      aria-label={t("pes2_role_grid_aria")}
      data-tt-pes-role-grid="1"
    >
      <h2 className={variant === "light" ? "text-small font-semibold text-ink-800 dark:text-ink-100" : PES_UI.emptyTitle}>
        {t("pes2_role_grid_title")}
      </h2>
      <p className={variant === "light" ? "mt-1 text-meta text-ink-600 dark:text-ink-300" : PES_UI.emptyBody}>
        {t("pes2_role_grid_subtitle")}
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" role="list">
        {ROLE_ENTRY_LINKS.map((role) => {
          const href = gridHrefForRole(role);
          return (
          <li key={role.id}>
            <Link
              href={href}
              onClick={() => trackPesRoleEntryClick("home", role.id, href)}
              className={
                `flex min-h-[44px] flex-col justify-center rounded-[var(--radius-md)] border px-3 py-2.5 ` +
                (variant === "light"
                  ? "border-ink-200/90 bg-white hover:bg-ink-50 dark:border-ink-600/45 dark:bg-ink-800/50"
                  : "border-slate-600/45 bg-ink-800/35 hover:bg-ink-700/40") +
                ` ${travelFocusRingCoreOffset2Classes}`
              }
            >
              <span className="text-small font-semibold text-cyan-200">{t(role.labelKey)}</span>
              <span className="text-meta text-slate-400 leading-snug">{t(role.descKey)}</span>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
