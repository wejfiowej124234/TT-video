"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useAccount, useConnect } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TT_CINEMATIC_EASE } from "./traveltrustCinematicMotion";
import { TravelTrustIllustrativeBadge } from "./TravelTrustIllustrativeBadge";
const PAIRS = [
  { from: "USDC", to: "USDT" },
  { from: "USDT", to: "USDC" },
] as const;

/** 稳定币兑换入口 — ① 预览 UI；真链兑换接钱包 + 后续 DEX/On-ramp（08-4 须标注） */
export function TravelTrustStablecoinGateway() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.liquidity.title;
  const [pairIdx, setPairIdx] = useState(0);
  const [amount, setAmount] = useState("100");
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const pair = PAIRS[pairIdx % PAIRS.length];

  const onSwapPreview = () => {
    trackTravelTrustEvent("traveltrust_secondary_cta_click", {
      source: "liquidity_swap_preview",
      target: `${pair.from}->${pair.to}`,
    });
  };

  return (
    <motion.section
      id="liquidity"
      className="scroll-mt-28 border-t border-white/10 py-10 sm:py-14"
      aria-labelledby={titleId}
      data-tt-traveltrust-stable-gateway="1"
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.55, ease: TT_CINEMATIC_EASE }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-ref-cyan/20 bg-ink-950/75 p-6 shadow-[0_0_60px_-20px_rgba(35,206,217,0.35)] backdrop-blur-xl sm:p-8">
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ref-cyan/10 blur-3xl motion-reduce:hidden"
          aria-hidden
          animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-ref-coral/10 blur-3xl motion-reduce:hidden"
          aria-hidden
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="flex flex-wrap items-start justify-between gap-3"
          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: TT_CINEMATIC_EASE }}
        >
          <motion.div>
            <p className="text-kicker font-semibold uppercase tracking-[0.2em] text-ref-cyan/85">
              {t("traveltrust_liquidity_eyebrow")}
            </p>
            <h2 id={titleId} className="mt-2 text-h3 font-bold text-white sm:text-h2">
              {t("traveltrust_liquidity_title")}
            </h2>
            <p className="mt-2 max-w-lg text-meta text-slate-400">{t("traveltrust_liquidity_tagline")}</p>
          </motion.div>
          <TravelTrustIllustrativeBadge
            variant="preview"
            className="shrink-0"
          />
        </motion.div>

        <motion.div
          className="relative mt-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08, duration: 0.45, ease: TT_CINEMATIC_EASE }}
        >
          <label className="block">
            <span className="text-meta text-slate-500">{t("traveltrust_liquidity_from")}</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/35 px-4 py-3">
              <span className="font-mono text-small font-semibold text-ref-cyan">{pair.from}</span>
              <span className="ml-auto text-meta text-slate-500">{t("traveltrust_liquidity_allowlist")}</span>
            </div>
          </label>

          <button
            type="button"
            onClick={() => setPairIdx((i) => (i + 1) % PAIRS.length)}
            className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ref-cyan/30 bg-ref-cyan/10 text-ref-cyan transition hover:bg-ref-cyan/20 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60"
            aria-label={t("traveltrust_liquidity_flip")}
          >
            ⇄
          </button>

          <label className="block">
            <span className="text-meta text-slate-500">{t("traveltrust_liquidity_to")}</span>
            <motion.div
              className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/35 px-4 py-3"
              key={pair.to}
              initial={reduceMotion ? false : { opacity: 0.6, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: TT_CINEMATIC_EASE }}
            >
              <span className="font-mono text-small font-semibold text-ref-teal">{pair.to}</span>
              <span className="ml-auto text-meta text-slate-500">{t("traveltrust_liquidity_allowlist")}</span>
            </motion.div>
          </label>
        </motion.div>

        <label className="relative mt-4 block max-w-xs">
          <span className="text-meta text-slate-500">{t("traveltrust_liquidity_amount")}</span>
          <input
            type="number"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3 font-mono text-small text-white outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
          />
        </label>

        <div className="relative mt-6 flex flex-wrap gap-3">
          {!isConnected ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => connect({ connector: connectors[0] })}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-ref-cyan/40 bg-ref-cyan/15 px-6 py-3 text-small font-semibold text-ref-cyan transition hover:bg-ref-cyan/25 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60 disabled:opacity-60"
            >
              {t("traveltrust_liquidity_connect")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSwapPreview}
              aria-describedby="traveltrust-liquidity-preview-note"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-white/20 bg-white/8 px-8 py-3 text-small font-semibold text-slate-200 transition hover:border-ref-cyan/35 hover:bg-white/12 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70"
            >
              {t("traveltrust_liquidity_swap_preview")}
            </button>
          )}
          <Link
            href="/pay"
            onClick={() =>
              trackTravelTrustEvent("traveltrust_secondary_cta_click", { source: "liquidity", target: "/pay" })
            }
            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-white/15 bg-white/5 px-6 py-3 text-small font-semibold text-slate-100 hover:border-ref-coral/35 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
          >
            {t("traveltrust_liquidity_escrow_link")}
          </Link>
        </div>

        <p
          id="traveltrust-liquidity-preview-note"
          className="relative mt-4 max-w-2xl text-meta leading-relaxed text-slate-500"
        >
          {t("traveltrust_liquidity_disclaimer")}
        </p>
      </div>
    </motion.section>
  );
}
