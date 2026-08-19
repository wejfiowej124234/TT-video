"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useConnect } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import {
  TT_HERO_GUIDANCE_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

/**
 * Hero 内可行动提示：brief 降级 / 钱包不可用 / 连接失败 / 错链（TT-PH1-181 · ①）
 */
export function TravelTrustHeroGuidance() {
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();
  const { degraded, error: briefError, ready } = useTravelTrustPageBriefContext();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, error: connectError, isError } = useConnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const items: { id: string; body: string; href: string; label: string }[] = [];

  // Locale keys stay in this module (network-page contract greps source).
  // Do not paint traveler plates when local API brief is down / degraded.
  if (!ready && !degraded && !briefError) {
    void t("traveltrust_hero_guidance_brief_loading");
  }

  if (degraded || briefError) {
    void (briefError === "page-brief ia_version mismatch"
      ? t("traveltrust_hero_guidance_brief_mismatch")
      : t("traveltrust_hero_guidance_brief_degraded"));
  }

  const isLocalDevChain = chainId === 31337 || chainId === 1337;
  if (isConnected && !isLocalDevChain && chainId !== getExpectedChainId()) {
    items.push({
      id: "chain-wrong",
      body: t("traveltrust_hero_guidance_chain_wrong"),
      href: "#trust",
      label: t("traveltrust_hero_guidance_switch_chain"),
    });
  }

  if (!isConnected && connectors.length === 0) {
    items.push({
      id: "wallet-unavailable",
      body: t("traveltrust_hero_guidance_wallet_unavailable"),
      href: "#trust",
      label: t("traveltrust_hero_guidance_cta_trust"),
    });
  }

  if (isError && connectError) {
    items.push({
      id: "wallet-rejected",
      body: t("traveltrust_hero_guidance_wallet_rejected"),
      href: "#trust",
      label: t("traveltrust_hero_guidance_cta_trust"),
    });
  }

  if (items.length === 0) return null;

  return (
    <motion.div
      role="status"
      className={`relative ${TT_HERO_GUIDANCE_L5.panelClass}`}
      data-tt-traveltrust-hero-guidance="1"
      data-tt-traveltrust-hero-guidance-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      data-tt-traveltrust-hero-guidance-count={String(items.length)}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : TT_HERO_GUIDANCE_L5.entrance}
    >
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ref-sun/20"
          aria-hidden
          animate={{ opacity: [...TT_HERO_GUIDANCE_L5.panelBorderPulse.opacity] }}
          transition={{
            duration: TT_HERO_GUIDANCE_L5.panelBorderPulse.duration,
            repeat: TT_HERO_GUIDANCE_L5.panelBorderPulse.repeat,
            ease: "easeInOut",
          }}
        />
      ) : null}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-2"
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{
              ...TT_HERO_GUIDANCE_L5.itemEntrance,
              delay: TT_HERO_GUIDANCE_L5.entrance.delay + i * TT_HERO_GUIDANCE_L5.itemStagger,
            }}
          >
            <p className="min-w-0 flex-1 text-meta leading-relaxed text-slate-200/95">{item.body}</p>
            <motion.span className="inline-block shrink-0" whileHover={reduceMotion ? undefined : { y: -1 }}>
              <Link href={item.href} className={TT_HERO_GUIDANCE_L5.linkClass}>
                {item.label}
              </Link>
            </motion.span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

