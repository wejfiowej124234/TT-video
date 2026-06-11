"use client";



import { motion, useReducedMotion } from "framer-motion";

import { useTranslation } from "@/components/LocaleProvider";

import { setTraveltrustCinematicQualityPref } from "@/lib/traveltrustCinematicPerf";

import {

  TT_WEBGL_FALLBACK_L5,

  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,

} from "@/lib/traveltrust/l5";



type Reason = "lost" | "unsupported" | "loading";



type Props = {

  reason: Reason;

};



/** WebGL 不可用时的可见提示（TT-PH1-175 / 161 · ①） */

export function TravelTrustCinematicFallbackNotice({ reason }: Props) {

  const { t } = useTranslation();

  const reduceMotion = useReducedMotion();

  const key =

    reason === "lost"

      ? "traveltrust_webgl_fallback_lost"

      : reason === "unsupported"

        ? "traveltrust_webgl_fallback_unsupported"

        : "traveltrust_webgl_fallback_loading";



  const showRecovery = reason === "lost";



  return (

    <motion.div

      role="status"

      className={TT_WEBGL_FALLBACK_L5.panelClass}

      data-tt-traveltrust-webgl-fallback-banner="1"

      data-tt-traveltrust-webgl-fallback-reason={reason}

      data-tt-traveltrust-webgl-fallback-l5="1"

      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}

      initial={reduceMotion ? false : { opacity: 0, y: 10 }}

      animate={{ opacity: 1, y: 0 }}

      transition={reduceMotion ? undefined : TT_WEBGL_FALLBACK_L5.entrance}

    >

      <motion.div

        className={TT_WEBGL_FALLBACK_L5.cardClass}

        data-tt-traveltrust-webgl-fallback-card-l5="1"

        animate={reduceMotion ? undefined : { opacity: [0.92, 1, 0.92] }}

        transition={{
          duration: TT_WEBGL_FALLBACK_L5.cardBreathDuration,
          repeat: TT_WEBGL_FALLBACK_L5.cardBreathRepeat,
          ease: "easeInOut",
        }}

      >
        {!reduceMotion ? (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ref-sun/22"
            aria-hidden
            data-tt-traveltrust-webgl-fallback-border-pulse-l5="1"
            animate={{ opacity: [...TT_WEBGL_FALLBACK_L5.cardBorderPulse.opacity] }}
            transition={{
              duration: TT_WEBGL_FALLBACK_L5.cardBorderPulse.duration,
              repeat: TT_WEBGL_FALLBACK_L5.cardBorderPulseRepeat,
              ease: "easeInOut",
            }}
          />
        ) : null}

        <p className={TT_WEBGL_FALLBACK_L5.bodyClass}>{t(key)}</p>

        {showRecovery ? (

          <motion.div

            className="pointer-events-auto mt-3 flex flex-wrap items-center justify-center gap-2"

            initial={reduceMotion ? false : { opacity: 0 }}

            animate={{ opacity: 1 }}

            transition={TT_WEBGL_FALLBACK_L5.recoveryMotion}
            data-tt-traveltrust-webgl-fallback-recovery-l5="1"

          >

            <motion.button

              type="button"

              whileHover={{ y: -1 }}

              whileTap={{ scale: 0.98 }}

              className={TT_WEBGL_FALLBACK_L5.primaryButtonClass}

              data-tt-traveltrust-webgl-fallback-refresh="1"

              onClick={() => window.location.reload()}

            >

              {t("traveltrust_webgl_fallback_refresh")}

            </motion.button>

            <motion.button

              type="button"

              whileHover={reduceMotion ? undefined : TT_WEBGL_FALLBACK_L5.buttonHover}

              whileTap={reduceMotion ? undefined : TT_WEBGL_FALLBACK_L5.buttonTap}

              className={TT_WEBGL_FALLBACK_L5.retryButtonClass}

              data-tt-traveltrust-webgl-fallback-retry-low="1"

              onClick={() => {

                setTraveltrustCinematicQualityPref("on");

                window.location.reload();

              }}

            >

              {t("traveltrust_webgl_fallback_retry_low")}

            </motion.button>

          </motion.div>

        ) : null}

      </motion.div>

    </motion.div>

  );

}


