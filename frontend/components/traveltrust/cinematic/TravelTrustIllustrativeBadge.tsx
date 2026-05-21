"use client";



import { motion, useReducedMotion } from "framer-motion";

import { useTranslation } from "@/components/LocaleProvider";

import {

  TT_ILLUSTRATIVE_BADGE_L5,

  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,

} from "@/lib/traveltrustCinematicNonGlobeL5";

import {

  TT_MARKETING_ILLUSTRATIVE_BADGE,

  TT_MARKETING_ILLUSTRATIVE_BADGE_FOOTER,

  TT_MARKETING_ILLUSTRATIVE_BADGE_PREVIEW,

} from "@/lib/marketingUi";



type Variant = "illustrative" | "preview" | "footer";



type Props = {

  variant?: Variant;

  className?: string;

  /** 稳定币横幅：仅图标，避免与横幅文案重复「预览」 */
  iconOnly?: boolean;

};



const PULSE_BY_VARIANT = {

  preview: TT_ILLUSTRATIVE_BADGE_L5.previewPulse,

  illustrative: TT_ILLUSTRATIVE_BADGE_L5.illustrativePulse,

  footer: TT_ILLUSTRATIVE_BADGE_L5.footerPulse,

} as const;



/** 统一「示意 / 预览」视觉规范（TT-PH1-180 / TT-PH1-189 · ①） */

export function TravelTrustIllustrativeBadge({ variant = "illustrative", className = "", iconOnly = false }: Props) {

  const { t } = useTranslation();

  const reduceMotion = useReducedMotion();

  const label =

    variant === "preview"

      ? t("traveltrust_liquidity_preview_badge")

      : t("traveltrust_illustrative_badge");

  const tokenClass =

    variant === "preview"

      ? TT_MARKETING_ILLUSTRATIVE_BADGE_PREVIEW

      : variant === "footer"

        ? TT_MARKETING_ILLUSTRATIVE_BADGE_FOOTER

        : TT_MARKETING_ILLUSTRATIVE_BADGE;

  const pulse = PULSE_BY_VARIANT[variant];



  return (

    <motion.span

      className={`relative ${tokenClass} ${className}`}

      animate={reduceMotion ? undefined : { opacity: [...pulse.opacity] }}

      transition={

        reduceMotion

          ? undefined

          : {

              duration: pulse.duration,

              repeat:
                variant === "preview"
                  ? TT_ILLUSTRATIVE_BADGE_L5.previewPulseRepeat
                  : variant === "footer"
                    ? TT_ILLUSTRATIVE_BADGE_L5.footerPulse.repeat
                    : TT_ILLUSTRATIVE_BADGE_L5.illustrativePulseRepeat,

              ease: "easeInOut",

            }

      }

      data-tt-traveltrust-illustrative-badge={variant}

      data-tt-traveltrust-illustrative-badge-l5="1"

      data-tt-traveltrust-illustrative-badge-all-variants-l5="1"

      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      data-tt-traveltrust-illustrative-badge-ring-pulse-l5="1"

    >
      {!reduceMotion ? (
        <motion.span
          className={TT_ILLUSTRATIVE_BADGE_L5.ringClass}
          aria-hidden
          animate={{ opacity: TT_ILLUSTRATIVE_BADGE_L5.ringPulse.opacity }}
          transition={{
            duration: TT_ILLUSTRATIVE_BADGE_L5.ringPulse.duration,
            repeat: TT_ILLUSTRATIVE_BADGE_L5.ringPulse.repeat,
            ease: "easeInOut",
          }}
        />
      ) : null}
      <span className="relative">
        {iconOnly && variant === "preview" ? (
          <>
            <span aria-hidden>i</span>
            <span className="sr-only">{label}</span>
          </>
        ) : (
          label
        )}
      </span>

    </motion.span>

  );

}

