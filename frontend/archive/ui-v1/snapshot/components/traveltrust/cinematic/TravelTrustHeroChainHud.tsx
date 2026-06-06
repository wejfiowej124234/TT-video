"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { mainnet, polygon, polygonAmoy, sepolia } from "viem/chains";
import { getExpectedChainId } from "@/lib/chainEnv";

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
      data-tt-traveltrust-hero-chain-wrong={wrongNetwork ? "1" : "0"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <span
        className={`inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border px-3 py-1 text-meta font-medium lg:justify-start ${
          wrongNetwork
            ? "border-amber-400/45 bg-amber-400/10 text-amber-100"
            : "border-white/14 bg-ink-900/60 text-slate-100"
        }`}
        data-tt-traveltrust-hero-chain-id={String(chainId)}
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${wrongNetwork ? "bg-amber-400" : "bg-ref-mint"}`}
            aria-hidden
          />
          {wrongNetwork ? t("traveltrust_chain_wrong") : chainLabel}
        </span>
        <span className="font-mono text-[11px] text-slate-400" title={t("traveltrust_chain_id_hint")}>
          {t("traveltrust_chain_id_label")} {chainId}
        </span>
      </span>
      {wrongNetwork ? (
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          {canSwitch ? (
            <button
              type="button"
              disabled={switching}
              onClick={() => switchChain({ chainId: expected })}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-ref-cyan/40 bg-ref-cyan/12 px-3 py-1.5 text-meta font-semibold text-ref-cyan transition hover:bg-ref-cyan/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 disabled:opacity-60"
            >
              {switching ? t("wallet_connecting") : t("traveltrust_hero_guidance_switch_chain")}
            </button>
          ) : null}
          <Link
            href="#trust"
            className="text-meta font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
          >
            {t("traveltrust_hero_guidance_cta_trust")}
          </Link>
        </div>
      ) : null}
    </motion.div>
  );
}
