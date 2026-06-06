"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { truncateTraveltrustNavLabel } from "@/lib/traveltrustLocaleLayout";
import {
  TRAVELTRUST_HERO_COMPACT_SECTIONS,
  TRAVELTRUST_SECTION_NAV_ITEMS,
} from "@/lib/traveltrustSectionNavItems";
import {
  TT_LANDING_NAV_LINK_ACTIVE,
  TT_LANDING_NAV_LINK_BASE,
  TT_LANDING_NAV_LINK_IDLE,
  TT_LANDING_NAV_MORE_MENU_ABOVE_CLASS,
  TT_LANDING_NAV_MORE_MENU_BELOW_CLASS,
  TT_LANDING_NAV_MORE_TRIGGER_COMPACT_CLASS,
  TT_LANDING_NAV_SHELL_CLASS,
} from "@/lib/traveltrustLandingNavStyles";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { useTraveltrustSectionNav, type TraveltrustSectionId } from "./useTraveltrustSectionNav";

const NAV_ITEMS = TRAVELTRUST_SECTION_NAV_ITEMS;

type Props = {
  embedded?: boolean;
  compactOnHero?: boolean;
};

function navLinkClass(active: boolean): string {
  return `${TT_LANDING_NAV_LINK_BASE} ${active ? TT_LANDING_NAV_LINK_ACTIVE : TT_LANDING_NAV_LINK_IDLE}`;
}

function NavLinks({
  active,
  onNavigate,
  className,
  items,
}: {
  active: (id: TraveltrustSectionId) => boolean;
  onNavigate?: () => void;
  className?: string;
  items: readonly (typeof NAV_ITEMS)[number][];
}) {
  const { t } = useTranslation();

  return (
    <ul className={className}>
      {items.map((item) => {
        const label = t(item.labelKey);
        const short = truncateTraveltrustNavLabel(label);
        return (
          <li key={item.href} className="shrink-0">
            <a
              href={item.href}
              aria-current={active(item.sectionId) ? "true" : undefined}
              onClick={() => {
                if ("scrollEvent" in item && item.scrollEvent) {
                  trackTravelTrustEvent(item.scrollEvent, { source: "nav", target: item.href });
                } else {
                  trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                    source: "nav",
                    target: item.href,
                  });
                }
                onNavigate?.();
              }}
              className={navLinkClass(active(item.sectionId))}
              title={label}
            >
              {short}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** v6 页内锚点导航（粘性，不替代根 layout Header） */
export function TravelTrustLandingNav({ embedded = false, compactOnHero = false }: Props) {
  const { t } = useTranslation();
  const activeSection = useTraveltrustSectionNav();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [heroT, setHeroT] = useState(0);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!heroScroll) return;
    setHeroT(heroScroll.get());
    return heroScroll.on("change", (v) => {
      setHeroT(v);
      if (v >= 0.14) setMoreOpen(false);
    });
  }, [heroScroll]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!moreMenuRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  const heroCompact =
    compactOnHero && heroT < 0.14 && (activeSection === "hero" || activeSection === "pulse");

  const isActive = (sectionId: TraveltrustSectionId) =>
    activeSection === "hero" ? sectionId === "pulse" : activeSection === sectionId;

  const visibleItems = heroCompact
    ? NAV_ITEMS.filter((item) => TRAVELTRUST_HERO_COMPACT_SECTIONS.has(item.sectionId))
    : NAV_ITEMS;
  const overflowItems = heroCompact
    ? NAV_ITEMS.filter((item) => !TRAVELTRUST_HERO_COMPACT_SECTIONS.has(item.sectionId))
    : [];
  const overflowActive = overflowItems.some((item) => isActive(item.sectionId));
  const moreLabel = heroCompact
    ? t("traveltrust_nav_more_sections", { count: String(overflowItems.length) })
    : t("traveltrust_nav_more");
  const moreAriaLabel = heroCompact
    ? t("traveltrust_nav_more_sections_aria", {
        count: String(overflowItems.length),
        sections: overflowItems.map((item) => t(item.labelKey)).join(" · "),
      })
    : moreLabel;

  const menuOpensAbove = embedded;
  const shellClass = embedded ? "relative z-[4] w-full overflow-visible" : TT_LANDING_NAV_SHELL_CLASS;

  return (
    <nav
      className={shellClass}
      aria-label={t("traveltrust_nav_label")}
      data-tt-traveltrust-landing-nav="1"
      data-tt-traveltrust-landing-nav-embedded={embedded ? "1" : "0"}
      data-tt-traveltrust-landing-nav-compact={heroCompact ? "1" : "0"}
      data-tt-traveltrust-landing-nav-contrast="high"
    >
      <div className={`flex w-full items-center gap-2 ${heroCompact ? "md:gap-3" : "justify-between"}`}>
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/16 bg-ink-900/50 px-3 py-1.5 text-meta font-medium text-slate-100 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="traveltrust-landing-nav-mobile"
          onClick={() => setMobileOpen((o) => !o)}
          data-tt-traveltrust-landing-nav-toggle="1"
        >
          {mobileOpen ? t("traveltrust_nav_menu_close") : t("traveltrust_nav_menu_open")}
        </button>
        <div className="hidden min-w-0 items-center gap-1.5 md:flex">
          <NavLinks
            active={isActive}
            items={visibleItems}
            className="flex max-w-full gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />
        {overflowItems.length > 0 ? (
          <div ref={moreMenuRef} className="relative shrink-0">
            <button
              type="button"
              className={`${navLinkClass(moreOpen || overflowActive)} ${
                heroCompact ? TT_LANDING_NAV_MORE_TRIGGER_COMPACT_CLASS : ""
              }`}
              aria-expanded={moreOpen}
              aria-label={moreAriaLabel}
              onClick={() => setMoreOpen((o) => !o)}
              data-tt-traveltrust-landing-nav-more="1"
              data-tt-traveltrust-landing-nav-more-count={String(overflowItems.length)}
            >
              <span>{moreLabel}</span>
              {heroCompact ? (
                <span
                  aria-hidden
                  className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ref-cyan/25 px-1.5 text-[10px] font-bold tabular-nums text-ref-cyan"
                >
                  {overflowItems.length}
                </span>
              ) : null}
              <span aria-hidden className="ml-1 text-[10px] opacity-80">
                {moreOpen ? "▴" : "▾"}
              </span>
            </button>
            {moreOpen ? (
              <motion.div
                initial={{ opacity: 0, y: menuOpensAbove ? 6 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={
                  menuOpensAbove
                    ? TT_LANDING_NAV_MORE_MENU_ABOVE_CLASS
                    : TT_LANDING_NAV_MORE_MENU_BELOW_CLASS
                }
                data-tt-traveltrust-landing-nav-more-menu="1"
                data-tt-traveltrust-landing-nav-more-placement={menuOpensAbove ? "above" : "below"}
                role="menu"
              >
                <NavLinks
                  active={isActive}
                  items={overflowItems}
                  onNavigate={() => setMoreOpen(false)}
                  className="flex flex-col gap-0.5 px-1"
                />
              </motion.div>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
      {mobileOpen ? (
        <div
          id="traveltrust-landing-nav-mobile"
          className="mt-2 border-t border-white/10 pt-2 md:hidden"
          data-tt-traveltrust-landing-nav-mobile="1"
        >
          <NavLinks
            active={isActive}
            items={NAV_ITEMS}
            onNavigate={() => setMobileOpen(false)}
            className="flex flex-col gap-1"
          />
        </div>
      ) : null}
    </nav>
  );
}
