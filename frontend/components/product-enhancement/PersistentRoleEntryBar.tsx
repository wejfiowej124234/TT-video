"use client";

import Link from "next/link";
import { ROLE_ENTRY_LINKS } from "@/lib/conversionFunnelModel";
import { trackPesCtaClick, trackPesRoleEntryClick } from "@/lib/conversionAnalyticsLayer";
import { buildPesAuthHref } from "@/lib/pesAuthReturnFlow";
import { usePesTouchpointImpression } from "@/lib/usePesAnalytics";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type PersistentRoleEntryBarProps = {
  t: (key: string) => string;
  className?: string;
};

const ROLE_INTENT: Record<
  (typeof ROLE_ENTRY_LINKS)[number]["id"],
  { intent: "register" | "guide_recruit" | "merchant_onboard" | "register"; useAuth: boolean }
> = {
  traveler: { intent: "register", useAuth: true },
  guide: { intent: "guide_recruit", useAuth: true },
  merchant: { intent: "merchant_onboard", useAuth: true },
  govern: { intent: "register", useAuth: false },
};

function hrefForRole(
  role: (typeof ROLE_ENTRY_LINKS)[number],
): string {
  const cfg = ROLE_INTENT[role.id];
  if (!cfg.useAuth) return role.href;
  if (role.id === "guide") {
    return buildPesAuthHref("login", "/guide/register", "guide_recruit", "/guide/register");
  }
  if (role.id === "merchant") {
    return buildPesAuthHref("register", "/provider/register", "merchant_onboard", "/provider/register");
  }
  return buildPesAuthHref("register", "/", "register", "/");
}

/** Wave 4 · 首屏常驻四角色入口（空态/生成中/有结果均可见） */
export function PersistentRoleEntryBar({ t, className = "" }: PersistentRoleEntryBarProps) {
  usePesTouchpointImpression("home");

  return (
    <nav
      className={`rounded-[var(--radius-md)] border border-cyan-400/25 bg-ink-900/50 backdrop-blur-sm px-3 py-2.5 sm:px-4 ${className}`}
      aria-label={t("pes4_role_bar_aria")}
      data-tt-pes-role-bar="persistent"
      data-tt-pes-wave4="CC-P0-03"
    >
      <p className="text-meta font-medium text-cyan-100/95 mb-2">{t("pes4_role_bar_title")}</p>
      <ul
        className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
        role="list"
      >
        {ROLE_ENTRY_LINKS.map((role) => {
          const href = hrefForRole(role);
          return (
            <li key={role.id} className="snap-start shrink-0">
              <Link
                href={href}
                onClick={() => {
                  trackPesRoleEntryClick("home", role.id, href);
                  trackPesCtaClick("home", href, `pes4_role_bar_${role.id}`);
                }}
                className={
                  `inline-flex min-h-[44px] flex-col justify-center rounded-full border border-slate-500/45 ` +
                  `bg-ink-800/55 px-3 py-1.5 text-meta whitespace-nowrap hover:bg-ink-700/50 ` +
                  travelFocusRingCoreOffset2Classes
                }
              >
                <span className="font-semibold text-cyan-200">{t(role.labelKey)}</span>
                <span className="text-[0.7rem] text-slate-400 leading-tight max-w-[9rem] truncate sm:max-w-none">
                  {t(role.descKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-meta text-slate-400/90">{t("pes4_role_bar_hint")}</p>
    </nav>
  );
}
