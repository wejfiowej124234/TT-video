"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useAccount, useConnect } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TravelTrustIllustrativeBadge } from "./TravelTrustIllustrativeBadge";
import { traveltrustSectionMotionProps } from "./traveltrustSectionMotion";
import {
  TT_LIQUIDITY_PAIR_L5,
  TT_L5_MOTION_EASE,
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_STABLECOIN_GATEWAY_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import { getTtgExchangeQuote } from "@/lib/apiClient/governance/ttgExchange";
import {
  TRAVELTRUST_DEFAULT_SETTLEMENT_STABLECOIN,
  traveltrustCyclePayStablecoin,
  traveltrustTtgAcquirePreviewPair,
  type TraveltrustEscrowSettlementStablecoin,
} from "@/lib/traveltrustLiquidityGatewayModel";
import { traveltrustLiquidityContractFromBrief } from "@/lib/traveltrustLiquidityContract";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";

/** 治理币（TTG）兑换入口 — ① 预览 UI；真链路径见 96-18 / 治理中心（非 USDC↔USDT） */
export function TravelTrustStablecoinGateway() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.liquidity.title;
  const sectionMotion = traveltrustSectionMotionProps("liquidity", reduceMotion);
  const { brief } = useTravelTrustPageBriefContext();
  const liquidityContract = useMemo(() => traveltrustLiquidityContractFromBrief(brief), [brief]);
  const [payStable, setPayStable] = useState<TraveltrustEscrowSettlementStablecoin>(
    liquidityContract.default_pay_stable ?? TRAVELTRUST_DEFAULT_SETTLEMENT_STABLECOIN,
  );
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const pair = traveltrustTtgAcquirePreviewPair(payStable);

  const onSwapPreview = async () => {
    setQuoteLoading(true);
    trackTravelTrustEvent("traveltrust_secondary_cta_click", {
      source: "liquidity_ttg_preview",
      target: `${pair.from}->${pair.to}`,
    });
    try {
      await getTtgExchangeQuote(payStable);
      setPreviewNote(t("traveltrust_liquidity_preview_toast"));
    } catch {
      setPreviewNote(t("traveltrust_liquidity_quote_unavailable"));
    } finally {
      setQuoteLoading(false);
    }
  };

  return (
    <motion.section
      id="liquidity"
      className={TT_STABLECOIN_GATEWAY_L5.sectionSurfaceClass}
      aria-labelledby={titleId}
      data-tt-traveltrust-stable-gateway="1"
      data-tt-traveltrust-ttg-gateway-preview="1"
      data-tt-traveltrust-liquidity-l5-defer="illustrative-only"
      {...traveltrustSectionL5DataAttrs("liquidity")}
      initial={sectionMotion.initial}
      whileInView={sectionMotion.whileInView}
      viewport={sectionMotion.viewport}
      transition={sectionMotion.transition}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-px opacity-0"
        aria-hidden
        initial={reduceMotion ? false : { scaleX: 0 }}
        whileInView={reduceMotion ? undefined : { scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: TT_STABLECOIN_GATEWAY_L5.dividerRevealDuration, ease: TT_L5_MOTION_EASE }}
      />
      <div className={TT_SECTION_CONTENT_L5.bodyClass}>
      <motion.div
        className={TT_STABLECOIN_GATEWAY_L5.sectionHeaderClass}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={TT_STABLECOIN_GATEWAY_L5.headerEntrance}
        data-tt-traveltrust-liquidity-section-header-l5="1"
      >
        <p className={TT_SECTION_KICKER_L5}>{t("traveltrust_liquidity_eyebrow")}</p>
        <h2 id={titleId} className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_STABLECOIN_GATEWAY_L5.titleClass}`}>
          {t("traveltrust_liquidity_title")}
        </h2>
        <p className={TT_STABLECOIN_GATEWAY_L5.taglineClass}>{t("traveltrust_liquidity_tagline")}</p>
      </motion.div>
      <motion.div className={TT_STABLECOIN_GATEWAY_L5.cardWrapClass}>
      <motion.div
        className={TT_STABLECOIN_GATEWAY_L5.cardClass}
        data-tt-traveltrust-liquidity-card="1"
      data-tt-traveltrust-liquidity-l5="1"
      >
        <motion.div
          className={TT_STABLECOIN_GATEWAY_L5.previewBannerClass}
          data-tt-traveltrust-liquidity-preview-banner="1"
          data-tt-traveltrust-liquidity-disclaimer-single-l5="1"
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: TT_L5_MOTION_EASE }}
        >
          <motion.div className={TT_STABLECOIN_GATEWAY_L5.previewBannerLeadClass}>
            <TravelTrustIllustrativeBadge variant="preview" iconOnly />
            <p className="min-w-0 flex-1 text-meta font-medium text-amber-100/95">
              {t("traveltrust_liquidity_preview_banner")}
            </p>
          </motion.div>
          <p className={TT_STABLECOIN_GATEWAY_L5.previewBannerLegalClass}>
            {t("traveltrust_liquidity_disclaimer")}
          </p>
        </motion.div>

        <motion.div className={TT_STABLECOIN_GATEWAY_L5.cardBodyStackClass}>
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ref-sun/12 blur-3xl motion-reduce:hidden"
          aria-hidden
          animate={{
            opacity: TT_STABLECOIN_GATEWAY_L5.blobPrimary.opacity,
            scale: TT_STABLECOIN_GATEWAY_L5.blobPrimary.scale,
          }}
          transition={{
            duration: TT_STABLECOIN_GATEWAY_L5.blobPrimary.duration,
            repeat: TT_STABLECOIN_GATEWAY_L5.blobPrimary.repeat,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-ref-coral/10 blur-3xl motion-reduce:hidden"
          aria-hidden
          animate={{ opacity: TT_STABLECOIN_GATEWAY_L5.blobSecondary.opacity }}
          transition={{
            duration: TT_STABLECOIN_GATEWAY_L5.blobSecondary.duration,
            repeat: TT_STABLECOIN_GATEWAY_L5.blobSecondary.repeat,
            ease: "easeInOut",
          }}
        />
        {!reduceMotion ? (
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(232,201,106,0.08),transparent)] motion-reduce:hidden"
            aria-hidden
            initial={{ x: "-120%" }}
            animate={{ x: "220%" }}
            transition={{
              duration: TT_STABLECOIN_GATEWAY_L5.shimmer.duration,
              repeat: TT_STABLECOIN_GATEWAY_L5.shimmer.repeat,
              repeatDelay: TT_STABLECOIN_GATEWAY_L5.shimmer.repeatDelay,
              ease: "easeInOut",
            }}
          />
        ) : null}

        <motion.div
          className="relative mt-6 grid gap-4 sm:mt-7 sm:grid-cols-[1fr_auto_1fr] sm:items-end"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08, ...TT_STABLECOIN_GATEWAY_L5.headerEntrance }}
        >
          <label className="block w-full">
            <span className={TT_STABLECOIN_GATEWAY_L5.fieldLabelClass}>{t("traveltrust_liquidity_from")}</span>
            <motion.div
              className={TT_STABLECOIN_GATEWAY_L5.fieldIdleClass}
              layout
              whileHover={reduceMotion ? undefined : { borderColor: "rgba(252,164,124,0.35)" }}
            >
              <span className={`font-mono text-small font-semibold ${TT_LIQUIDITY_PAIR_L5.fromClass}`}>
                {pair.from}
              </span>
              <span className="ml-auto text-meta text-slate-500">{t("traveltrust_liquidity_allowlist")}</span>
            </motion.div>
          </label>

          <motion.button
            type="button"
            onClick={() =>
              setPayStable((s) => {
                const next = traveltrustCyclePayStablecoin(s);
                return liquidityContract.pay_stablecoins.includes(next) ? next : s;
              })
            }
            className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ref-sun/32 bg-ref-sun/10 text-ref-sun transition hover:bg-ref-sun/20 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50"
            aria-label={t("traveltrust_liquidity_flip")}
            animate={reduceMotion ? undefined : { rotate: payStable === "USDC" ? 0 : TT_STABLECOIN_GATEWAY_L5.flipButtonRotate }}
            transition={{ duration: TT_STABLECOIN_GATEWAY_L5.flipButtonDuration, ease: TT_L5_MOTION_EASE }}
          >
            ⇄
          </motion.button>

          <label className="block w-full">
            <span className={TT_STABLECOIN_GATEWAY_L5.fieldLabelClass}>{t("traveltrust_liquidity_to")}</span>
            <motion.div
              className={TT_STABLECOIN_GATEWAY_L5.fieldActiveClass}
              key={pair.to}
              initial={reduceMotion ? false : { opacity: 0.6, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={TT_STABLECOIN_GATEWAY_L5.pairFlip}
            >
              <span className={`font-mono text-small font-semibold ${TT_LIQUIDITY_PAIR_L5.toClass}`}>
                {pair.to}
              </span>
              <span className="ml-auto text-meta text-slate-500">{t("traveltrust_liquidity_ttg_label")}</span>
            </motion.div>
          </label>
        </motion.div>

        <label className={TT_STABLECOIN_GATEWAY_L5.amountFieldWrapClass}>
          <span className={TT_STABLECOIN_GATEWAY_L5.fieldLabelClass}>{t("traveltrust_liquidity_amount")}</span>
          <motion.input
            type="text"
            inputMode="decimal"
            readOnly
            value="—"
            aria-describedby="traveltrust-liquidity-amount-locked-hint traveltrust-liquidity-preview-note"
            className={TT_STABLECOIN_GATEWAY_L5.amountLockedClass}
            data-tt-traveltrust-liquidity-amount-preview="1"
            data-tt-traveltrust-stablecoin-amount-locked-warm-l5="1"
            animate={reduceMotion ? undefined : { opacity: [...TT_STABLECOIN_GATEWAY_L5.amountLockedPulse.opacity] }}
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: TT_STABLECOIN_GATEWAY_L5.amountLockedPulse.duration,
                    repeat: TT_STABLECOIN_GATEWAY_L5.amountLockedPulse.repeat,
                    ease: "easeInOut",
                  }
            }
          />
        </label>

        <p
          id="traveltrust-liquidity-amount-locked-hint"
          className={TT_STABLECOIN_GATEWAY_L5.amountLockedHintClass}
          role="status"
          data-tt-traveltrust-liquidity-preview-toast="1"
          data-tt-traveltrust-liquidity-amount-locked-hint="1"
        >
          {previewNote ?? t("traveltrust_liquidity_amount_preview_hint")}
        </p>

        <motion.div
          className={TT_STABLECOIN_GATEWAY_L5.ctaStackClass}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, ...TT_STABLECOIN_GATEWAY_L5.headerEntrance }}
        >
          <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} className="w-full sm:w-auto">
            <Link
              href={liquidityContract.governance_hub_path}
              onClick={() =>
                trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                  source: "liquidity",
                  target: "/governance",
                })
              }
              className={TT_STABLECOIN_GATEWAY_L5.ctaSwapClass}
            >
              {t("traveltrust_liquidity_governance_link")}
            </Link>
          </motion.div>
          <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} className="w-full sm:w-auto">
            <Link
              href={liquidityContract.escrow_pay_path}
              onClick={() =>
                trackTravelTrustEvent("traveltrust_secondary_cta_click", { source: "liquidity", target: "/pay" })
              }
              className={TT_STABLECOIN_GATEWAY_L5.ctaEscrowPrimaryClass}
            >
              {t("traveltrust_liquidity_escrow_link")}
            </Link>
          </motion.div>
          {!isConnected ? (
            <motion.button
              type="button"
              disabled={isPending}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => connect({ connector: connectors[0] })}
              className={TT_STABLECOIN_GATEWAY_L5.ctaConnectClass}
            >
              {t("traveltrust_liquidity_connect")}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              disabled={quoteLoading}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => void onSwapPreview()}
              aria-describedby="traveltrust-liquidity-preview-note"
              className={TT_STABLECOIN_GATEWAY_L5.ctaConnectClass}
              data-tt-traveltrust-ttg-quote-preview="1"
            >
              {quoteLoading ? t("traveltrust_liquidity_quote_loading") : t("traveltrust_liquidity_swap_preview")}
            </motion.button>
          )}
        </motion.div>

        </motion.div>
      </motion.div>
      </motion.div>
      </div>
    </motion.section>
  );
}
