"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_FOOTER_L5_SEQUENTIAL,
  TT_FOOTER_SOCIAL_L5,
  TT_L5_MOTION_EASE,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TravelTrustFooterSocialGlyph } from "@/components/traveltrust/cinematic/TravelTrustFooterSocialGlyph";
import { listTraveltrustOfficialSocialSlots } from "@/lib/traveltrustOfficialSocialLinks";
import {
  TT_MARKETING_TRAVELTRUST_FOOTER_NAV_GROUP_TITLE,
  TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_DISCLAIMER,
  TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ICON_LINK,
  TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ICON_LINK_PENDING,
  TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_PENDING_NOTE,
  TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ROW,
  TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ROW_CENTER,
} from "@/lib/marketingUi";

type Props = {
  /** 首页底栏居中；/traveltrust 左对齐 */
  centered?: boolean;
  surface?: "marketing" | "traveltrust";
  className?: string;
};

/** 官方社媒槽位（常驻）+ 站内 TT 社区；外链待 env 填充 */
const footerSocialSlotVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: TT_FOOTER_L5_SEQUENTIAL.slotStagger,
      delayChildren: TT_FOOTER_L5_SEQUENTIAL.slotDelayChildren,
    },
  },
};

const footerSocialSlotItemVariants = {
  hidden: { opacity: 0, y: TT_FOOTER_L5_SEQUENTIAL.childEntranceY, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: TT_FOOTER_L5_SEQUENTIAL.childEntranceDuration, ease: TT_L5_MOTION_EASE },
  },
};

export function MarketingFooterSocial({ centered = false, surface = "marketing", className = "" }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const slots = listTraveltrustOfficialSocialSlots();
  const hasPendingSlots = slots.some((slot) => !slot.href);
  const pendingHint = t("traveltrust_social_pending_title");
  const isTraveltrust = surface === "traveltrust";
  const rowClass = centered
    ? TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ROW_CENTER
    : isTraveltrust
      ? TT_FOOTER_SOCIAL_L5.rowClass
      : TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ROW;
  const headingId = isTraveltrust ? "traveltrust-footer-social-heading" : "marketing-footer-social-heading";

  const Shell = isTraveltrust ? motion.section : "section";

  return (
    <Shell
      className={`${isTraveltrust ? TT_FOOTER_SOCIAL_L5.shellClass : "mb-6"} ${className}`.trim()}
      aria-labelledby={headingId}
      {...(isTraveltrust
        ? {
            "data-tt-traveltrust-footer-social": "1",
            "data-tt-traveltrust-footer-social-l5": "1",
            "data-tt-traveltrust-cinematic-non-globe-l5": TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
            initial: { opacity: 0, y: 8 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-8% 0px" },
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          }
        : { "data-tt-marketing-footer-social": "1" })}
    >
      {isTraveltrust ? (
        <motion.p
          className={`${TT_FOOTER_SOCIAL_L5.disclaimerClass} mb-3`}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.34, ease: TT_L5_MOTION_EASE }}
          data-tt-traveltrust-footer-brand-tagline-l5="1"
        >
          {t("traveltrust_footer_brand_tagline")}
        </motion.p>
      ) : null}
      {isTraveltrust ? (
        <motion.h3
          id={headingId}
          className={TT_FOOTER_SOCIAL_L5.headingClass}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.32, ease: TT_L5_MOTION_EASE }}
          data-tt-traveltrust-footer-social-heading-l5="1"
        >
          {t("traveltrust_footer_follow_us")}
        </motion.h3>
      ) : (
        <h3 id={headingId} className={TT_MARKETING_TRAVELTRUST_FOOTER_NAV_GROUP_TITLE}>
          {t("traveltrust_footer_follow_us")}
        </h3>
      )}
      <motion.ul
        className={rowClass}
        variants={isTraveltrust && !reduceMotion ? footerSocialSlotVariants : undefined}
        initial={isTraveltrust && !reduceMotion ? "hidden" : false}
        whileInView={isTraveltrust && !reduceMotion ? "show" : undefined}
        viewport={isTraveltrust ? { once: true, margin: "-8% 0px" } : undefined}
        {...(isTraveltrust
          ? {
              "data-tt-traveltrust-footer-social-slots": "1",
              "data-tt-traveltrust-footer-social-stagger-l5": "1",
            }
          : { "data-tt-marketing-footer-social-slots": "1" })}
      >
        {slots.map(({ platform, href, labelKey, envKey }) => (
          <motion.li
            key={platform}
            variants={isTraveltrust && !reduceMotion ? footerSocialSlotItemVariants : undefined}
            className="list-none"
          >
            {href ? (
              isTraveltrust ? (
                <motion.a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={TT_FOOTER_SOCIAL_L5.iconLinkClass}
                  whileHover={reduceMotion ? undefined : TT_FOOTER_SOCIAL_L5.iconHover}
                  whileTap={TT_FOOTER_SOCIAL_L5.iconTap}
                  transition={TT_FOOTER_SOCIAL_L5.iconTransition}
                  aria-label={t(labelKey)}
                  data-tt-traveltrust-footer-social-platform={platform}
                  data-tt-traveltrust-footer-social-active="1"
                  data-tt-traveltrust-footer-social-env={envKey}
                  onClick={() =>
                    trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                      source: "footer_social",
                      target: href,
                      platform,
                    })
                  }
                >
                  <TravelTrustFooterSocialGlyph platform={platform} className={TT_FOOTER_SOCIAL_L5.glyphClass} />
                </motion.a>
              ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ICON_LINK}
                aria-label={t(labelKey)}
                {...(isTraveltrust
                  ? {
                      "data-tt-traveltrust-footer-social-platform": platform,
                      "data-tt-traveltrust-footer-social-active": "1",
                      "data-tt-traveltrust-footer-social-env": envKey,
                    }
                  : {
                      "data-tt-marketing-footer-social-platform": platform,
                      "data-tt-marketing-footer-social-active": "1",
                    })}
                onClick={() =>
                  trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                    source: isTraveltrust ? "footer_social" : "home_footer_social",
                    target: href,
                    platform,
                  })
                }
              >
                <TravelTrustFooterSocialGlyph platform={platform} className={TT_FOOTER_SOCIAL_L5.glyphClass} />
              </a>
              )
            ) : (
              <span
                role="img"
                aria-label={`${t(labelKey)} — ${pendingHint}`}
                title={pendingHint}
                className={
                  isTraveltrust
                    ? TT_FOOTER_SOCIAL_L5.iconLinkPendingClass
                    : TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ICON_LINK_PENDING
                }
                {...(isTraveltrust
                  ? {
                      "data-tt-traveltrust-footer-social-platform": platform,
                      "data-tt-traveltrust-footer-social-pending": "1",
                      "data-tt-traveltrust-footer-social-env": envKey,
                    }
                  : {
                      "data-tt-marketing-footer-social-platform": platform,
                      "data-tt-marketing-footer-social-pending": "1",
                    })}
              >
                <TravelTrustFooterSocialGlyph platform={platform} className={TT_FOOTER_SOCIAL_L5.glyphClass} />
              </span>
            )}
          </motion.li>
        ))}
        <motion.li
          variants={isTraveltrust && !reduceMotion ? footerSocialSlotItemVariants : undefined}
          className="list-none"
        >
          {isTraveltrust ? (
            <motion.div
              whileHover={reduceMotion ? undefined : TT_FOOTER_SOCIAL_L5.iconHover}
              whileTap={TT_FOOTER_SOCIAL_L5.iconTap}
            >
              <Link
                href="/community"
                className={TT_FOOTER_SOCIAL_L5.iconLinkClass}
                aria-label={t("traveltrust_social_community")}
                data-tt-traveltrust-footer-social-platform="community"
                data-tt-traveltrust-footer-social-active="1"
                onClick={() =>
                  trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                    source: "footer_social",
                    target: "/community",
                    platform: "community",
                  })
                }
              >
                <TravelTrustFooterSocialGlyph platform="community" className={TT_FOOTER_SOCIAL_L5.glyphClass} />
              </Link>
            </motion.div>
          ) : (
            <Link
              href="/community"
              className={TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ICON_LINK}
              aria-label={t("traveltrust_social_community")}
              data-tt-marketing-footer-social-platform="community"
              data-tt-marketing-footer-social-active="1"
              onClick={() =>
                trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                  source: "home_footer_social",
                  target: "/community",
                  platform: "community",
                })
              }
            >
              <TravelTrustFooterSocialGlyph platform="community" className={TT_FOOTER_SOCIAL_L5.glyphClass} />
            </Link>
          )}
        </motion.li>
      </motion.ul>
      {isTraveltrust ? (
        <div
          className={TT_FOOTER_SOCIAL_L5.notesStackClass}
          data-tt-traveltrust-footer-social-notes-stack-l5="1"
        >
          {hasPendingSlots ? (
            <p className={TT_FOOTER_SOCIAL_L5.pendingNoteClass}>{t("traveltrust_footer_social_pending_line")}</p>
          ) : null}
          <motion.p
            className={TT_FOOTER_SOCIAL_L5.disclaimerClass}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.34, ease: TT_L5_MOTION_EASE }}
            data-tt-traveltrust-footer-social-disclaimer-l5="1"
          >
            {t("traveltrust_footer_social_disclaimer")}
            {hasPendingSlots ? ` ${t("traveltrust_footer_social_pending_line")}` : ""}
          </motion.p>
        </div>
      ) : (
        <>
          {hasPendingSlots ? (
            <p className={TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_PENDING_NOTE}>
              {t("traveltrust_footer_social_pending_line")}
            </p>
          ) : null}
          <p className={TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_DISCLAIMER}>{t("traveltrust_footer_social_disclaimer")}</p>
        </>
      )}
    </Shell>
  );
}
