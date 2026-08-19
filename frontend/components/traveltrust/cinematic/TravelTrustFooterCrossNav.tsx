"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  TRAVELTRUST_PROTOCOL_PAPER_HREF,
  TT_FOOTER_SUPERVISION_L5,
  TT_L5_MOTION_EASE,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { TravelTrustOfficialTeamDialog } from "./TravelTrustOfficialTeamDialog";

function SupervisionNavSep() {
  return (
    <span className={TT_FOOTER_SUPERVISION_L5.sepClass} aria-hidden>
      ·
    </span>
  );
}

function SupervisionNavLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <span>{children}</span>
      <span className={TT_FOOTER_SUPERVISION_L5.underlineClass} aria-hidden />
    </>
  );
}

/** `/traveltrust` 页脚 · 技术开发与监督（横排三项 · 无产品/订单 sitemap） */
export function TravelTrustFooterCrossNav() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [teamOpen, setTeamOpen] = useState(false);
  const itemMotion = reduceMotion
    ? {}
    : {
        whileHover: TT_FOOTER_SUPERVISION_L5.itemHover,
        whileTap: TT_FOOTER_SUPERVISION_L5.itemTap,
        transition: TT_FOOTER_SUPERVISION_L5.itemTransition,
      };

  return (
    <motion.section
      className={TT_FOOTER_SUPERVISION_L5.shellClass}
      aria-labelledby="traveltrust-footer-supervision-title"
      data-tt-traveltrust-footer-supervision="1"
      data-tt-traveltrust-footer-cross-nav-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.4, ease: TT_L5_MOTION_EASE }}
    >
      <h3 id="traveltrust-footer-supervision-title" className={TT_FOOTER_SUPERVISION_L5.titleClass}>
        {t("traveltrust_footer_supervision_title")}
      </h3>
      <p className={TT_FOOTER_SUPERVISION_L5.bodyClass}>{t("traveltrust_footer_supervision_body")}</p>
      <nav
        className={TT_FOOTER_SUPERVISION_L5.navClass}
        aria-label={t("traveltrust_footer_supervision_nav_aria")}
        data-tt-traveltrust-footer-supervision-nav="1"
      >
        <motion.span className={TT_FOOTER_SUPERVISION_L5.itemClass} {...itemMotion}>
          <Link
            href={TRAVELTRUST_PROTOCOL_PAPER_HREF}
            className={TT_FOOTER_SUPERVISION_L5.linkClass}
            aria-label={t("traveltrust_footer_protocol_paper_aria")}
            data-tt-traveltrust-footer-protocol-paper="1"
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "footer_supervision",
                target: TRAVELTRUST_PROTOCOL_PAPER_HREF,
              })
            }
          >
            <SupervisionNavLabel>{t("traveltrust_footer_protocol_paper")} →</SupervisionNavLabel>
          </Link>
        </motion.span>
        <SupervisionNavSep />
        <motion.span className={TT_FOOTER_SUPERVISION_L5.itemClass} {...itemMotion}>
          <Link
            href="/governance"
            className={TT_FOOTER_SUPERVISION_L5.linkClass}
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "footer_supervision",
                target: "/governance",
              })
            }
          >
            <SupervisionNavLabel>{t("traveltrust_footer_governance_hub")} →</SupervisionNavLabel>
          </Link>
        </motion.span>
        <SupervisionNavSep />
        <motion.span className={TT_FOOTER_SUPERVISION_L5.itemClass} {...itemMotion}>
          <button
            type="button"
            className={`${TT_FOOTER_SUPERVISION_L5.linkClass} cursor-pointer border-0 bg-transparent`}
            aria-haspopup="dialog"
            aria-expanded={teamOpen}
            aria-label={t("traveltrust_footer_official_team_aria")}
            data-tt-traveltrust-official-team-open="1"
            onClick={() => {
              setTeamOpen(true);
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "footer_supervision",
                target: "official_team_dialog",
              });
            }}
          >
            <SupervisionNavLabel>{t("traveltrust_footer_official_team")} →</SupervisionNavLabel>
          </button>
        </motion.span>
      </nav>
      <TravelTrustOfficialTeamDialog open={teamOpen} onClose={() => setTeamOpen(false)} />
    </motion.section>
  );
}
