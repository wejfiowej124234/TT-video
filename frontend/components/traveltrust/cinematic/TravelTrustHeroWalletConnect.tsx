"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TRAVELTRUST_HEADER_WALLET_ID } from "@/lib/traveltrustHeroTrustChips";
import { TT_HERO_BTN_GHOST } from "./traveltrustHeroUi";
import {
  TT_HERO_CHAIN_HUD_L5,
  TT_HERO_WALLET_HINT_L5,
  TT_HERO_WALLET_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

type Props = {
  buttonClassName?: string;
};

/** Hero 钱包：未连接时连接；已连接时跳转顶栏单入口（TT-PH1-169 / 060 / 181 · ①） */
export function TravelTrustHeroWalletConnect({ buttonClassName }: Props = {}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
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
      <motion.div
        className={TT_HERO_WALLET_L5.connectedCardClass}
        initial={{ opacity: 0, y: 6 }}
        animate={
          reduceMotion
            ? { opacity: 1, y: 0 }
            : {
                opacity: 1,
                y: 0,
                boxShadow: [
                  "0 0 20px -10px rgba(252,164,124,0.22)",
                  "0 0 28px -8px rgba(252,164,124,0.38)",
                  "0 0 20px -10px rgba(252,164,124,0.22)",
                ],
              }
        }
        transition={
          reduceMotion
            ? TT_HERO_WALLET_L5.menuEntrance
            : {
                ...TT_HERO_WALLET_L5.menuEntrance,
                boxShadow: {
                  duration: TT_HERO_WALLET_L5.connectedCardPulse.duration,
                  repeat: TT_HERO_WALLET_L5.connectedCardPulse.repeat,
                  ease: "easeInOut",
                },
              }
        }
        data-tt-traveltrust-hero-wallet-connected="1"
        data-tt-traveltrust-hero-wallet-l5="1"
        data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
        data-tt-traveltrust-hero-wallet-l5-anchor={TT_HERO_WALLET_L5.anchor}
      >
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
      </motion.div>
    );
  }

  const noWallet = connectors.length === 0;

  return (
    <div
      className="relative w-full"
      ref={ref}
      data-tt-traveltrust-hero-wallet-menu="1"
      data-tt-traveltrust-hero-wallet-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
    >
      <motion.button
        type="button"
        disabled={isPending || noWallet}
        aria-expanded={open}
        aria-haspopup="menu"
        animate={
          open || isPending
            ? undefined
            : {
                boxShadow: [
                  "0 0 0 0 rgba(252,164,124,0)",
                  "0 0 20px -6px rgba(252,164,124,0.35)",
                  "0 0 0 0 rgba(252,164,124,0)",
                ],
              }
        }
        transition={TT_HERO_WALLET_L5.connectButtonPulse}
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
      </motion.button>
      <p className={TT_HERO_WALLET_HINT_L5}>
        {t("traveltrust_hero_wallet_header_hint")}
      </p>
      {isError ? (
        <p className="mt-2 text-meta text-amber-200/90" role="alert" data-tt-traveltrust-hero-wallet-error="1">
          {t("traveltrust_hero_guidance_wallet_rejected")}
        </p>
      ) : null}
      <AnimatePresence>
        {open && connectors.length > 0 ? (
          <motion.div
            role="menu"
            className={TT_HERO_WALLET_L5.menuPanelClass}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={TT_HERO_WALLET_L5.menuEntrance}
            data-tt-traveltrust-hero-wallet-menu-panel-l5="1"
          >
            {!reduceMotion ? (
              <motion.div
                className={TT_HERO_WALLET_L5.menuShimmerClass}
                aria-hidden
                data-tt-traveltrust-hero-wallet-menu-shimmer-l5="1"
                initial={{ x: "-120%" }}
                animate={{ x: "120%" }}
                transition={{
                  duration: TT_HERO_WALLET_L5.menuShimmerDuration,
                  repeat: TT_HERO_WALLET_L5.menuShimmerRepeat,
                  repeatDelay: 0,
                  ease: "easeInOut",
                }}
              />
            ) : null}
            <p className={`relative px-3 py-1 text-meta ${TT_HERO_CHAIN_HUD_L5.metaMutedClass}`}>
              {t("wallet_chooseConnector")}
            </p>
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
                  className={TT_HERO_WALLET_L5.menuItemClass}
                >
                  {c.name}
                </button>
              </form>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
