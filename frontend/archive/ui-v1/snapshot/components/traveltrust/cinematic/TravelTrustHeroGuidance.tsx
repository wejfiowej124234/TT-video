"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useConnect } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";

/**
 * Hero 内可行动提示：brief 降级 / 钱包不可用 / 连接失败 / 错链（TT-PH1-181 · ①）
 */
export function TravelTrustHeroGuidance() {
  const { t } = useTranslation();
  const { degraded, error: briefError, ready } = useTravelTrustPageBriefContext();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, error: connectError, isError } = useConnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const items: { id: string; body: string; href: string; label: string }[] = [];

  if (!ready && !degraded && !briefError) {
    items.push({
      id: "brief-loading",
      body: t("traveltrust_hero_guidance_brief_loading"),
      href: "#trust",
      label: t("traveltrust_hero_guidance_cta_trust"),
    });
  }

  if (degraded || briefError) {
    items.push({
      id: "brief",
      body:
        briefError === "page-brief ia_version mismatch"
          ? t("traveltrust_hero_guidance_brief_mismatch")
          : t("traveltrust_hero_guidance_brief_degraded"),
      href: "#trust",
      label: t("traveltrust_hero_guidance_cta_trust"),
    });
  }

  if (isConnected && chainId !== getExpectedChainId()) {
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
      href: "#faq",
      label: t("traveltrust_hero_guidance_cta_faq"),
    });
  }

  if (isError && connectError) {
    items.push({
      id: "wallet-rejected",
      body: t("traveltrust_hero_guidance_wallet_rejected"),
      href: "#faq",
      label: t("traveltrust_hero_guidance_cta_faq"),
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      role="status"
      className="mt-4 w-full rounded-xl border border-amber-400/30 bg-amber-950/35 px-4 py-3 text-left"
      data-tt-traveltrust-hero-guidance="1"
      data-tt-traveltrust-hero-guidance-count={String(items.length)}
    >
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-meta leading-relaxed text-amber-100/95">{item.body}</p>
            <Link
              href={item.href}
              className="shrink-0 text-meta font-semibold text-ref-cyan underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

