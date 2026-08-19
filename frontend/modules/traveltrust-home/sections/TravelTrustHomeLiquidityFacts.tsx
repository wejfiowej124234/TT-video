"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TTG_PUBLIC_UNLOCK_BATCHES,
  formatUnlockUnitPrice,
  resolveTtgPublicSaleFocus,
  ttgPerUsdcFromUnitPrice,
} from "@/lib/governance/ttgPublicUnlockScheduleLocal";
import {
  TT_ECONOMY_INTERACT_L5,
  TT_L5_MOTION_EASE,
  TT_LIQUIDITY_RAIL_L5,
  TT_LIQUIDITY_TTG_PATHS_L5,
  TT_PAGE_VERTICAL_RHYTHM_L5,
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_SECTION_META_L5,
  TT_SECTION_MOTION_L5,
} from "@/lib/traveltrust/l5";

const FACT_ROWS = [
  {
    titleKey: "traveltrust_liquidity_facts_card_supply_title",
    summaryKey: "traveltrust_liquidity_facts_card_supply_summary",
  },
  {
    titleKey: "traveltrust_liquidity_facts_card_network_title",
    summaryKey: "traveltrust_liquidity_facts_card_network_summary",
  },
] as const;

const TTG_PATH_ROWS = [
  {
    index: "01",
    titleKey: "traveltrust_liquidity_ttg_paths_buy_title",
    bodyKey: "traveltrust_liquidity_ttg_paths_buy_body",
    accent: null,
  },
  {
    index: "02",
    titleKey: "traveltrust_liquidity_ttg_paths_hold_title",
    bodyKey: "traveltrust_liquidity_ttg_paths_hold_body",
    accent: null,
  },
  {
    index: "03",
    titleKey: "traveltrust_liquidity_ttg_paths_steward_title",
    bodyKey: "traveltrust_liquidity_ttg_paths_steward_body",
    accent: null,
  },
] as const;

const FOCUS_STATUS_KEYS = {
  upcoming: "traveltrust_unlock_status_upcoming",
  open: "traveltrust_unlock_status_open",
  complete: "traveltrust_unlock_status_complete",
} as const;

export function TravelTrustHomeLiquidityPriceRail() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const focus = useMemo(() => resolveTtgPublicSaleFocus(), []);
  const unitPrice = formatUnlockUnitPrice(focus.batch.unitPriceUsdc);
  const ttgPerUsdc = ttgPerUsdcFromUnitPrice(focus.batch.unitPriceUsdc);

  return (
    <div
      className={TT_LIQUIDITY_RAIL_L5.railClass}
      data-tt-traveltrust-liquidity-price-rail="1"
      data-tt-traveltrust-public-sale-ttg-per-usdc={ttgPerUsdc}
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
            ease: TT_L5_MOTION_EASE,
          }}
        />
      )}
      <div className={TT_LIQUIDITY_RAIL_L5.metricsClass}>
        <span className={TT_LIQUIDITY_RAIL_L5.priceClass}>TTG ${unitPrice}</span>
        <span
          className={TT_LIQUIDITY_RAIL_L5.batchFocusClass}
          data-tt-traveltrust-liquidity-batch-focus="1"
        >
          {t("traveltrust_liquidity_batch_badge", {
            n: String(focus.batch.id),
            status: t(FOCUS_STATUS_KEYS[focus.kind]),
          })}
        </span>
        <span className={TT_LIQUIDITY_RAIL_L5.pairClass}>
          1 USDC ≈ {ttgPerUsdc.toLocaleString("en-US")} TTG
        </span>
        <span className={TT_LIQUIDITY_RAIL_L5.minClass}>{t("traveltrust_liquidity_facts_min")}</span>
      </div>
      <div
        className={TT_LIQUIDITY_RAIL_L5.batchStripClass}
        aria-label={t("traveltrust_liquidity_batch_strip_aria")}
        data-tt-traveltrust-liquidity-batch-strip="1"
      >
        {TTG_PUBLIC_UNLOCK_BATCHES.map((batch) => (
          <span
            key={batch.id}
            className={`${TT_LIQUIDITY_RAIL_L5.batchChipClass} ${
              batch.id === focus.batch.id ? TT_LIQUIDITY_RAIL_L5.batchChipActiveClass : ""
            }`}
            data-tt-traveltrust-liquidity-batch={batch.id}
          >
            {batch.id} · ${formatUnlockUnitPrice(batch.unitPriceUsdc)}
          </span>
        ))}
      </div>
      <p className={TT_LIQUIDITY_RAIL_L5.disclaimerClass} data-tt-traveltrust-liquidity-public-sale="1">
        {t("traveltrust_liquidity_rail_disclaimer")}
      </p>
    </div>
  );
}

export function TravelTrustHomeLiquidityFacts() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <aside
      className="relative z-[1] min-w-0"
      data-tt-traveltrust-liquidity-facts="1"
    >
      <p className={TT_SECTION_KICKER_L5}>{t("traveltrust_liquidity_facts_kicker")}</p>
      <h2 className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingCompactClass}`}>
        {t("traveltrust_liquidity_facts_heading")}
      </h2>
      <ul
        className={`${TT_PAGE_VERTICAL_RHYTHM_L5.contentStackGap} space-y-4`}
        data-tt-traveltrust-liquidity-facts-grid="1"
        data-tt-traveltrust-liquidity-facts-count="2"
      >
        {FACT_ROWS.map((row, index) => (
          <motion.li
            key={row.titleKey}
            className="border-b border-ref-sun/14 pb-4 last:border-b-0 last:pb-0"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{
              duration: TT_SECTION_MOTION_L5.childStaggerDuration,
              delay: reduceMotion ? 0 : index * TT_SECTION_MOTION_L5.childStaggerBase,
              ease: TT_L5_MOTION_EASE,
            }}
          >
            <span className="block text-body font-semibold leading-snug text-white">
              {t(row.titleKey)}
            </span>
            <span className={`${TT_SECTION_META_L5.bodyClass} mt-1 block`}>
              {t(row.summaryKey)}
            </span>
          </motion.li>
        ))}
      </ul>
      <motion.div
        className={TT_LIQUIDITY_TTG_PATHS_L5.plateClass}
        data-tt-traveltrust-liquidity-ttg-paths="3"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{
          duration: TT_SECTION_MOTION_L5.liquidity.duration,
          delay: reduceMotion ? 0 : 0.08,
          ease: TT_L5_MOTION_EASE,
        }}
      >
        <p className={TT_LIQUIDITY_TTG_PATHS_L5.leadClass}>
          {t("traveltrust_liquidity_ttg_paths_lead")}
        </p>
        <ol className={TT_LIQUIDITY_TTG_PATHS_L5.listClass}>
          {TTG_PATH_ROWS.map((row, index) => (
            <motion.li
              key={row.titleKey}
              className={TT_LIQUIDITY_TTG_PATHS_L5.rowClass}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: TT_SECTION_MOTION_L5.childStaggerDuration,
                        delay: reduceMotion ? 0 : 0.12 + index * TT_SECTION_MOTION_L5.childStaggerBase,
                        ease: TT_L5_MOTION_EASE,
                      },
                    }
              }
              whileHover={
                reduceMotion
                  ? undefined
                  : { ...TT_ECONOMY_INTERACT_L5.rowShift, transition: TT_ECONOMY_INTERACT_L5.transition }
              }
              viewport={{ once: true, margin: "-12% 0px" }}
            >
              <span className={TT_LIQUIDITY_TTG_PATHS_L5.indexClass} aria-hidden>
                {row.index}
              </span>
              <div>
                <p className={TT_LIQUIDITY_TTG_PATHS_L5.titleClass}>
                  {t(row.titleKey)}
                  {row.accent ? (
                    <span className={`${TT_LIQUIDITY_TTG_PATHS_L5.pctClass} ml-2`}>
                      {row.accent}
                    </span>
                  ) : null}
                </p>
                <p className={TT_LIQUIDITY_TTG_PATHS_L5.bodyClass}>{t(row.bodyKey)}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        <p className={TT_LIQUIDITY_TTG_PATHS_L5.noteClass}>
          {t("traveltrust_liquidity_ttg_paths_note")}
        </p>
      </motion.div>
    </aside>
  );
}
