"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { traveltrustExperienceL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";
import { TRAVELTRUST_PROTOCOL_PAPER_HREF, TT_L5_MOTION_EASE } from "@/lib/traveltrust/l5";
import {
  TRAVELTRUST_ASSURANCE_HREF,
  TRAVELTRUST_CONTACT_HREF,
  TRAVELTRUST_TTG_AVATAR_HREF,
} from "@/lib/traveltrustListingDisclosure";
import type zh from "@/locales/zh";

type LocaleKey = keyof typeof zh;

type Props = {
  marker: string;
  experience: string;
  kickerKey: LocaleKey;
  titleKey: LocaleKey;
  statusKey: LocaleKey;
  leadKey: LocaleKey;
  bodyKeys: readonly LocaleKey[];
  children?: ReactNode;
};

const CROSS_LINKS = [
  { href: TRAVELTRUST_PROTOCOL_PAPER_HREF, labelKey: "traveltrust_footer_protocol_paper" as const },
  { href: TRAVELTRUST_TTG_AVATAR_HREF, labelKey: "traveltrust_footer_disclosure_brand" as const },
  { href: TRAVELTRUST_ASSURANCE_HREF, labelKey: "traveltrust_footer_disclosure_assurance" as const },
  { href: TRAVELTRUST_CONTACT_HREF, labelKey: "traveltrust_footer_disclosure_contact" as const },
] as const;

/** 送审占位阅读页（金黑 cinematic · 无假完成） */
export function TravelTrustListingDocPage({
  marker,
  experience,
  kickerKey,
  titleKey,
  statusKey,
  leadKey,
  bodyKeys,
  children,
}: Props) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <main
      className={`${GOV_PROPOSALS_L5.pageShell} relative isolate overflow-x-clip`}
      aria-labelledby={pageTitleId}
      data-tt-listing-doc={marker}
      {...traveltrustExperienceL5ShellDataAttrs(experience)}
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
                <p className={GOV_PROPOSALS_L5.heroKicker}>{t(kickerKey)}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 id={pageTitleId} className={GOV_PROPOSALS_L5.heroTitle}>
                    {t(titleKey)}
                  </h1>
                  <span className={GOV_PROPOSALS_L5.statusPillPending}>{t(statusKey)}</span>
                </div>
                <p className={GOV_PROPOSALS_L5.heroLead}>{t(leadKey)}</p>
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
              {bodyKeys.map((key) => (
                <p key={key} className="text-body leading-relaxed text-slate-100/95">
                  {t(key)}
                </p>
              ))}
              {children}
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
          {CROSS_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={GOV_PROPOSALS_L5.footerLink}>
              {t(link.labelKey)} →
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
