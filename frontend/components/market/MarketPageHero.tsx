"use client";

import { useTranslation } from "@/components/LocaleProvider";

export interface MarketPageHeroProps {
  onCustomItineraryClick: () => void;
  customItineraryLabel: string;
}

export default function MarketPageHero({ onCustomItineraryClick, customItineraryLabel }: MarketPageHeroProps) {
  const { t } = useTranslation();
  return (
    <section className="px-4 pt-6 pb-4">
      <div className="mx-auto max-w-5xl rounded-[var(--radius-lg)] border border-white/18 overflow-hidden shadow-[0_0_52px_-14px_rgba(252,164,124,0.14),0_0_40px_-10px_rgba(35,206,217,0.12)] ring-1 ring-ref-coral/20 bg-white/[0.07] backdrop-blur-md relative">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_-30%,rgba(249,215,121,0.2),transparent_52%),radial-gradient(ellipse_70%_55%_at_8%_40%,rgba(252,164,124,0.16),transparent_50%),radial-gradient(circle_at_95%_35%,rgba(35,206,217,0.12),transparent_42%)]"
          aria-hidden
        />
        <div className="relative p-5 sm:p-6 backdrop-saturate-150">
          <h1 className="text-h3 font-bold tracking-tight sm:text-h2 text-center text-white drop-shadow-market-hero">
            {t("market_hero_title")}
          </h1>
          <p className="mt-2 text-body text-slate-100/95 text-center drop-shadow-market-body">
            {t("market_hero_subtitle")}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="pointer-events-none rounded-full border border-white/15 bg-white/10 px-3 py-1 text-meta font-medium text-white/95 backdrop-blur-sm drop-shadow-market-pill" aria-hidden>
              {t("market_hero_pill_match")}
            </span>
            <span className="pointer-events-none rounded-full border border-ref-cyan/30 bg-ref-cyan/15 px-3 py-1 text-meta font-medium text-ref-cyan drop-shadow-market-pill" aria-hidden>
              {t("market_hero_pill_escrow")}
            </span>
            <span className="pointer-events-none rounded-full border border-ref-coral/35 bg-ref-coral/15 px-3 py-1 text-meta font-medium text-ref-coral drop-shadow-market-pill" aria-hidden>
              {t("market_hero_pill_dispute")}
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onCustomItineraryClick();
              }}
            >
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-ref-teal via-ref-cyan to-ref-teal px-5 py-2.5 text-small font-semibold text-white shadow-[0_0_28px_-4px_rgba(252,164,124,0.35),0_0_20px_-6px_rgba(35,206,217,0.3)] hover:brightness-110 motion-sub transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(20,12,10,0.55)]"
                aria-label={customItineraryLabel}
              >
                {customItineraryLabel}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
