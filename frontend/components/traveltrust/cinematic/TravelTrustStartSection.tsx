"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import FeeRouterWiringNotice from "@/components/escrow/FeeRouterWiringNotice";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { resolveTraveltrustPlanTripHref } from "@/lib/traveltrustPlanTripHref";
import { scrollTraveltrustHashIntoView } from "@/lib/traveltrustSectionHash";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import {
  TT_MARKETING_BTN_GHOST,
  TT_MARKETING_BTN_PRIMARY_WARM_HERO,
  TT_MARKETING_TRAVELTRUST_FEE_ROUTER_LINK,
  TT_MARKETING_TRAVELTRUST_FEE_ROUTER_PANEL,
  TT_MARKETING_TRAVELTRUST_FEE_ROUTER_PANEL_TRIGGER,
} from "@/lib/marketingUi";
import { TravelTrustPageComplianceBlock } from "./TravelTrustPageComplianceBlock";
import {
  traveltrustL5SequentialChildProps,
  traveltrustSectionChildStagger,
} from "./traveltrustSectionMotion";
import { TravelTrustStartRoutePreview } from "./TravelTrustStartRoutePreview";
import {
  TT_L5_MOTION_EASE,
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_SECTION_META_L5,
  TT_START_SECTION_L5,
  TT_START_STEP_L5,
  TT_TRAVELTRUST_MARKETING_WARM_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrust/l5";
import { TRAVELTRUST_START_L5_STEPS, useTraveltrustStartStepController } from "./traveltrustStartStepL5";

export type StartP2ProbeBridge = {
  selectStartStepByIndex: (index: number) => void;
};

declare global {
  interface Window {
    __ttStartP2Probe?: StartP2ProbeBridge;
  }
}
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { resolveTraveltrustStartCorridorBinding } from "@/lib/traveltrustStartCorridorBinding";
import { resolveTraveltrustStartStepIndex } from "@/lib/traveltrustStartStepIds";
import {
  parseStartHashParams,
  setHeroGlobeP1StartContext,
  useHeroGlobeP1Link,
  writeTraveltrustStartHash,
} from "@/lib/traveltrustHeroGlobeP1Link";

export function TravelTrustStartSection() {
  const { t } = useTranslation();
  const { brief } = useTravelTrustPageBriefContext();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.start.title;
  const [feeOpen, setFeeOpen] = useState(false);
  const feePanelRef = useRef<HTMLDivElement>(null);
  const planHref = resolveTraveltrustPlanTripHref(brief?.cta_contract.primary_target);
  const { activeStep: activeStartStep, selectStep, pauseCycle, resumeCycle } =
    useTraveltrustStartStepController(reduceMotion);
  const { startPrefillRegionId, startPrefillStepId } = useHeroGlobeP1Link();
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const corridorBinding = useMemo(
    () => resolveTraveltrustStartCorridorBinding(startPrefillRegionId, routeBias),
    [startPrefillRegionId, routeBias],
  );
  const activeStepId = TRAVELTRUST_START_L5_STEPS[activeStartStep] ?? "plan";
  const ghostCtaClass = TT_START_SECTION_L5.ctaGhostClass;

  const applyStartHashToUi = useCallback(
    (hash: string) => {
      const { region, step } = parseStartHashParams(hash);
      if (region || step) setHeroGlobeP1StartContext(region, step);
      const stepIndex = step
        ? resolveTraveltrustStartStepIndex(step)
        : region
          ? resolveTraveltrustStartStepIndex(corridorBinding.defaultStepId)
          : null;
      if (stepIndex !== null) selectStep(stepIndex);
    },
    [corridorBinding.defaultStepId, selectStep],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncStartHash = () => applyStartHashToUi(window.location.hash);
    syncStartHash();
    window.addEventListener("hashchange", syncStartHash);
    return () => window.removeEventListener("hashchange", syncStartHash);
  }, [applyStartHashToUi]);

  useEffect(() => {
    if (!startPrefillRegionId || typeof window === "undefined") return;
    const { step } = parseStartHashParams(window.location.hash);
    if (!step) {
      writeTraveltrustStartHash({ region: startPrefillRegionId, step: corridorBinding.defaultStepId });
      selectStep(resolveTraveltrustStartStepIndex(corridorBinding.defaultStepId));
    }
  }, [startPrefillRegionId, corridorBinding.defaultStepId, selectStep]);

  const onSelectStartStep = useCallback(
    (index: number) => {
      const stepId = TRAVELTRUST_START_L5_STEPS[index];
      if (!stepId || typeof window === "undefined") return;
      const region = startPrefillRegionId ?? parseStartHashParams(window.location.hash).region;
      selectStep(index);
      setHeroGlobeP1StartContext(region, stepId);
      writeTraveltrustStartHash({ region, step: stepId });
    },
    [startPrefillRegionId, selectStep],
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE !== "1") return;
    window.__ttStartP2Probe = { selectStartStepByIndex: onSelectStartStep };
    return () => {
      delete window.__ttStartP2Probe;
    };
  }, [onSelectStartStep]);

  useEffect(() => {
    const syncHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash.replace(/^#/, "").split("?")[0] !== "fee-router") return;
      setFeeOpen(true);
      scrollTraveltrustHashIntoView("fee-router", { behavior: "smooth" });
      requestAnimationFrame(() => {
        feePanelRef.current?.querySelector("button")?.focus();
      });
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <section
      id="start"
      className={TT_START_SECTION_L5.sectionClass}
      aria-labelledby={titleId}
      {...traveltrustSectionL5DataAttrs("start")}
      data-tt-traveltrust-start-prefill-region={startPrefillRegionId ?? ""}
      data-tt-traveltrust-start-corridor={corridorBinding.corridorId}
      data-tt-traveltrust-start-step-id={activeStepId}
      data-tt-traveltrust-start-active-step={String(activeStartStep)}
      data-tt-traveltrust-hero-globe-p1-link="1"
      data-tt-traveltrust-start-p2-corridor-binding="1"
    >
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-y-6 right-0 hidden w-[min(52vw,560px)] lg:block"
          aria-hidden
          data-tt-traveltrust-start-tail-atmosphere-l5="1"
          style={{ background: TT_START_SECTION_L5.tailAtmosphere }}
          animate={{ opacity: [...TT_START_SECTION_L5.tailAtmospherePulse.opacity] }}
          transition={{
            duration: TT_START_SECTION_L5.tailAtmospherePulse.duration,
            repeat: TT_START_SECTION_L5.tailAtmospherePulse.repeat,
            ease: "easeInOut",
          }}
        />
      ) : null}
      <motion.div className={TT_START_SECTION_L5.bodyClass} data-tt-traveltrust-start-content-l5="1">
      <div
        className={TT_START_SECTION_L5.mainGridClass}
        data-tt-traveltrust-start-main-grid-l5="1"
        data-tt-traveltrust-start-interactive-l5="1"
        onMouseEnter={reduceMotion ? undefined : pauseCycle}
        onMouseLeave={reduceMotion ? undefined : resumeCycle}
        onFocusCapture={reduceMotion ? undefined : pauseCycle}
        onBlurCapture={reduceMotion ? undefined : resumeCycle}
      >
      <motion.p
        className={`${TT_SECTION_KICKER_L5} ${TT_START_SECTION_L5.kickerSpanClass}`}
        {...traveltrustL5SequentialChildProps(0, reduceMotion, {
          baseDelay: TT_START_STEP_L5.contentWaveBase,
          step: TT_START_STEP_L5.contentWaveStep,
        })}
        data-tt-traveltrust-start-content-wave-l5="0"
      >
        {t("traveltrust_start_eyebrow")}
      </motion.p>
      <div className={TT_START_SECTION_L5.mainColClass}>
      <motion.h2
        id={titleId}
        className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} max-w-xl text-h3 font-bold text-white sm:text-h2`}
        {...traveltrustL5SequentialChildProps(1, reduceMotion, {
          baseDelay: TT_START_STEP_L5.contentWaveBase,
          step: TT_START_STEP_L5.contentWaveStep,
        })}
        data-tt-traveltrust-start-content-wave-l5="1"
      >
        {t("traveltrust_start_title")}
      </motion.h2>
      <motion.p
        className={TT_SECTION_META_L5.bodyClass}
        {...traveltrustL5SequentialChildProps(2, reduceMotion, {
          baseDelay: TT_START_STEP_L5.contentWaveBase,
          step: TT_START_STEP_L5.contentWaveStep,
        })}
        data-tt-traveltrust-start-content-wave-l5="2"
      >
        {t("traveltrust_start_disclaimer")}
      </motion.p>
      <ol
        className={TT_START_STEP_L5.listClass}
        aria-label={t("traveltrust_start_steps_aria")}
        data-tt-traveltrust-start-steps-l5="1"
        data-tt-traveltrust-start-active-step={String(activeStartStep)}
        data-tt-traveltrust-start-step-id={activeStepId}
      >
        {TRAVELTRUST_START_L5_STEPS.map((step, i) => {
          const active = activeStartStep === i;
          const stepSurfaceClass = active
            ? TT_START_STEP_L5.activeClass
            : i < activeStartStep
              ? TT_START_STEP_L5.doneClass
              : i > activeStartStep
                ? TT_START_STEP_L5.upcomingClass
                : TT_START_STEP_L5.idleClass;
          return (
          <motion.li
            key={step}
            className={`${TT_START_STEP_L5.itemClass} ${stepSurfaceClass}`}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            animate={
              reduceMotion
                ? undefined
                : active
                  ? { boxShadow: [...TT_START_STEP_L5.activeGlow] }
                  : { boxShadow: "0 0 0 0 rgba(252,164,124,0)" }
            }
            transition={
              reduceMotion
                ? traveltrustSectionChildStagger(i, reduceMotion, TT_START_STEP_L5.contentWaveStep)
                : active
                  ? {
                      boxShadow: {
                        duration: TT_START_STEP_L5.activePulseDuration,
                        repeat: TT_START_STEP_L5.activePulseRepeat,
                        ease: "easeInOut",
                      },
                      default: TT_START_STEP_L5.surfaceSpring,
                    }
                  : {
                      ...traveltrustSectionChildStagger(
                        i,
                        reduceMotion,
                        TT_START_STEP_L5.contentWaveStep,
                      ),
                      default: TT_START_STEP_L5.surfaceSpring,
                    }
            }
            whileHover={reduceMotion || active ? undefined : { y: -1, transition: { duration: 0.2 } }}
            whileTap={reduceMotion ? undefined : TT_START_SECTION_L5.stepTap}
            data-tt-traveltrust-start-step={step}
            data-tt-traveltrust-start-step-index={String(i)}
          >
            <button
              type="button"
              className={TT_START_STEP_L5.stepButtonInnerClass}
              aria-current={active ? "step" : undefined}
              aria-describedby="tt-start-route-visible-step"
              onClick={() => onSelectStartStep(i)}
              data-tt-traveltrust-start-step-select-l5="1"
              data-tt-traveltrust-start-step-select={step}
            >
              <span
                className={`${TT_START_STEP_L5.stepBadgeClass} ${
                  active ? TT_START_STEP_L5.stepBadgeActiveClass : TT_START_STEP_L5.stepBadgeIdleClass
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className={TT_START_STEP_L5.textClass}>{t(`traveltrust_start_step_${step}`)}</span>
            </button>
          </motion.li>
          );
        })}
      </ol>
      <motion.div
        className={TT_START_SECTION_L5.ctaStackClass}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-6% 0px" }}
        transition={TT_START_SECTION_L5.ctaStackEntrance}
        data-tt-traveltrust-start-cta-stack-l5="1"
      >
        <motion.div
          className={TT_START_SECTION_L5.ctaPrimaryWrapClass}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : TT_START_SECTION_L5.ctaPrimaryTap}
          data-tt-traveltrust-start-cta-primary-pulse-l5="1"
        >
          {!reduceMotion ? (
            <motion.span
              className={TT_START_SECTION_L5.ctaPrimaryPulseClass}
              aria-hidden
              animate={{ opacity: [...TT_START_SECTION_L5.ctaPrimaryPulse.opacity] }}
              transition={{
                duration: TT_START_SECTION_L5.ctaPrimaryPulse.duration,
                repeat: TT_START_SECTION_L5.ctaPrimaryPulse.repeat,
                ease: "easeInOut",
              }}
            />
          ) : null}
          <Link
            href={planHref}
            data-tt-traveltrust-plan-href={planHref}
            onClick={() =>
              trackTravelTrustEvent("traveltrust_plan_trip_click", { source: "start", target: planHref })
            }
            className={`${TT_MARKETING_BTN_PRIMARY_WARM_HERO} ${TT_START_SECTION_L5.ctaPrimaryGlow} ${TT_START_SECTION_L5.ctaPrimaryClass} ${TT_START_SECTION_L5.ctaLinkMinWidthClass}`}
            data-tt-traveltrust-start-cta-plan-warm="1"
          >
            {t("traveltrust_start_cta")}
          </Link>
        </motion.div>
        <motion.div
          className={TT_START_SECTION_L5.ctaSecondaryWrapClass}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : TT_START_SECTION_L5.ghostCtaTap}
          data-tt-traveltrust-start-ghost-cta-tap-l5="1"
        >
          <Link
            href="#liquidity"
            title={t("traveltrust_hero_cta_ttg_aria")}
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "start",
                target: "#liquidity",
                role: "get_ttg",
              })
            }
            className={`${ghostCtaClass} ${TT_START_SECTION_L5.ctaLinkMinWidthClass}`}
            data-tt-traveltrust-start-cta-ttg="1"
          >
            {t("traveltrust_hero_cta_ttg")}
          </Link>
        </motion.div>
      </motion.div>
      <div
        ref={feePanelRef}
        id="fee-router"
        className={TT_START_SECTION_L5.feePanelWrapClass}
        data-tt-traveltrust-fee-router-panel="1"
        data-tt-traveltrust-fee-router-open={feeOpen ? "1" : "0"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {feeOpen ? (
            <motion.div
              key="fee-open"
              className={TT_MARKETING_TRAVELTRUST_FEE_ROUTER_PANEL}
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={TT_START_SECTION_L5.feePanelEnter}
            >
            <button
              type="button"
              onClick={() => setFeeOpen(false)}
              aria-expanded={true}
              data-tt-traveltrust-fee-router-trigger="1"
              className={TT_TRAVELTRUST_MARKETING_WARM_L5.feeRouterTriggerClass}
            >
              <span>{t("traveltrust_fee_router_summary")}</span>
              <span aria-hidden className="text-slate-500">
                −
              </span>
            </button>
            <motion.div
              className={TT_START_SECTION_L5.feePanelDividerClass}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, ...TT_START_SECTION_L5.feePanelEnter }}
            >
              <p className={`mb-3 text-meta leading-relaxed ${TT_SECTION_META_L5.bodyClass}`}>
                {t("traveltrust_fee_router_disclaimer")}
              </p>
              <FeeRouterWiringNotice variant="did" />
            </motion.div>
            </motion.div>
          ) : (
            <motion.button
              key="fee-closed"
            type="button"
            onClick={() => setFeeOpen(true)}
            aria-expanded={false}
            data-tt-traveltrust-fee-router-trigger="1"
            data-tt-traveltrust-fee-router-collapsed="1"
            className={TT_TRAVELTRUST_MARKETING_WARM_L5.feeRouterLinkClass}
            whileHover={reduceMotion ? undefined : { borderColor: "rgba(252,164,124,0.35)" }}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={TT_START_SECTION_L5.feePanelExit}
          >
            <span>{t("traveltrust_fee_router_summary")}</span>
            <span aria-hidden className="shrink-0 text-ref-sun/80">
              +
            </span>
          </motion.button>
          )}
        </AnimatePresence>
      </div>
      </div>
      <motion.div
        className={TT_START_SECTION_L5.previewColClass}
        data-tt-traveltrust-start-preview-col-l5="1"
        initial={reduceMotion ? false : { opacity: 0, x: 18 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ ...TT_START_SECTION_L5.previewColEntrance, ease: TT_L5_MOTION_EASE }}
        data-tt-traveltrust-start-preview-col-entrance-l5="1"
      >
        <motion.div className={TT_START_SECTION_L5.routePreviewWrapClass} data-tt-traveltrust-start-route-preview-wrap-l5="1">
          <TravelTrustStartRoutePreview activeStep={activeStartStep} prefillRegionId={startPrefillRegionId} />
        </motion.div>
      </motion.div>
      </div>
      </motion.div>
      <TravelTrustPageComplianceBlock />
    </section>
  );
}
