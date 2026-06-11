"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_SECTION_META_L5,
  TT_SECTION_SURFACE_L5,
  TT_SETTLEMENT_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrust/l5";
/** 轻量 Settlement 叙事（非 17 段恢复；链到 help / pay） */
export function TravelTrustSettlementStrip() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.settlement.title;
  const [protocolOpen, setProtocolOpen] = useState(false);

  return (
    <section
      id="settlement"
      className={TT_SECTION_SURFACE_L5.settlement}
      aria-labelledby={titleId}
      data-tt-traveltrust-settlement-strip="1"
      data-tt-traveltrust-settlement-l5="1"
      {...traveltrustSectionL5DataAttrs("settlement")}
    >
      <div
        className={TT_SECTION_CONTENT_L5.bodyClass}
        data-tt-traveltrust-trust-faq-liquidity-surface-l5="1"
      >
      <p className={TT_SECTION_KICKER_L5}>{t("traveltrust_settlement_eyebrow")}</p>
      <h2 id={titleId} className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingCompactClass}`}>
        {t("traveltrust_settlement_title")}
      </h2>
      <p className={TT_SECTION_META_L5.bodyClass}>
        {t("traveltrust_settlement_body")}
      </p>
      <motion.div
        className={`${TT_SECTION_CONTENT_L5.stackAfterHeadingClass} ${TT_SETTLEMENT_L5.protocolShellClass} ${
          protocolOpen ? TT_SETTLEMENT_L5.protocolShellOpenClass : ""
        }`}
        data-tt-traveltrust-settlement-protocol="1"
        data-tt-traveltrust-settlement-protocol-open-glow-l5={protocolOpen ? "1" : "0"}
      >
        <motion.button
          type="button"
          className={`${TT_SETTLEMENT_L5.protocolToggleButtonClass} ${
            protocolOpen ? TT_SETTLEMENT_L5.protocolToggleOpenClass : TT_SETTLEMENT_L5.protocolToggleIdleClass
          }`}
          whileHover={reduceMotion ? undefined : { x: 2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          data-tt-traveltrust-settlement-protocol-tap-l5="1"
          aria-expanded={protocolOpen}
          aria-controls="traveltrust-settlement-protocol-panel"
          data-tt-traveltrust-settlement-protocol-toggle="1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setProtocolOpen((open) => !open);
          }}
          data-tt-traveltrust-settlement-protocol-open={protocolOpen ? "1" : "0"}
        >
          <span className="min-w-0 text-pretty leading-snug">
            {protocolOpen
              ? t("traveltrust_settlement_protocol_toggle_collapse")
              : t("traveltrust_settlement_protocol_toggle_expand")}
          </span>
          <span className={TT_SETTLEMENT_L5.protocolIconSlotClass} aria-hidden>
            {protocolOpen ? "−" : "+"}
          </span>
        </motion.button>
        <AnimatePresence initial={false}>
          {protocolOpen ? (
            <motion.p
              id="traveltrust-settlement-protocol-panel"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{
                duration: reduceMotion ? 0 : TT_SETTLEMENT_L5.protocolPanelMotion.duration,
                ease: [...TT_SETTLEMENT_L5.protocolPanelMotion.ease],
              }}
              className={TT_SETTLEMENT_L5.protocolPanelClass}
              data-tt-traveltrust-settlement-disclaimer="1"
            >
              {t("traveltrust_settlement_disclaimer")}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className={`${TT_SECTION_CONTENT_L5.stackAfterHeadingClass} ${TT_SETTLEMENT_L5.ctaRowClass}`}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={TT_SETTLEMENT_L5.ctaStackEntrance}
      >
        <motion.div
          whileHover={reduceMotion ? undefined : TT_SETTLEMENT_L5.linkHover}
          whileTap={reduceMotion ? undefined : TT_SETTLEMENT_L5.linkTap}
          data-tt-traveltrust-settlement-cta-tap-l5="1"
        >
          <Link
            href="/help"
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "settlement",
                target: "/help",
              })
            }
            className={TT_SETTLEMENT_L5.linkClass}
          >
            {t("traveltrust_nav_help")} →
          </Link>
        </motion.div>
        <motion.div
          whileHover={reduceMotion ? undefined : TT_SETTLEMENT_L5.linkHover}
          whileTap={reduceMotion ? undefined : TT_SETTLEMENT_L5.linkTap}
          data-tt-traveltrust-settlement-cta-tap-l5="1"
        >
          <Link
            href="/pay"
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "settlement",
                target: "/pay",
              })
            }
            className={TT_SETTLEMENT_L5.linkClass}
          >
            {t("traveltrust_liquidity_escrow_link")} →
          </Link>
        </motion.div>
      </motion.div>
      </div>
    </section>
  );
}
