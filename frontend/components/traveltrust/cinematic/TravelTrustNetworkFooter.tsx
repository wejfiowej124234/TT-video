"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_FOOTER_L5_SEQUENTIAL,
  TT_L5_MOTION_EASE,
  TT_NETWORK_FOOTER_L5,
  TT_SECTION_META_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { TravelTrustFooterCrossNav } from "./TravelTrustFooterCrossNav";
import { TravelTrustFooterSocial } from "./TravelTrustFooterSocial";

type Props = {
  /** 与启程同屏吸附章内：收紧顶留白、去掉重复顶边 */
  grouped?: boolean;
};

export function TravelTrustNetworkFooter({ grouped = false }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <motion.footer
      className={grouped ? TT_NETWORK_FOOTER_L5.shellGroupedClass : TT_NETWORK_FOOTER_L5.shellClass}
      data-tt-traveltrust-network-footer-grouped={grouped ? "1" : "0"}
      data-tt-traveltrust-network-footer="1"
      data-tt-traveltrust-network-footer-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-4% 0px" }}
      transition={TT_NETWORK_FOOTER_L5.entrance}
    >
      <motion.div
        className={grouped ? "hidden" : TT_NETWORK_FOOTER_L5.topHandoffClass}
        aria-hidden
        data-tt-traveltrust-network-footer-top-handoff-l5="1"
      />
      {!grouped ? (
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
      ) : null}
      {!grouped ? (
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
      ) : null}
      <motion.div
        className={TT_NETWORK_FOOTER_L5.contentGridClass}
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, margin: "-6% 0px" }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: TT_FOOTER_L5_SEQUENTIAL.groupStagger,
              delayChildren: 0.06,
            },
          },
        }}
        data-tt-traveltrust-network-footer-grid-stagger-l5="1"
      >
        <motion.div
          className={TT_NETWORK_FOOTER_L5.socialWrapClass}
          variants={
            reduceMotion
              ? undefined
              : {
                  hidden: { opacity: 0, y: TT_FOOTER_L5_SEQUENTIAL.childEntranceY },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: TT_FOOTER_L5_SEQUENTIAL.childEntranceDuration, ease: TT_L5_MOTION_EASE },
                  },
                }
          }
          data-tt-traveltrust-network-footer-wave-l5="social"
        >
          <TravelTrustFooterSocial />
        </motion.div>
        <motion.div
          className={TT_NETWORK_FOOTER_L5.crossNavWrapClass}
          variants={
            reduceMotion
              ? undefined
              : {
                  hidden: { opacity: 0, y: TT_FOOTER_L5_SEQUENTIAL.childEntranceY },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: TT_FOOTER_L5_SEQUENTIAL.childEntranceDuration, ease: TT_L5_MOTION_EASE },
                  },
                }
          }
          data-tt-traveltrust-network-footer-wave-l5="cross-nav"
        >
          <TravelTrustFooterCrossNav />
        </motion.div>
        <motion.p
          className={`col-span-full mt-8 border-t border-ref-sun/12 pt-6 sm:mt-9 sm:pt-6 ${TT_SECTION_META_L5.copyrightClass}`}
          data-tt-traveltrust-footer-copyright-full="1"
          variants={
            reduceMotion
              ? undefined
              : {
                  hidden: { opacity: 0, y: 8 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.34, ease: TT_L5_MOTION_EASE },
                  },
                }
          }
          data-tt-traveltrust-network-footer-wave-l5="copyright"
        >
          {t("traveltrust_footer_copyright", { year: String(year) })}
        </motion.p>
      </motion.div>
    </motion.footer>
  );
}
