"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TRAVELTRUST_HEADER_WALLET_ID } from "@/lib/traveltrustHeroTrustChips";
import { TT_HERO_BTN_GHOST } from "./traveltrustHeroUi";

type Props = {
  buttonClassName?: string;
};

/** Hero 钱包：未连接时连接；已连接时跳转顶栏单入口（TT-PH1-169 / 060 / 181 · ①） */
export function TravelTrustHeroWalletConnect({ buttonClassName }: Props = {}) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, isError, reset } = useConnect();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  if (isConnected && address) {
    return (
      <div className="flex w-full flex-col items-stretch gap-2" data-tt-traveltrust-hero-wallet-connected="1">
        <a
          href={`#${TRAVELTRUST_HEADER_WALLET_ID}`}
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", {
              source: "hero_wallet",
              target: `#${TRAVELTRUST_HEADER_WALLET_ID}`,
            })
          }
          className={`${buttonClassName ?? TT_HERO_BTN_GHOST} flex min-h-[48px] w-full items-center justify-center px-4 py-2.5 text-center text-small font-semibold`}
        >
          {t("traveltrust_hero_wallet_header_cta")}
        </a>
        <p className="text-center text-[11px] text-slate-500 sm:text-left">
          {t("traveltrust_hero_wallet_connected_hint")}
        </p>
      </div>
    );
  }

  const noWallet = connectors.length === 0;

  return (
    <div className="relative w-full" ref={ref} data-tt-traveltrust-hero-wallet-menu="1">
      <button
        type="button"
        disabled={isPending || noWallet}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          if (isError) reset();
          trackTravelTrustEvent("traveltrust_secondary_cta_click", {
            source: "hero_wallet",
            target: "#connect",
          });
          setOpen((o) => !o);
        }}
        className={`${buttonClassName ?? TT_HERO_BTN_GHOST} w-full min-h-[48px]`}
      >
        {isPending
          ? t("wallet_connecting")
          : noWallet
            ? t("traveltrust_hero_guidance_wallet_unavailable_short")
            : t("traveltrust_liquidity_connect")}
      </button>
      <p className="mt-2 text-center text-[11px] text-slate-500 sm:text-left">
        {t("traveltrust_hero_wallet_header_hint")}
      </p>
      {isError ? (
        <p className="mt-2 text-meta text-amber-200/90" role="alert" data-tt-traveltrust-hero-wallet-error="1">
          {t("traveltrust_hero_guidance_wallet_rejected")}
        </p>
      ) : null}
      {open && connectors.length > 0 ? (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-2 min-w-[min(100%,14rem)] -translate-x-1/2 rounded-xl border border-white/16 bg-ink-900/98 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:left-0 sm:translate-x-0"
        >
          <p className="px-3 py-1 text-meta text-slate-400">{t("wallet_chooseConnector")}</p>
          {connectors.slice(0, 4).map((c) => (
            <form
              key={c.uid}
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                connect({ connector: c });
                setOpen(false);
              }}
            >
              <button
                type="submit"
                role="menuitem"
                disabled={isPending}
                className="w-full px-3 py-2.5 text-left text-small text-slate-100 hover:bg-white/10 focus:outline-none focus-visible:bg-white/12"
              >
                {c.name}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
