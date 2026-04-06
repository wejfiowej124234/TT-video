"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";

/** 与 85 §三 IA 顺序对齐：Hero → Live → Stats → Quick → Video → Problem → Solution → Flow → Demo → … */
const SECTIONS: readonly { id: string; labelKey: string }[] = [
  { id: "hero", labelKey: "traveltrust_nav_hero" },
  { id: "overview", labelKey: "traveltrust_nav_overview" },
  { id: "live-network", labelKey: "traveltrust_nav_liveNetwork" },
  { id: "live-stats", labelKey: "traveltrust_nav_liveStats" },
  { id: "quick-explain", labelKey: "traveltrust_nav_quickExplain" },
  { id: "video", labelKey: "traveltrust_nav_video" },
  { id: "flow", labelKey: "traveltrust_nav_flow" },
  { id: "demo", labelKey: "traveltrust_nav_demo" },
  { id: "token-system", labelKey: "traveltrust_nav_tokenSystem" },
  { id: "allocation", labelKey: "traveltrust_nav_allocation" },
  { id: "settlement", labelKey: "traveltrust_nav_settlement" },
  { id: "fee-router", labelKey: "traveltrust_nav_feeRouter" },
  { id: "trust-facts", labelKey: "traveltrust_nav_trust" },
  { id: "global-map", labelKey: "traveltrust_nav_map" },
  { id: "faq", labelKey: "traveltrust_nav_faq" },
  { id: "cta", labelKey: "traveltrust_nav_cta" },
] as const;

const linkClassDefault =
  "shrink-0 rounded-full border border-ink-200/90 bg-bg-console/95 px-3 py-1.5 text-meta font-medium text-ink-700 hover:border-travel-300/70 hover:bg-travel-50/40 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console";

const linkClassGlass =
  "shrink-0 rounded-full border border-white/14 bg-slate-900/55 backdrop-blur-md px-3 py-1.5 text-meta font-medium text-slate-100 shadow-scifi-card-faint motion-sub hover:border-ref-cyan/45 hover:bg-slate-800/65 hover:shadow-scifi-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/**
 * 85 §三 IA：长页内锚点导航（scroll-mt 由各 section 承担）
 */
export default function TravelTrustSectionNav({ variant = "default" }: { variant?: "default" | "glass" }) {
  const { t } = useTranslation();
  const glass = variant === "glass";
  const linkClass = glass ? linkClassGlass : linkClassDefault;
  return (
    <nav
      className={
        glass
          ? "sticky top-0 z-20 -mx-4 border-b border-white/10 bg-slate-950/82 px-4 py-2.5 backdrop-blur-md sm:-mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:border-ref-cyan/20 sm:shadow-scifi-panel sm:ring-1 sm:ring-ref-coral/15"
          : "sticky top-0 z-20 -mx-4 border-b border-ink-200/60 bg-bg-console/85 px-4 py-2 backdrop-blur-md sm:-mx-0 sm:rounded-[var(--radius-md)] sm:border sm:shadow-soft"
      }
      aria-label={t("traveltrust_nav_aria")}
    >
      <p className="sr-only">{t("traveltrust_nav_intro_sr")}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map(({ id, labelKey }) => (
          <Link key={id} href={`#${id}`} className={linkClass}>
            {t(labelKey)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
