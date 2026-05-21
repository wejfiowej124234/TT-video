"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { mainnet, polygon, polygonAmoy, sepolia } from "viem/chains";
import { getExpectedChainId } from "@/lib/chainEnv";
import {
  TT_HERO_CHAIN_HUD_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";

function chainLabelForId(id: number): string {
  if (id === mainnet.id) return mainnet.name;
  if (id === polygon.id) return polygon.name;
  if (id === polygonAmoy.id) return polygonAmoy.name;
  if (id === sepolia.id) return sepolia.name;
  if (id === 31337) return "Local Anvil";
  return `Chain ${id}`;
}

/** 已连接时展示链状态 + 错链切换（TT-PH1-181 / 168 · ①） */
export function TravelTrustHeroChainHud() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !isConnected) return null;

  const expected = getExpectedChainId();
  const wrongNetwork = chainId !== expected;
  const chainLabel = chainLabelForId(chainId);
  const canSwitch = wrongNetwork && typeof switchChain === "function";

  return (
    <motion.div
      className="mt-4 flex flex-col items-center gap-2 lg:items-start"
      data-tt-traveltrust-hero-chain-hud="1"
      data-tt-traveltrust-hero-chain-hud-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      data-tt-traveltrust-hero-chain-wrong={wrongNetwork ? "1" : "0"}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TT_HERO_CHAIN_HUD_L5.entrance}
    >
      <motion.span
        className={`inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border px-3 py-1 text-meta font-medium lg:justify-start ${
          wrongNetwork
            ? "border-amber-400/45 bg-amber-400/10 text-amber-100"
            : `${TT_HERO_CHAIN_HUD_L5.connectedChipClass} ${TT_HERO_CHAIN_HUD_L5.connectedChipGlow}`
        }`}
        data-tt-traveltrust-hero-chain-id={String(chainId)}
        animate={
          wrongNetwork
            ? { opacity: TT_HERO_CHAIN_HUD_L5.wrongChipPulse.opacity }
            : undefined
        }
        transition={
          wrongNetwork
            ? {
                duration: TT_HERO_CHAIN_HUD_L5.wrongChipPulse.duration,
                repeat: TT_HERO_CHAIN_HUD_L5.wrongChipPulseRepeat,
                ease: "easeInOut",
              }
            : undefined
        }
      >
        <span className="inline-flex items-center gap-1.5">
          <motion.span
            className={`h-1.5 w-1.5 rounded-full ${wrongNetwork ? "bg-amber-400" : TT_HERO_CHAIN_HUD_L5.connectedDotClass}`}
            aria-hidden
            animate={
              wrongNetwork
                ? undefined
                : { opacity: [0.55, 1, 0.55], scale: [0.92, 1.12, 0.92] }
            }
            transition={{
              duration: TT_HERO_CHAIN_HUD_L5.dotPulseDuration,
              repeat: TT_HERO_CHAIN_HUD_L5.dotPulseRepeat,
              ease: "easeInOut",
            }}
          />
          {wrongNetwork ? t("traveltrust_chain_wrong") : chainLabel}
        </span>
        <span
          className={`font-mono text-[11px] ${TT_HERO_CHAIN_HUD_L5.metaMutedClass}`}
          title={t("traveltrust_chain_id_hint")}
        >
          {t("traveltrust_chain_id_label")} {chainId}
        </span>
      </motion.span>
      {wrongNetwork ? (
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          {canSwitch ? (
            <motion.button
              type="button"
              disabled={switching}
              whileHover={TT_HERO_CHAIN_HUD_L5.linkHover}
              whileTap={TT_HERO_CHAIN_HUD_L5.switchTap}
              onClick={() => switchChain({ chainId: expected })}
              className={TT_HERO_CHAIN_HUD_L5.switchButtonClass}
            >
              {switching ? t("wallet_connecting") : t("traveltrust_hero_guidance_switch_chain")}
            </motion.button>
          ) : null}
          <motion.div whileHover={TT_HERO_CHAIN_HUD_L5.linkHover}>
            <Link href="#trust" className={TT_HERO_CHAIN_HUD_L5.trustLinkClass}>
              {t("traveltrust_hero_guidance_cta_trust")}
            </Link>
          </motion.div>
        </div>
      ) : (
        <p
          className={`text-center text-meta lg:text-left ${TT_HERO_CHAIN_HUD_L5.metaMutedClass}`}
          data-tt-traveltrust-hero-chain-next-step="1"
        >
          {t("traveltrust_hero_wallet_next_step")}{" "}
          <motion.span className="inline-block" whileHover={TT_HERO_CHAIN_HUD_L5.linkHover}>
            <Link href="#start" className={TT_HERO_CHAIN_HUD_L5.startLinkClass}>
              {t("traveltrust_start_cta")}
            </Link>
          </motion.span>
        </p>
      )}
    </motion.div>
  );
}
