"use client";



import Link from "next/link";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";

import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";

import { resolveTraveltrustStartCorridorBinding } from "@/lib/traveltrustStartCorridorBinding";

import {

  TT_L5_MOTION_EASE,

  TT_START_ROUTE_HUBS_L5,

  TT_START_ROUTE_PREVIEW_L5,

  TT_START_STEP_CYCLE_MS,

  TT_WARM_ROUTE_ARC_SVG,

  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,

} from "@/lib/traveltrust/l5";

import { TRAVELTRUST_START_L5_STEPS } from "./traveltrustStartStepL5";



type Props = {

  activeStep: number;

  /** P1 · Hero CTA / 针脚预填枢纽（① 示意） */

  prefillRegionId?: string | null;

};



/** #start 示意行程走廊（L5 · 三步标签 + 沿路径流动 · 非实时地图） */

export function TravelTrustStartRoutePreview({ activeStep, prefillRegionId = null }: Props) {

  const { t } = useTranslation();

  const { routeBias } = useTraveltrustGlobeHeroHud();

  const reduceMotion = useReducedMotion();

  const binding = useMemo(

    () => resolveTraveltrustStartCorridorBinding(prefillRegionId, routeBias),

    [prefillRegionId, routeBias],

  );

  const stepIndex = Math.min(Math.max(activeStep, 0), TRAVELTRUST_START_L5_STEPS.length - 1);

  const stepId = TRAVELTRUST_START_L5_STEPS[stepIndex];

  const pathD = binding.stepPaths[stepIndex] ?? binding.stepPaths[2];

  const pathId = `tt-start-route-active-${binding.corridorId}-${stepIndex}`;

  const stepLabel = t(`traveltrust_start_step_${stepId}`);

  const corridorSubtitle = t(binding.stepSubtitleKeys[stepIndex] as "traveltrust_start_corridor_any_step_plan");

  return (

    <motion.div

      className={TT_START_ROUTE_PREVIEW_L5.cardClass}

      aria-label={t("traveltrust_start_route_preview_aria")}

      data-tt-traveltrust-start-route-preview-l5="1"

      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}

      data-tt-traveltrust-start-corridor={binding.corridorId}

      data-tt-traveltrust-start-step-id={stepId}

      data-tt-traveltrust-start-active-step={String(stepIndex)}

      data-tt-traveltrust-start-cycle-ms={String(TT_START_STEP_CYCLE_MS)}

      data-tt-traveltrust-start-route-reduced-motion={reduceMotion ? "1" : "0"}

      data-tt-traveltrust-start-prefill-region={prefillRegionId ?? ""}

      initial={reduceMotion ? false : { opacity: 0, y: 14, scale: TT_START_ROUTE_PREVIEW_L5.entranceScale[0] }}

      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: TT_START_ROUTE_PREVIEW_L5.entranceScale[1] }}

      viewport={{ once: true, margin: "-8% 0px" }}

      transition={{ duration: TT_START_ROUTE_PREVIEW_L5.entranceDuration, ease: TT_L5_MOTION_EASE }}

      data-tt-traveltrust-start-route-card-entrance-l5="1"

    >

      {!reduceMotion ? (

        <>

          <div className={TT_START_ROUTE_PREVIEW_L5.cardShimmerClipClass} aria-hidden>

            <motion.div

              className="absolute inset-0 bg-[linear-gradient(105deg,transparent_42%,rgba(255,248,240,0.04)_50%,transparent_58%)]"

              initial={{ x: "-120%" }}

              animate={{ x: "120%" }}

              transition={{

                duration: TT_START_ROUTE_PREVIEW_L5.cardShimmerDuration,

                repeat: TT_START_ROUTE_PREVIEW_L5.cardShimmerRepeat,

                repeatDelay: 2.5,

                ease: "easeInOut",

              }}

            />

          </div>

          <motion.div

            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ref-sun/22"

            aria-hidden

            animate={{ opacity: [...TT_START_ROUTE_PREVIEW_L5.cardBorderPulse.opacity] }}

            transition={{

              duration: TT_START_ROUTE_PREVIEW_L5.cardBorderPulse.duration,

              repeat: TT_START_ROUTE_PREVIEW_L5.cardBorderPulseRepeat,

              ease: "easeInOut",

            }}

          />

        </>

      ) : null}

      <p className={TT_START_ROUTE_PREVIEW_L5.kickerClass}>

        {t("traveltrust_start_route_preview_kicker")}

      </p>

      <div
        className={TT_START_ROUTE_PREVIEW_L5.copyShellMinHeightClass}
        data-tt-traveltrust-start-route-copy-shell-l5="1"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${binding.corridorId}-${stepId}-${stepIndex}`}
            id="tt-start-route-visible-step"
            aria-live="polite"
            className="absolute inset-x-0 top-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: TT_START_ROUTE_PREVIEW_L5.stepCopyFadeDuration, ease: TT_L5_MOTION_EASE }}
            data-tt-traveltrust-start-route-copy-crossfade-l5="1"
          >
            <p
              className={TT_START_ROUTE_PREVIEW_L5.stepTitleClass}
              data-tt-traveltrust-start-route-step-title-l5="1"
            >
              <span className={TT_START_ROUTE_PREVIEW_L5.stepTitleIndexClass}>
                {t("traveltrust_start_route_preview_step_index", { step: String(stepIndex + 1) })}
              </span>
              <span className={TT_START_ROUTE_PREVIEW_L5.stepTitleSepClass} aria-hidden>
                ·
              </span>
              <span className={TT_START_ROUTE_PREVIEW_L5.stepTitleLabelClass}>{stepLabel}</span>
            </p>
            <p className={TT_START_ROUTE_PREVIEW_L5.corridorCopyClass} data-tt-traveltrust-start-corridor-copy-l5="1">
              {corridorSubtitle}
            </p>
            <div className={TT_START_ROUTE_PREVIEW_L5.rolesSlotClass} data-tt-traveltrust-start-route-roles-slot-l5="1">
              <Link
                href="#roles"
                className={`${TT_START_ROUTE_PREVIEW_L5.rolesLinkClass} ${
                  stepIndex === 1 ? "" : TT_START_ROUTE_PREVIEW_L5.rolesLinkHiddenClass
                }`}
                tabIndex={stepIndex === 1 ? 0 : -1}
                aria-hidden={stepIndex !== 1}
                data-tt-traveltrust-start-route-roles-link-l5="1"
              >
                {t("traveltrust_start_route_preview_roles_link")}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>



      <svg

        className={TT_START_ROUTE_PREVIEW_L5.svgClass}

        viewBox="0 0 100 64"

        preserveAspectRatio="xMidYMid meet"

        aria-hidden

        overflow="visible"

      >

        <defs>

          <linearGradient id="tt-start-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">

            <stop offset="0%" stopColor={TT_WARM_ROUTE_ARC_SVG.stop0} />

            <stop offset="50%" stopColor={TT_WARM_ROUTE_ARC_SVG.stop35} />

            <stop offset="100%" stopColor={TT_WARM_ROUTE_ARC_SVG.stop100} />

          </linearGradient>

        </defs>



        <path

          d={binding.corridorGhostPath}

          fill="none"

          stroke="rgba(255,255,255,0.07)"

          strokeWidth={0.75}

          strokeLinecap="round"

          strokeDasharray="3 7"

          data-tt-traveltrust-start-route-corridor-ghost-l5="1"

        />



        {reduceMotion

          ? binding.stepPaths.map((d, i) => (

              <path

                key={`${binding.corridorId}-${d}`}

                d={d}

                fill="none"

                stroke="url(#tt-start-route-grad)"

                strokeWidth={i === stepIndex ? 1.55 : 1}

                strokeLinecap="round"

                opacity={

                  i === stepIndex

                    ? TT_START_ROUTE_PREVIEW_L5.reducedMotionActivePathOpacity

                    : TT_START_ROUTE_PREVIEW_L5.reducedMotionInactivePathOpacity

                }

                data-tt-traveltrust-start-route-static-path-l5={String(i)}

              />

            ))

          : null}



        {!reduceMotion ? (

          <motion.path

            key={`${pathId}-glow`}

            d={pathD}

            fill="none"

            stroke="url(#tt-start-route-grad)"

            strokeWidth={TT_START_ROUTE_PREVIEW_L5.pathGlowStrokeWidth}

            strokeLinecap="round"

            data-tt-traveltrust-start-route-glow-l5="1"

            initial={{ pathLength: 0, opacity: 0.2 }}

            animate={{

              pathLength: 1,

              opacity: TT_START_ROUTE_PREVIEW_L5.pathGlowOpacity,

            }}

            transition={{

              pathLength: { duration: TT_START_ROUTE_PREVIEW_L5.pathMorphDuration, ease: TT_L5_MOTION_EASE },

              opacity: { duration: TT_START_ROUTE_PREVIEW_L5.pathGlowOpacityFadeDuration },

            }}

            style={{ filter: "blur(2px)" }}

          />

        ) : null}



        {!reduceMotion ? (

          <motion.path

            key={pathId}

            id={pathId}

            d={pathD}

            fill="none"

            stroke="url(#tt-start-route-grad)"

            strokeWidth={1.45}

            strokeLinecap="round"

            initial={{ pathLength: 0, opacity: 0.35 }}

            animate={{

              pathLength: 1,

              opacity: stepIndex === 2 ? [0.82, 1, 0.82] : [0.72, 0.95, 0.72],

            }}

            transition={{

              pathLength: { duration: TT_START_ROUTE_PREVIEW_L5.pathMorphDuration, ease: TT_L5_MOTION_EASE },

              opacity: {

                duration: TT_START_STEP_CYCLE_MS / 1000,

                repeat: TT_START_ROUTE_PREVIEW_L5.pathOpacityPulseRepeat,

                ease: "easeInOut",

              },

            }}

          />

        ) : (

          <path

            id={pathId}

            d={pathD}

            fill="none"

            stroke="url(#tt-start-route-grad)"

            strokeWidth={1.2}

            strokeLinecap="round"

            opacity={TT_START_ROUTE_PREVIEW_L5.reducedMotionActivePathOpacity}

          />

        )}



        {TT_START_ROUTE_HUBS_L5.map((hub, i) => {

          const selected = stepIndex === i;

          const cycleS = TT_START_STEP_CYCLE_MS / 1000;

          const labelKey = TT_START_ROUTE_PREVIEW_L5.hubLabelKeys[i];

          const dotR = selected

            ? TT_START_ROUTE_PREVIEW_L5.hubDotRadiusActive

            : TT_START_ROUTE_PREVIEW_L5.hubDotRadiusInactive;

          return (

            <g
              key={hub.stepKey}
              data-tt-traveltrust-start-route-hub-l5={hub.stepKey}
              data-tt-traveltrust-start-route-hub-state={selected ? "active" : "inactive"}
              data-tt-traveltrust-start-route-hub-index={String(i)}
            >
              {!reduceMotion ? (
                <animate
                  attributeName="opacity"
                  from="0"
                  to="1"
                  dur={`${TT_START_ROUTE_PREVIEW_L5.hubPopDuration}s`}
                  begin={`${TT_START_ROUTE_PREVIEW_L5.hubEntranceDelayAfterPath + i * TT_START_ROUTE_PREVIEW_L5.hubEntranceStagger}s`}
                  fill="freeze"
                />
              ) : null}
              {selected ? (

                <>

                  <circle

                    cx={hub.cx}

                    cy={hub.cy}

                    r={TT_START_ROUTE_PREVIEW_L5.hubRingRadiusActive}

                    fill="none"

                    stroke={TT_START_ROUTE_PREVIEW_L5.hubRingStroke}

                    strokeWidth={0.75}

                    opacity={0.55}

                  >

                    {!reduceMotion ? (

                      <animate

                        attributeName="opacity"

                        values="0.35;0.7;0.35"

                        dur={`${cycleS}s`}

                        repeatCount="indefinite"

                      />

                    ) : null}

                  </circle>

                  <circle

                    cx={hub.cx}

                    cy={hub.cy}

                    r={dotR}

                    fill={TT_START_ROUTE_PREVIEW_L5.hubActiveFill}

                  >

                    {!reduceMotion ? (

                      <animate

                        attributeName="r"

                        values={`${dotR};${(dotR * 1.12).toFixed(2)};${dotR}`}

                        dur={`${cycleS}s`}

                        repeatCount="indefinite"

                      />

                    ) : null}

                  </circle>

                  <text
                    x={hub.cx}
                    y={hub.labelYActive}
                    textAnchor="middle"

                    fontSize={TT_START_ROUTE_PREVIEW_L5.hubLabelActiveFontSize}

                    fill={TT_START_ROUTE_PREVIEW_L5.hubLabelActiveFill}

                    fontWeight={600}

                    data-tt-traveltrust-start-route-hub-label-l5={hub.stepKey}

                    aria-hidden

                  >

                    {t(labelKey)}

                  </text>

                </>

              ) : (

                <circle

                  cx={hub.cx}

                  cy={hub.cy}

                  r={dotR}

                  fill={TT_START_ROUTE_PREVIEW_L5.hubFill}

                  opacity={TT_START_ROUTE_PREVIEW_L5.hubInactiveDotOpacity}

                  data-tt-traveltrust-start-route-hub-dot-inactive-l5="1"

                />

              )}

            </g>

          );

        })}



        {!reduceMotion ? (

          <circle

            r={TT_START_ROUTE_PREVIEW_L5.flowDotRadius}

            fill="#fff8f0"

            data-tt-traveltrust-start-route-flow-l5="1"

          >

            <animateMotion

              dur={`${TT_START_ROUTE_PREVIEW_L5.flowDotDuration}s`}

              repeatCount="indefinite"

              rotate="auto"

            >

              <mpath href={`#${pathId}`} />

            </animateMotion>

            <animate

              attributeName="opacity"

              values="0.45;1;0.45"

              dur={`${TT_START_ROUTE_PREVIEW_L5.flowDotDuration}s`}

              repeatCount="indefinite"

            />

          </circle>

        ) : (

          <circle

            cx={TT_START_ROUTE_HUBS_L5[stepIndex]?.cx ?? 48}

            cy={TT_START_ROUTE_HUBS_L5[stepIndex]?.cy ?? 38}

            r={TT_START_ROUTE_PREVIEW_L5.flowDotRadius}

            fill="#fff8f0"

            opacity={0.9}

          />

        )}

      </svg>



      <p className={TT_START_ROUTE_PREVIEW_L5.captionClass}>{t("traveltrust_start_route_preview_caption")}</p>

    </motion.div>

  );

}


