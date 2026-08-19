"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TravelTrustCopyableAddress } from "./TravelTrustCopyableAddress";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { getGovernanceExplorerAddressUrl } from "@/lib/governance/governanceBlockExplorer";
import { TRAVELTRUST_ASSURANCE_HREF } from "@/lib/traveltrustListingDisclosure";
import {
  TRAVELTRUST_ANNOUNCEMENTS_PATH,
  TRAVELTRUST_ANNOUNCEMENTS_PROTOCOL_SECTION_ID,
} from "@/lib/traveltrustNetworkAnnouncements";
import {
  PRIMARY_MARKET_LIVE_PM_ADDRESS,
  PRIMARY_MARKET_LIVE_TTG_ADDRESS,
} from "@/lib/governance/primaryMarketRuntimePriceSsot";
import {
  TT_ECONOMY_INTERACT_L5,
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_SECTION_META_L5,
  TT_SECTION_SURFACE_L5,
  TT_TRUST_FACTS_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrust/l5";

/** 轻量 Settlement 叙事：公告为完整清单，本段留可复制地址 */
export function TravelTrustSettlementStrip() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.settlement.title;
  const ttgUrl = getGovernanceExplorerAddressUrl(1, PRIMARY_MARKET_LIVE_TTG_ADDRESS);
  const pmUrl = getGovernanceExplorerAddressUrl(1, PRIMARY_MARKET_LIVE_PM_ADDRESS);
  const announcementsHref = `${TRAVELTRUST_ANNOUNCEMENTS_PATH}#${TRAVELTRUST_ANNOUNCEMENTS_PROTOCOL_SECTION_ID}`;

  return (
    <section
      id="settlement"
      className={TT_SECTION_SURFACE_L5.settlement}
      aria-labelledby={titleId}
      data-tt-traveltrust-settlement-strip="1"
      data-tt-traveltrust-settlement-l5="1"
      data-tt-traveltrust-settlement-compact-l5="1"
      {...traveltrustSectionL5DataAttrs("settlement")}
    >
      <div
        className={TT_SECTION_CONTENT_L5.bodyClass}
        data-tt-traveltrust-trust-faq-liquidity-surface-l5="1"
      >
        <p className={TT_SECTION_KICKER_L5}>{t("traveltrust_settlement_eyebrow")}</p>
        <h2
          id={titleId}
          className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingClass}`}
        >
          {t("traveltrust_settlement_title")}
        </h2>
        <p className={`${TT_SECTION_CONTENT_L5.introClass} ${TT_SECTION_META_L5.bodyClass}`}>
          {t("traveltrust_settlement_body")}
        </p>
        <div className={`${TT_SECTION_CONTENT_L5.stackAfterHeadingClass} flex flex-col gap-6 sm:gap-8`}>
          <p className="mt-0 flex flex-wrap gap-3">
          <motion.span
            className="inline-flex"
            whileHover={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.ctaHover}
            whileTap={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.ctaTap}
            transition={TT_ECONOMY_INTERACT_L5.transition}
          >
          <Link
            href={announcementsHref}
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "settlement",
                target: announcementsHref,
              })
            }
            className="inline-flex min-h-[2.75rem] items-center rounded-full border border-[#f4d39a]/45 bg-transparent px-5 text-small font-semibold text-[#f4d39a] transition hover:bg-[#f4d39a]/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d39a]/45"
            data-tt-traveltrust-settlement-announcements-cta="1"
          >
            {t("traveltrust_settlement_announcements_cta")} →
          </Link>
          </motion.span>
          <motion.span
            className="inline-flex"
            whileHover={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.ctaHover}
            whileTap={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.ctaTap}
            transition={TT_ECONOMY_INTERACT_L5.transition}
          >
          <Link
            href={TRAVELTRUST_ASSURANCE_HREF}
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                source: "settlement",
                target: TRAVELTRUST_ASSURANCE_HREF,
              })
            }
            className="inline-flex min-h-[2.75rem] items-center rounded-full border border-[#f4d39a]/30 bg-transparent px-5 text-small font-semibold text-[#f4d39a]/90 transition hover:bg-[#f4d39a]/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d39a]/45"
            data-tt-traveltrust-settlement-assurance-cta="1"
          >
            {t("traveltrust_settlement_assurance_cta")} →
          </Link>
          </motion.span>
          </p>
          <motion.dl
            className={`${TT_TRUST_FACTS_L5.warmPlateClass} relative overflow-hidden grid gap-6 p-6 font-mono text-meta sm:grid-cols-2 sm:gap-7 sm:p-7`}
            data-tt-traveltrust-settlement-contracts="1"
            whileHover={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.plateHover}
            transition={TT_ECONOMY_INTERACT_L5.transition}
          >
            {reduceMotion ? null : (
              <motion.span
                aria-hidden
                className={TT_ECONOMY_INTERACT_L5.sheenClass}
                initial={{ x: "-45%", opacity: 0 }}
                whileInView={{
                  x: TT_ECONOMY_INTERACT_L5.sheenEnter.x[1],
                  opacity: TT_ECONOMY_INTERACT_L5.sheenEnter.opacity,
                }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{
                  duration: TT_ECONOMY_INTERACT_L5.sheenDuration,
                  ease: TT_ECONOMY_INTERACT_L5.transition.ease,
                }}
              />
            )}
          <TravelTrustCopyableAddress
            label={t("traveltrust_settlement_contract_ttg")}
            address={PRIMARY_MARKET_LIVE_TTG_ADDRESS}
            explorerUrl={ttgUrl}
            field="ttg"
          />
          <TravelTrustCopyableAddress
            label={t("traveltrust_settlement_contract_pm")}
            address={PRIMARY_MARKET_LIVE_PM_ADDRESS}
            explorerUrl={pmUrl}
            field="pm"
          />
          <div className="sm:col-span-2">
            <dt className="text-slate-400/90">{t("traveltrust_settlement_contract_chain")}</dt>
            <dd className="mt-1.5 text-slate-200/90">Ethereum Mainnet · Etherscan</dd>
          </div>
          </motion.dl>
        </div>
        <p
          className="mt-8 max-w-3xl text-meta leading-relaxed text-slate-400/88"
          data-tt-traveltrust-settlement-disclaimer="1"
        >
          {t("traveltrust_settlement_disclaimer")}
        </p>
      </div>
    </section>
  );
}
