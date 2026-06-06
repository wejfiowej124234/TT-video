"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  TT_LANDING_NAV_SHELL_CLASS,
} from "@/lib/traveltrustLandingNavStyles";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import {
  TT_LANDING_NAV_EMBEDDED_L5,
  TT_LANDING_NAV_L5,
  TT_LANDING_NAV_MOBILE_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { useTraveltrustSectionNav, type TraveltrustSectionId } from "./useTraveltrustSectionNav";

const NAV_ITEMS = TRAVELTRUST_SECTION_NAV_ITEMS;

type Props = {
  embedded?: boolean;
  compactOnHero?: boolean;
};

function navLinkClass(active: boolean, embedded: boolean): string {
  const base = embedded ? TT_LANDING_NAV_EMBEDDED_L5.linkBaseClass : TT_LANDING_NAV_LINK_BASE;
  return `${base} ${active ? TT_LANDING_NAV_LINK_ACTIVE : TT_LANDING_NAV_LINK_IDLE}`;
}

function NavLinks({
  active,
  onNavigate,
  className,
  items,
  embedded = false,
}: {
  active: (id: TraveltrustSectionId) => boolean;
  onNavigate?: () => void;
  className?: string;
  items: readonly (typeof NAV_ITEMS)[number][];
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <ul className={className}>
      {items.map((item) => {
        const label = t(item.labelKey);
        const short = truncateTraveltrustNavLabel(label);
        const isActive = active(item.sectionId);
        return (
          <li key={item.href} className="shrink-0">
            <motion.a
              href={item.href}
              aria-current={isActive ? "true" : undefined}
              whileHover={reduceMotion ? undefined : TT_LANDING_NAV_L5.linkHover}
              whileTap={reduceMotion ? undefined : TT_LANDING_NAV_L5.linkTap}
              data-tt-traveltrust-landing-nav-link-tap-l5="1"
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
              className={`${navLinkClass(isActive, embedded)} ${isActive ? TT_LANDING_NAV_L5.activeLinkClass : ""}`}
              title={label}
            >
              {short}
              {isActive ? (
                <motion.span
                  layoutId="tt-landing-nav-active-underline"
                  className={TT_LANDING_NAV_L5.activeUnderlineClass}
                  transition={TT_LANDING_NAV_L5.menuTransition}
                  aria-hidden
                />
              ) : null}
            </motion.a>
          </li>
        );
      })}
    </ul>
  );
}

/** v6 页内锚点导航（粘性，不替代根 layout Header） */
export function TravelTrustLandingNav({ embedded = false, compactOnHero = false }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const activeSection = useTraveltrustSectionNav();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [heroT, setHeroT] = useState(0);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const ignoreMoreOutsideCloseRef = useRef(false);

  useEffect(() => {
    if (!heroScroll) return;
    setHeroT(heroScroll.get());
    return heroScroll.on("change", (v) => {
      setHeroT(v);
    });
  }, [heroScroll]);

  useEffect(() => {
    if (!moreOpen || embedded) return;
    let onClickOutside: ((e: MouseEvent) => void) | null = null;
    let onKeyDown: ((e: KeyboardEvent) => void) | null = null;
    const timer = window.setTimeout(() => {
      onClickOutside = (e: MouseEvent) => {
        if (ignoreMoreOutsideCloseRef.current) return;
        if (!moreMenuRef.current?.contains(e.target as Node)) setMoreOpen(false);
      };
      onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMoreOpen(false);
      };
      document.addEventListener("click", onClickOutside, true);
      document.addEventListener("keydown", onKeyDown);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (onClickOutside) document.removeEventListener("click", onClickOutside, true);
      if (onKeyDown) document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen, embedded]);

  const heroCompact = compactOnHero && heroT < 0.14;

  const isActive = (sectionId: TraveltrustSectionId) =>
    activeSection === "hero" ? sectionId === "pulse" : activeSection === sectionId;

  const visibleItems = heroCompact
    ? NAV_ITEMS.filter((item) => TRAVELTRUST_HERO_COMPACT_SECTIONS.has(item.sectionId))
    : NAV_ITEMS;
  const overflowItems = heroCompact
    ? NAV_ITEMS.filter((item) => !TRAVELTRUST_HERO_COMPACT_SECTIONS.has(item.sectionId))
    : [];
  const overflowActive = overflowItems.some((item) => isActive(item.sectionId));
  const showOverflowMenu = !embedded && overflowItems.length > 0;
  const moreLabel = t("traveltrust_nav_more");
  const moreAriaLabel = moreLabel;

  const menuOpensAbove = embedded;
  const shellClass = embedded
    ? `relative z-[4] w-full overflow-visible ${TT_LANDING_NAV_EMBEDDED_L5.embeddedNavScrimClass}`
    : TT_LANDING_NAV_SHELL_CLASS;

  return (
    <nav
      className={shellClass}
      aria-label={t("traveltrust_nav_label")}
      data-tt-traveltrust-landing-nav="1"
      data-tt-traveltrust-landing-nav-embedded={embedded ? "1" : "0"}
      data-tt-traveltrust-landing-nav-compact={heroCompact ? "1" : "0"}
      data-tt-traveltrust-landing-nav-no-more={embedded ? "1" : "0"}
      data-tt-traveltrust-landing-nav-contrast="high"
      data-tt-traveltrust-landing-nav-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      style={{
        boxShadow: `0 10px 32px -20px rgba(252, 164, 124, ${(heroT * TT_LANDING_NAV_L5.heroShadowMul).toFixed(3)})`,
      }}
    >
      <motion.div className={`flex w-full items-center gap-2 ${heroCompact ? "md:gap-2.5" : "justify-between"}`}>
        <motion.button
          type="button"
          className={TT_LANDING_NAV_L5.mobileToggleClass}
          aria-expanded={mobileOpen}
          aria-controls="traveltrust-landing-nav-mobile"
          onClick={() => setMobileOpen((o) => !o)}
          whileTap={reduceMotion ? undefined : TT_LANDING_NAV_L5.mobileToggleTap}
          data-tt-traveltrust-landing-nav-toggle="1"
          data-tt-traveltrust-landing-nav-mobile-toggle-l5="1"
        >
          {mobileOpen ? t("traveltrust_nav_menu_close") : t("traveltrust_nav_menu_open")}
        </motion.button>
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex">
          <NavLinks
            active={isActive}
            items={visibleItems}
            embedded={embedded}
            className="flex max-w-full justify-end gap-0.5 overflow-x-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />
          {showOverflowMenu ? (
            <motion.div ref={moreMenuRef} className="relative shrink-0">
              <button
                type="button"
                className={navLinkClass(moreOpen || overflowActive, false)}
                aria-expanded={moreOpen}
                aria-label={moreAriaLabel}
                onClick={() => {
                  ignoreMoreOutsideCloseRef.current = true;
                  setMoreOpen((open) => !open);
                  window.setTimeout(() => {
                    ignoreMoreOutsideCloseRef.current = false;
                  }, 0);
                }}
                data-tt-traveltrust-landing-nav-more="1"
                data-tt-traveltrust-landing-nav-more-open={moreOpen ? "1" : "0"}
              >
                <span>{moreLabel}</span>
                <span aria-hidden className="ml-1 text-[10px] opacity-80">
                  {moreOpen ? "▴" : "▾"}
                </span>
              </button>
              {moreOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: menuOpensAbove ? 6 : -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={TT_LANDING_NAV_L5.menuTransition}
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
            </motion.div>
          ) : null}
        </div>
      </motion.div>
      {mobileOpen ? (
        <motion.div
          id="traveltrust-landing-nav-mobile"
          className="relative mt-2 border-t border-ref-sun/14 pt-2 md:hidden"
          data-tt-traveltrust-landing-nav-mobile="1"
          data-tt-traveltrust-landing-nav-mobile-l5="1"
          initial={{ opacity: 0, height: 0 }}
          animate={
            reduceMotion
              ? { opacity: 1, height: "auto" }
              : {
                  opacity: 1,
                  height: "auto",
                  boxShadow: [
                    "0 0 0 0 rgba(252,164,124,0)",
                    "0 0 18px -10px rgba(252,164,124,0.18)",
                    "0 0 0 0 rgba(252,164,124,0)",
                  ],
                }
          }
          transition={
            reduceMotion
              ? TT_LANDING_NAV_MOBILE_L5.panelTransition
              : {
                  ...TT_LANDING_NAV_MOBILE_L5.panelTransition,
                  boxShadow: {
                    duration: TT_LANDING_NAV_L5.mobilePanelGlow.duration,
                    repeat: TT_LANDING_NAV_L5.mobilePanelGlowRepeat,
                    ease: "easeInOut",
                  },
                }
          }
        >
          <NavLinks
            active={isActive}
            items={NAV_ITEMS}
            onNavigate={() => setMobileOpen(false)}
            className="flex flex-col gap-1"
          />
        </motion.div>
      ) : null}
    </nav>
  );
}
