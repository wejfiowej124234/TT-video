"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_NETWORK_FOOTER_L5,
  TT_SECTION_META_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import { TravelTrustFooterCrossNav } from "./TravelTrustFooterCrossNav";
import { TravelTrustFooterSocial } from "./TravelTrustFooterSocial";

export function TravelTrustNetworkFooter() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <motion.footer
      className={TT_NETWORK_FOOTER_L5.shellClass}
      data-tt-traveltrust-network-footer="1"
      data-tt-traveltrust-network-footer-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-4% 0px" }}
      transition={TT_NETWORK_FOOTER_L5.entrance}
    >
      <motion.div
        className={TT_NETWORK_FOOTER_L5.topHandoffClass}
        aria-hidden
        data-tt-traveltrust-network-footer-top-handoff-l5="1"
      />
      <motion.div
        className={TT_NETWORK_FOOTER_L5.ambienceClass}
        aria-hidden
        data-tt-traveltrust-network-footer-ambience-l5="1"
        animate={reduceMotion ? undefined : { opacity: TT_NETWORK_FOOTER_L5.ambiencePulse.opacity }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: TT_NETWORK_FOOTER_L5.ambiencePulse.duration,
                repeat: TT_NETWORK_FOOTER_L5.ambiencePulse.repeat,
                ease: "easeInOut",
              }
        }
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ref-sun/50 to-transparent"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: TT_NETWORK_FOOTER_L5.topBorderPulse.opacity }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: TT_NETWORK_FOOTER_L5.topBorderPulse.duration,
                repeat: TT_NETWORK_FOOTER_L5.topBorderPulse.repeat,
                ease: "easeInOut",
              }
        }
      />
      <motion.div
        className={TT_NETWORK_FOOTER_L5.contentGridClass}
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={reduceMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.08, ...TT_NETWORK_FOOTER_L5.entrance }}
      >
        <TravelTrustFooterSocial />
        <TravelTrustFooterCrossNav />
        <p
          className={`col-span-full mt-6 border-t border-ref-sun/10 pt-5 sm:mt-7 sm:pt-5 ${TT_SECTION_META_L5.copyrightClass}`}
          data-tt-traveltrust-footer-copyright-full="1"
        >
          {t("traveltrust_footer_copyright", { year: String(year) })}
        </p>
      </motion.div>
    </motion.footer>
  );
}
