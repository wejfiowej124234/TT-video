"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";

const DISMISS_KEY = "tt_traveltrust_sticky_cta_dismissed";

const stickyPrimaryLinkClass =
  "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-cta-gradient px-4 py-1.5 text-small font-semibold text-white shadow-soft transition-transform motion-sub hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
const stickyGhostLinkClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-lg)] border border-white/18 bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 text-meta font-semibold text-slate-100 shadow-scifi-card-faint motion-sub hover:border-ref-coral/40 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/**
 * 85 §十九：滚动后常驻快捷 CTA（市场 / `#fee-router` / `#token-system` / `#cta`）；抵达主 CTA 区块或用户关闭后隐藏。
 */
export default function TravelTrustStickyCta() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const cta = document.getElementById("cta");
    if (!hero) return;

    const ioHero = new IntersectionObserver(
      ([e]) => {
        setPastHero(!e?.isIntersecting);
      },
      { root: null, rootMargin: "-72px 0px 0px 0px", threshold: 0 }
    );
    ioHero.observe(hero);

    let ioCta: IntersectionObserver | null = null;
    if (cta) {
      ioCta = new IntersectionObserver(
        ([e]) => {
          setCtaVisible(Boolean(e?.isIntersecting && e.intersectionRatio > 0.12));
        },
        { threshold: [0, 0.12, 0.25] }
      );
      ioCta.observe(cta);
    }

    return () => {
      ioHero.disconnect();
      ioCta?.disconnect();
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const open = pastHero && !ctaVisible && !dismissed;

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-slate-950/92 shadow-[0_-8px_40px_-12px_rgba(35,206,217,0.18),0_-12px_48px_-16px_rgba(252,164,124,0.1)] backdrop-blur-xl safe-area-inset-b"
      role="region"
      aria-label={t("traveltrust_sticky_region")}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/market" className={stickyPrimaryLinkClass}>
            {t("traveltrust_hero_earlyAccess")}
          </Link>
          <Link href="#fee-router" className={stickyGhostLinkClass}>
            {t("traveltrust_link_feeRouter")}
          </Link>
          <Link href="#token-system" className={stickyGhostLinkClass}>
            {t("traveltrust_link_tokenSystem")}
          </Link>
          <Link href="#cta" className={stickyGhostLinkClass}>
            {t("traveltrust_sticky_more")}
          </Link>
        </div>
        <form
          className="inline shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            dismiss();
          }}
        >
          <button
            type="submit"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] px-2 py-1.5 text-meta text-slate-400 motion-sub hover:bg-white/10 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {t("traveltrust_sticky_dismiss")}
          </button>
        </form>
      </div>
    </div>
  );
}
