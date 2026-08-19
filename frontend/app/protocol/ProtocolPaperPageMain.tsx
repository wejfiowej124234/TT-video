"use client";

import Link from "next/link";
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { traveltrustExperienceL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";
import { TT_L5_MOTION_EASE } from "@/lib/traveltrust/l5";

/** `/protocol` · 白皮书官方阅读占位（金黑 cinematic · 无签核正文） */
export function ProtocolPaperPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <main
      className={`${GOV_PROPOSALS_L5.pageShell} relative isolate overflow-x-clip`}
      aria-labelledby={pageTitleId}
      data-tt-protocol-paper-placeholder="1"
      {...traveltrustExperienceL5ShellDataAttrs("protocol-paper")}
    >
      <div className={GOV_PROPOSALS_L5.pageVignette} aria-hidden />
      <div className={GOV_PROPOSALS_L5.ambient} aria-hidden />
      <div className={GOV_PROPOSALS_L5.dotGrid} aria-hidden />
      <section className={GOV_PROPOSALS_L5.pageInnerNarrow}>
        <motion.header
          className={GOV_PROPOSALS_L5.pageHeaderWrap}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: TT_L5_MOTION_EASE }}
        >
          <div className={GOV_PROPOSALS_L5.heroFrame}>
            <div className={`relative overflow-hidden ${GOV_PROPOSALS_L5.heroInner} space-y-3`}>
              <div className={GOV_PROPOSALS_L5.heroInnerGlow} aria-hidden />
              <div className="relative z-[1] space-y-3">
                <p className={GOV_PROPOSALS_L5.heroKicker}>{t("protocol_paper_kicker")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 id={pageTitleId} className={GOV_PROPOSALS_L5.heroTitle}>
                    {t("protocol_paper_title")}
                  </h1>
                  <span className={GOV_PROPOSALS_L5.statusPillPending}>{t("protocol_paper_status")}</span>
                </div>
                <p className={GOV_PROPOSALS_L5.heroLead}>{t("protocol_paper_lead")}</p>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.div
          className={GOV_PROPOSALS_L5.panelFrame}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.08, ease: TT_L5_MOTION_EASE }}
        >
          <div className={GOV_PROPOSALS_L5.panelInner}>
            <div className={GOV_PROPOSALS_L5.panelGlow} aria-hidden />
            <div className={`${GOV_PROPOSALS_L5.panelBody} space-y-4`}>
              <p className="text-body leading-relaxed text-slate-100/95">{t("protocol_paper_body")}</p>
              <p className="text-small leading-relaxed text-slate-300/90">{t("protocol_paper_params")}</p>
              <p className="text-small font-semibold uppercase tracking-[0.12em] text-slate-400/90">
                {t("protocol_paper_outline_title")}
              </p>
              <ol className="space-y-2 text-small leading-relaxed text-slate-200/90">
                <li>{t("protocol_paper_outline_1")}</li>
                <li>{t("protocol_paper_outline_2")}</li>
                <li>{t("protocol_paper_outline_3")}</li>
                <li>{t("protocol_paper_outline_4")}</li>
                <li>{t("protocol_paper_outline_5")}</li>
              </ol>
            </div>
          </div>
        </motion.div>

        <nav className={`${GOV_PROPOSALS_L5.footerNav} mt-8`} aria-label={t("traveltrust_footer_supervision_nav_aria")}>
          <Link href="/traveltrust" className={GOV_PROPOSALS_L5.footerLink}>
            {t("protocol_paper_back")} →
          </Link>
          <Link href="/governance" className={GOV_PROPOSALS_L5.footerLink}>
            {t("protocol_paper_governance")} →
          </Link>
        </nav>
      </section>
    </main>
  );
}
