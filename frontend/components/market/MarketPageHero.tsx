"use client";

import { memo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_MARKETING_BTN_MARKET_PRIMARY_PILL,
  TT_MARKETING_HOME_HERO_TITLE,
  TT_MARKETING_MARKET_DARK_PATH,
  TT_MARKETING_MARKET_HERO_ZONE,
  TT_MARKETING_MARKET_L5_HERO_FRAME,
  TT_MARKETING_MARKET_L5_HERO_INNER,
  TT_MARKETING_MARKET_L5_HERO_META,
  TT_MARKETING_MARKET_L5_HERO_SUBTITLE,
  TT_MARKETING_MARKET_L5_PAGE_MAX,
  TT_MARKETING_ORDERS_PAGE_HERO_INNER_GLOW,
} from "@/lib/marketingUi";
import { MARKET_HERO_TRIP_DAY_PRESETS } from "@/lib/marketTripDaysFilter";

const D = TT_MARKETING_MARKET_DARK_PATH;

export interface MarketPageHeroProps {
  onCustomItineraryClick: () => void;
  onTripDaysFilter?: (days: number) => void;
  selectedTripDays?: number | null;
  customItineraryLabel: string;
}

function MarketPageHero({
  onCustomItineraryClick,
  onTripDaysFilter,
  selectedTripDays = null,
  customItineraryLabel,
}: MarketPageHeroProps) {
  const { t } = useTranslation();

  return (
    <section className={`${TT_MARKETING_MARKET_HERO_ZONE} ${D.marketHeroShell}`}>
      <div className={TT_MARKETING_MARKET_L5_PAGE_MAX}>
        <div className={`relative ${TT_MARKETING_MARKET_L5_HERO_FRAME}`}>
          <div className={TT_MARKETING_ORDERS_PAGE_HERO_INNER_GLOW} aria-hidden />
          <div className={TT_MARKETING_MARKET_L5_HERO_INNER}>
            <h1 className={TT_MARKETING_HOME_HERO_TITLE}>{t("market_hero_title")}</h1>
            <p className={TT_MARKETING_MARKET_L5_HERO_SUBTITLE}>{t("market_hero_subtitle")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className={D.marketHeroPillMuted} aria-hidden>
                {t("market_hero_pill_match")}
              </span>
              <span
                className="pointer-events-none rounded-full border border-ref-sun/28 bg-ref-sun/10 px-3 py-1 text-meta font-medium text-ref-sun"
                aria-hidden
              >
                {t("market_hero_pill_escrow")}
              </span>
              <span
                className="pointer-events-none rounded-full border border-ref-coral/30 bg-ref-coral/12 px-3 py-1 text-meta font-medium text-ref-coral"
                aria-hidden
              >
                {t("market_hero_pill_dispute")}
              </span>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-center gap-3">
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  onCustomItineraryClick();
                }}
              >
                <button
                  type="submit"
                  className={`${TT_MARKETING_BTN_MARKET_PRIMARY_PILL} motion-sub transition-transform active:scale-[0.98]`}
                  aria-label={customItineraryLabel}
                >
                  {customItineraryLabel}
                </button>
              </form>
              {onTripDaysFilter ? (
                <div
                  className="flex flex-wrap items-center justify-center gap-2"
                  role="group"
                  aria-label={t("market_hero_quick_days_aria")}
                >
                  <span className={TT_MARKETING_MARKET_L5_HERO_META}>{t("market_hero_quick_days_label")}</span>
                  {MARKET_HERO_TRIP_DAY_PRESETS.map((d) => {
                    const active = selectedTripDays === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onTripDaysFilter(d)}
                        className={active ? D.customItineraryPillSelected : `${D.customItineraryPillIdle} ${D.drawerControlFocus}`}
                      >
                        {t("market_dayUnit").replace("{{n}}", String(d))}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(MarketPageHero);
