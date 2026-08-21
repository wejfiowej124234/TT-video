"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { getTraveltrustTextDirection } from "@/lib/traveltrustLocaleLayout";
import {
  TRAVELTRUST_ROLES,
  resolveTraveltrustTheaterRoleFromHash,
  type TravelTrustRoleId,
} from "@/app/traveltrust/traveltrustIdentityModel";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { resolveTraveltrustPlanTripHref } from "@/lib/traveltrustPlanTripHref";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import {
  buildTraveltrustTheaterRoleEnterHref,
  parseStartHashParams,
  setHeroGlobeP1StartContext,
  useHeroGlobeP1Link,
} from "@/lib/traveltrustHeroGlobeP1Link";
import { resolveTraveltrustTheaterCorridorContext } from "@/lib/traveltrustTheaterCorridorBinding";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import { RoleIcon } from "./RoleIcon";
import { TravelTrustRouteArc } from "./TravelTrustRouteArc";
import { TravelTrustRoleVideoPlayer } from "./TravelTrustRoleVideoPlayer";
import { TravelTrustTheaterScene3D } from "./TravelTrustTheaterScene3D";
import { TT_MARKETING_SITE_HEADER_STICKY_OFFSET_CLASS } from "@/lib/marketingUi";
import { TT_CINEMATIC_EASE, TT_THEATER_ENTRANCE_DELAY_S } from "./traveltrustCinematicMotion";
import { useTravelTrustTheaterRole } from "./TravelTrustTheaterRoleContext";
import type { TheaterViewportAnchor } from "./TravelTrustTheaterViewportContext";
import {
  resolveTheaterRoleWarmUi,
  TT_HERO_PRIMARY_CTA_L5,
  TT_THEATER_ROLE_CTA_L5,
  TT_SECTION_KICKER_L5,
  TT_THEATER_SECTION_L5,
  TT_THEATER_TAB_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrust/l5";

type Props = {
  onViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

export function TravelTrustIdentityTheater({ onViewportChange }: Props = {}) {
  const { t, locale } = useTranslation();
  const { brief } = useTravelTrustPageBriefContext();
  const planHref = resolveTraveltrustPlanTripHref(brief?.cta_contract.primary_target);
  const reduceMotion = useReducedMotion();
  const rtl = getTraveltrustTextDirection(locale) === "rtl";
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.roles.title;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-12% 0px" });
  const [flashKey, setFlashKey] = useState(0);
  const [theaterEntered, setTheaterEntered] = useState(!!reduceMotion);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { roleId, setRoleId } = useTravelTrustTheaterRole();
  const { startPrefillRegionId, startPrefillStepId } = useHeroGlobeP1Link();
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const theaterContextKey = `${startPrefillRegionId ?? ""}:${startPrefillStepId ?? "plan"}:${routeBias}`;
  const theaterContext = resolveTraveltrustTheaterCorridorContext(
    startPrefillRegionId,
    routeBias,
    startPrefillStepId,
  );
  const userPickedRoleRef = useRef(false);
  const lastTheaterContextKeyRef = useRef(theaterContextKey);

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
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const fromHash = resolveTraveltrustTheaterRoleFromHash(hash);
      if (fromHash) {
        userPickedRoleRef.current = true;
        setRoleId(fromHash);
      }
      const { region, step } = parseStartHashParams(hash);
      if (region || step) {
        setHeroGlobeP1StartContext(region, step);
        lastTheaterContextKeyRef.current = `${region ?? ""}:${step ?? "plan"}:${routeBias}`;
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [setRoleId, routeBias]);

  useEffect(() => {
    if (lastTheaterContextKeyRef.current !== theaterContextKey) {
      lastTheaterContextKeyRef.current = theaterContextKey;
      userPickedRoleRef.current = false;
    }
    if (userPickedRoleRef.current) return;
    setRoleId(theaterContext.defaultRoleId);
  }, [theaterContext.defaultRoleId, theaterContextKey, setRoleId]);

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

  const selectRole = useCallback(
    (id: TravelTrustRoleId) => {
      if (roleId !== id) {
        setFlashKey((k) => k + 1);
        trackTravelTrustEvent("traveltrust_role_tab_click", {
          source: "roles",
          target: `#panel-${id}`,
          role: id,
        });
      }
      userPickedRoleRef.current = true;
      setRoleId(id);
      if (typeof window !== "undefined") {
        const nextHash = `#${id}`;
        if (window.location.hash !== nextHash) {
          window.history.replaceState(
            window.history.state,
            "",
            `${window.location.pathname}${window.location.search}${nextHash}`,
          );
        }
      }
    },
    [roleId, setRoleId],
  );

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
      className={`relative ${TT_THEATER_SECTION_L5.sectionSurfaceClass}`}
      aria-labelledby={titleId}
      data-tt-traveltrust-theater-entered={showTheater ? "1" : "0"}
      data-tt-traveltrust-theater-l5="1"
      data-tt-traveltrust-theater-p2-narrative="1"
      data-tt-traveltrust-active-role-id={roleId}
      data-tt-traveltrust-theater-corridor={theaterContext.corridorId}
      data-tt-traveltrust-theater-region={startPrefillRegionId ?? ""}
      data-tt-traveltrust-theater-step-id={theaterContext.stepId}
      data-tt-traveltrust-theater-default-role-id={theaterContext.defaultRoleId}
      {...traveltrustSectionL5DataAttrs("theater")}
      initial={reduceMotion ? false : { y: 18 }}
      animate={showTheater ? { y: 0 } : { y: 18 }}
      transition={{ duration: TT_THEATER_SECTION_L5.entranceDuration, ease: TT_CINEMATIC_EASE }}
    >
      <div
        className={TT_THEATER_SECTION_L5.sectionBackdropClass}
        aria-hidden
        data-tt-traveltrust-theater-backdrop-l5="1"
      />
      <div
        className={TT_THEATER_SECTION_L5.sectionTopCapClass}
        aria-hidden
        data-tt-traveltrust-theater-top-cap-l5="1"
      />
      <motion.div
        className={TT_THEATER_SECTION_L5.sectionFloorCapClass}
        aria-hidden
        data-tt-traveltrust-theater-floor-cap-l5="1"
      />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-[2] ${TT_THEATER_SECTION_L5.topHandoffScrimHeightClass}`}
        aria-hidden
        data-tt-traveltrust-theater-top-handoff-l5="1"
        style={{ background: TT_THEATER_SECTION_L5.topHandoffScrimStyle }}
      />
      <p id={titleId} className="sr-only">
        {t("traveltrust_roles_section_sr")}
      </p>
      <motion.div
        className={TT_THEATER_SECTION_L5.introBlockClass}
        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
        animate={showTheater ? { opacity: 1, x: 0 } : undefined}
        transition={{
          duration: TT_THEATER_SECTION_L5.introCopyDuration,
          delay: TT_THEATER_SECTION_L5.introCopyDelay,
          ease: TT_CINEMATIC_EASE,
        }}
      >
        <p className={`${TT_SECTION_KICKER_L5} ${TT_THEATER_SECTION_L5.introKickerClass}`}>
          {t("traveltrust_roles_eyebrow")}
        </p>
        <motion.div className={TT_THEATER_SECTION_L5.introHeadlineBlockClass}>
          <h2 className={TT_THEATER_SECTION_L5.introHeadlineClass}>{t("traveltrust_roles_headline")}</h2>
          <p className={TT_THEATER_SECTION_L5.introSublineClass}>{t("traveltrust_roles_subline")}</p>
          <p
            className="mt-2 text-meta leading-relaxed text-slate-300/92"
            data-tt-traveltrust-roles-ttg-bridge="1"
          >
            {t("traveltrust_roles_ttg_bridge")}
          </p>
          <p
            className="mt-2 text-meta leading-snug text-slate-300/90"
            data-tt-traveltrust-theater-corridor-narrative-l5="1"
          >
            {t(theaterContext.narrativeSublineKey as "traveltrust_theater_corridor_any_step_plan")}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ref-sun/70">
            {t(theaterContext.corridorLabelKey)} · {t(`traveltrust_start_step_${theaterContext.stepId}`)}
          </p>
        </motion.div>
        <motion.p
          className="mt-4 text-meta font-medium text-ref-sun/80 sm:mt-5"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={showTheater ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: TT_THEATER_SECTION_L5.handoffLineDuration,
            delay: TT_THEATER_SECTION_L5.handoffLineDelay,
            ease: TT_CINEMATIC_EASE,
          }}
          data-tt-traveltrust-theater-handoff-l5="1"
        >
          {t("traveltrust_theater_handoff_line")}
        </motion.p>
      </motion.div>

      <motion.div className={`${TT_THEATER_SECTION_L5.stageShellClass} mx-auto max-w-3xl`}>
        <TravelTrustTheaterScene3D />
        <motion.div
          className={TT_THEATER_SECTION_L5.stageGridClass}
          initial={reduceMotion ? false : { opacity: 0.92, y: 8 }}
          animate={showTheater ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: TT_THEATER_SECTION_L5.stageTiltDuration, ease: TT_CINEMATIC_EASE }}
        >
        <motion.div
          role="tablist"
          aria-label={t("traveltrust_roles_tablist")}
          className={`relative z-[2] flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${TT_THEATER_SECTION_L5.mobileTablistClass} ${TT_MARKETING_SITE_HEADER_STICKY_OFFSET_CLASS} lg:z-[1] lg:w-full lg:flex-col lg:overflow-visible lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none`}
          data-tt-traveltrust-roles-tablist-mobile="1"
          data-tt-traveltrust-roles-count={String(TRAVELTRUST_ROLES.length)}
          onKeyDown={onKeyDown}
          data-tt-traveltrust-roles-order="traveler,guide,merchant,acquisition,region_steward"
          animate={
            showTheater && !reduceMotion
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(252,164,124,0)",
                    "0 0 20px -8px rgba(252,164,124,0.15)",
                    "0 0 0 0 rgba(252,164,124,0)",
                  ],
                }
              : undefined
          }
          transition={
            showTheater && !reduceMotion
              ? {
                  duration: TT_THEATER_SECTION_L5.mobileTablistGlow.duration,
                  repeat: TT_THEATER_SECTION_L5.mobileTablistGlow.repeat,
                  ease: "easeInOut",
                }
              : undefined
          }
        >
          {TRAVELTRUST_ROLES.map((role, i) => {
            const selected = role.id === roleId;
            const warmUi = resolveTheaterRoleWarmUi(role.id);
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
                whileTap={reduceMotion ? undefined : TT_THEATER_SECTION_L5.tabTap}
                initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                animate={showTheater ? { opacity: 1, x: 0 } : undefined}
                transition={{
                  duration: TT_THEATER_TAB_L5.tabEntranceDuration,
                  delay: TT_THEATER_TAB_L5.staggerDelay + i * TT_THEATER_TAB_L5.staggerBase,
                  ease: TT_CINEMATIC_EASE,
                }}
                className={`${TT_THEATER_TAB_L5.tabButtonBaseClass} ${
                  selected ? `${warmUi.tabActive} ${TT_THEATER_TAB_L5.selectedShadow}` : `${TT_THEATER_TAB_L5.idleBorderClass} ${TT_THEATER_TAB_L5.idleTextClass} ${TT_THEATER_TAB_L5.idleHover}`
                }`}
              >
                <motion.span
                  aria-hidden
                  animate={selected && !reduceMotion ? { scale: 1.08, opacity: 1 } : { scale: 1, opacity: 0.72 }}
                  transition={{ duration: TT_THEATER_TAB_L5.iconPulseDuration }}
                  className="inline-flex shrink-0"
                >
                  <RoleIcon icon={role.icon} className={TT_THEATER_TAB_L5.tabIconClass} />
                </motion.span>
                <span className="text-small font-semibold">{t(role.nameKey)}</span>
                {selected ? (
                  <motion.span
                    layoutId="tt-role-tab-indicator"
                    className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r ${warmUi.gradient} lg:bottom-2 lg:left-0 lg:right-auto lg:top-2 lg:h-auto lg:w-0.5`}
                    transition={TT_THEATER_TAB_L5.indicatorSpring}
                  />
                ) : null}
              </motion.button>
            );
          })}
        </motion.div>
        <motion.div
          className={TT_THEATER_SECTION_L5.panelStackClass}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={showTheater ? { opacity: 1, y: 0 } : undefined}
          transition={{
            opacity: { duration: TT_THEATER_SECTION_L5.videoPanelEntranceDuration, delay: TT_THEATER_SECTION_L5.videoPanelStagger, ease: TT_CINEMATIC_EASE },
            y: { duration: TT_THEATER_SECTION_L5.videoPanelEntranceDuration, delay: TT_THEATER_SECTION_L5.videoPanelStagger, ease: TT_CINEMATIC_EASE },
          }}
        >
        <motion.div
          className={TT_THEATER_SECTION_L5.theaterPanelFrameClass}
          data-tt-traveltrust-theater-panel-border-pulse-l5="1"
          data-tt-traveltrust-theater-panel-frame-l5="1"
        >
          <motion.div
            className="absolute inset-0 z-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={showTheater ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: TT_THEATER_SECTION_L5.routeArcFadeDuration,
              delay: TT_THEATER_SECTION_L5.routeArcFadeDelay,
              ease: TT_CINEMATIC_EASE,
            }}
          >
            <TravelTrustRouteArc variant="theater" />
          </motion.div>
          <motion.div
            className="relative z-[1]"
            role="tabpanel"
            id={`panel-${activeRole.id}`}
            aria-labelledby={`tab-${activeRole.id}`}
          >
            <AnimatePresence mode="wait">
              <TravelTrustRoleVideoPlayer
                key={activeRole.id}
                role={activeRole}
                active
                flashKey={flashKey}
              />
            </AnimatePresence>
          </motion.div>
            <motion.div
              className={`${TT_THEATER_SECTION_L5.roleMetaPanelClass} ${TT_THEATER_SECTION_L5.roleMetaStackClass}`}
              key={activeRole.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: TT_THEATER_TAB_L5.titleEntranceDuration, ease: TT_CINEMATIC_EASE }}
            >
              <motion.div>
                <motion.h3
                  className={`${TT_THEATER_SECTION_L5.roleMetaTitleClass} bg-gradient-to-r bg-clip-text text-transparent ${resolveTheaterRoleWarmUi(activeRole.id).gradient}`}
                >
                  {t(activeRole.nameKey)}
                </motion.h3>
                {activeRole.id !== "traveler" ? (
                  <p className={TT_THEATER_SECTION_L5.roleMetaTagClass}>{t(activeRole.tagKey)}</p>
                ) : null}
              </motion.div>
              <motion.div
                className={TT_THEATER_SECTION_L5.roleCtaStackClass}
                data-tt-traveltrust-role-cta-stack="1"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: TT_THEATER_TAB_L5.titleEntranceDuration,
                  delay: TT_THEATER_ROLE_CTA_L5.ctaStackStagger,
                  ease: TT_CINEMATIC_EASE,
                }}
              >
                <motion.div
                  whileHover={reduceMotion ? undefined : TT_THEATER_ROLE_CTA_L5.primaryHover}
                  whileTap={reduceMotion ? undefined : TT_THEATER_ROLE_CTA_L5.primaryTap}
                  className="w-full"
                  data-tt-traveltrust-theater-cta-motion-l5="1"
                >
                  <Link
                    href={buildTraveltrustTheaterRoleEnterHref(
                      activeRole.id,
                      planHref,
                      startPrefillRegionId,
                      theaterContext.stepId,
                    )}
                    data-tt-traveltrust-role-enter-href={buildTraveltrustTheaterRoleEnterHref(
                      activeRole.id,
                      planHref,
                      startPrefillRegionId,
                      theaterContext.stepId,
                    )}
                    onClick={() =>
                      trackTravelTrustEvent("traveltrust_role_enter_click", {
                        source: "roles",
                        target: activeRole.id === "traveler" ? planHref : activeRole.href,
                        role: activeRole.id,
                      })
                    }
                    className={`${TT_HERO_PRIMARY_CTA_L5} ${TT_THEATER_ROLE_CTA_L5.primaryGlowClass}`}
                    data-tt-traveltrust-role-plan-warm={activeRole.id === "traveler" ? "1" : undefined}
                  >
                    {activeRole.id === "traveler"
                      ? t("traveltrust_role_enter_plan")
                      : t(activeRole.enterKey)}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
