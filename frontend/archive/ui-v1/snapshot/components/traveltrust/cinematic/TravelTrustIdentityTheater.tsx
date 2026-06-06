"use client";

import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { getTraveltrustTextDirection } from "@/lib/traveltrustLocaleLayout";
import {
  TRAVELTRUST_ROLES,
  type TravelTrustRoleId,
} from "@/app/traveltrust/traveltrustIdentityModel";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { resolveTraveltrustRoleEnterHref } from "@/lib/traveltrustPlanTripHref";
import { RoleIcon } from "./RoleIcon";
import { TravelTrustRouteArc } from "./TravelTrustRouteArc";
import { TravelTrustRoleVideoPlayer } from "./TravelTrustRoleVideoPlayer";
import { TravelTrustTheaterScene3D } from "./TravelTrustTheaterScene3D";
import { TT_CINEMATIC_EASE, TT_THEATER_ENTRANCE_DELAY_S } from "./traveltrustCinematicMotion";
import { useTravelTrustTheaterRole } from "./TravelTrustTheaterRoleContext";
import type { TheaterViewportAnchor } from "./TravelTrustTheaterViewportContext";

type Props = {
  onViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

export function TravelTrustIdentityTheater({ onViewportChange }: Props = {}) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const rtl = getTraveltrustTextDirection(locale) === "rtl";
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.roles.title;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-12% 0px" });
  const [roleId, setRoleId] = useState<TravelTrustRoleId>("traveler");
  const [flashKey, setFlashKey] = useState(0);
  const [theaterEntered, setTheaterEntered] = useState(!!reduceMotion);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { setRoleId: setTheaterRoleId } = useTravelTrustTheaterRole();

  useEffect(() => {
    if (reduceMotion) {
      setTheaterEntered(true);
      return;
    }
    const id = window.setTimeout(() => setTheaterEntered(true), TT_THEATER_ENTRANCE_DELAY_S * 1000);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  useEffect(() => {
    const applyHash = () => {
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const fromHash = TRAVELTRUST_ROLES.find((r) => r.id === hash);
      if (fromHash) {
        setRoleId(fromHash.id);
        setTheaterRoleId(fromHash.id);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [setTheaterRoleId]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !onViewportChange) return;
    let raf = 0;
    const report = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        onViewportChange({ centerY: r.top + r.height * 0.42, height: r.height });
      });
    };
    report();
    window.addEventListener("scroll", report, { passive: true });
    window.addEventListener("resize", report);
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", report);
      window.removeEventListener("resize", report);
      ro.disconnect();
      onViewportChange(null);
    };
  }, [onViewportChange]);

  const showTheater = theaterEntered || inView;

  const activeRole = TRAVELTRUST_ROLES.find((r) => r.id === roleId) ?? TRAVELTRUST_ROLES[0];

  const selectRole = useCallback((id: TravelTrustRoleId) => {
    setRoleId((prev) => {
      if (prev !== id) {
        trackTravelTrustEvent("traveltrust_role_tab_click", {
          source: "roles",
          target: `#panel-${id}`,
          role: id,
        });
      }
      return id;
    });
    setFlashKey((k) => k + 1);
    setTheaterRoleId(id);
  }, [setTheaterRoleId]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = TRAVELTRUST_ROLES.findIndex((r) => r.id === roleId);
      const forward =
        e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight");
      const backward =
        e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft");
      if (forward) {
        e.preventDefault();
        const next = TRAVELTRUST_ROLES[(idx + 1) % TRAVELTRUST_ROLES.length];
        selectRole(next.id);
        tabRefs.current[next.id]?.focus();
      }
      if (backward) {
        e.preventDefault();
        const next = TRAVELTRUST_ROLES[(idx - 1 + TRAVELTRUST_ROLES.length) % TRAVELTRUST_ROLES.length];
        selectRole(next.id);
        tabRefs.current[next.id]?.focus();
      }
    },
    [roleId, rtl, selectRole],
  );

  return (
    <motion.section
      ref={sectionRef}
      id="roles"
      className="scroll-mt-28 border-t border-white/10 pt-10 sm:pt-14"
      aria-labelledby={titleId}
      data-tt-traveltrust-theater-entered={showTheater ? "1" : "0"}
      initial={reduceMotion ? false : { opacity: 0, y: 48 }}
      animate={showTheater ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: TT_CINEMATIC_EASE }}
    >
      <p id={titleId} className="sr-only">
        {t("traveltrust_roles_section_sr")}
      </p>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
        animate={showTheater ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.5, delay: 0.08, ease: TT_CINEMATIC_EASE }}
      >
        <p className="text-kicker font-semibold uppercase tracking-[0.2em] text-ref-cyan/80">
          {t("traveltrust_roles_eyebrow")}
        </p>
        <h2 className="mt-2 text-h3 font-bold text-white sm:text-h2">{t("traveltrust_roles_headline")}</h2>
        <p className="mt-2 max-w-xl text-meta text-slate-400">{t("traveltrust_roles_subline")}</p>
      </motion.div>

      <motion.div className="relative mt-8 [perspective:1600px]">
        <TravelTrustTheaterScene3D />
        <TravelTrustRouteArc />
        <motion.div
          className="relative flex flex-col gap-6 lg:flex-row lg:gap-8 [transform-style:preserve-3d]"
          initial={reduceMotion ? false : { rotateX: 5, opacity: 0.9 }}
          animate={showTheater ? { rotateX: 0, opacity: 1 } : undefined}
          transition={{ duration: 0.7, ease: TT_CINEMATIC_EASE }}
        >
        <div
          role="tablist"
          aria-label={t("traveltrust_roles_tablist")}
          className="relative z-[1] flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:w-52 lg:flex-col lg:overflow-visible"
          onKeyDown={onKeyDown}
          data-tt-traveltrust-roles-order="traveler,guide,provider,region_steward"
        >
          {TRAVELTRUST_ROLES.map((role, i) => {
            const selected = role.id === roleId;
            return (
              <motion.button
                key={role.id}
                ref={(el) => {
                  tabRefs.current[role.id] = el;
                }}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                id={`tab-${role.id}`}
                aria-controls={`panel-${role.id}`}
                onClick={() => selectRole(role.id)}
                onKeyDown={onKeyDown}
                initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                animate={showTheater ? { opacity: 1, x: 0 } : undefined}
                transition={{ duration: 0.4, delay: 0.12 + i * 0.06, ease: TT_CINEMATIC_EASE }}
                className={`relative flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-left motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 ${
                  selected
                    ? role.accent.tabActive
                    : "border-white/10 bg-ink-900/40 text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                <motion.span
                  aria-hidden
                  animate={selected && !reduceMotion ? { scale: 1.08, opacity: 1 } : { scale: 1, opacity: 0.72 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex shrink-0"
                >
                  <RoleIcon icon={role.icon} className="h-5 w-5" />
                </motion.span>
                <span className="text-small font-semibold">{t(role.nameKey)}</span>
                {selected ? (
                  <motion.span
                    layoutId="tt-role-tab-indicator"
                    className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r ${role.accent.gradient} lg:bottom-2 lg:left-0 lg:right-auto lg:top-2 lg:h-auto lg:w-0.5`}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </motion.button>
            );
          })}
        </div>
        <motion.div
          className="relative z-[1] min-w-0 flex-1"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={showTheater ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.2, ease: TT_CINEMATIC_EASE }}
        >
          <div
            role="tabpanel"
            id={`panel-${activeRole.id}`}
            aria-labelledby={`tab-${activeRole.id}`}
          >
            <TravelTrustRoleVideoPlayer role={activeRole} active flashKey={flashKey} />
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <motion.h3
                  key={activeRole.id}
                  className={`bg-gradient-to-r bg-clip-text text-h3 font-bold text-transparent ${activeRole.accent.gradient}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: TT_CINEMATIC_EASE }}
                >
                  {t(activeRole.nameKey)}
                </motion.h3>
                <p className="mt-1 text-kicker uppercase tracking-widest text-slate-400">{t(activeRole.tagKey)}</p>
              </div>
              <Link
                href={resolveTraveltrustRoleEnterHref(activeRole.href)}
                data-tt-traveltrust-role-enter-href={resolveTraveltrustRoleEnterHref(activeRole.href)}
                onClick={() =>
                  trackTravelTrustEvent("traveltrust_role_enter_click", {
                    source: "roles",
                    target: activeRole.href,
                    role: activeRole.id,
                  })
                }
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-cta-gradient px-6 py-2.5 text-small font-semibold text-white shadow-medium transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60"
              >
                {t(activeRole.enterKey)}
              </Link>
            </div>
          </div>
        </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
