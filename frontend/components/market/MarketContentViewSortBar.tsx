"use client";



import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";

import ViewSwitcher from "@/components/market/ViewSwitcher";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

import type { MarketPageSortKey } from "@/lib/marketPageQuery";



const D = TT_MARKETING_MARKET_DARK_PATH;

import type { MarketSortBy } from "./marketContentModel";



type Props = {

  view: "split" | "orders" | "guides";

  setP29View: (v: "split" | "orders" | "guides") => void;

  sortBy: MarketSortBy;

  setSortBy: (v: MarketSortBy) => void;

};



function sortOptionLabel(t: (k: string) => string, view: Props["view"], value: MarketPageSortKey): string {

  if (value === "latest") return t("market_sort_latest");

  if (view === "guides") {

    return value === "priceDesc" ? t("market_sort_priceDesc_guides") : t("market_sort_priceAsc_guides");

  }

  if (view === "orders") {

    return value === "priceDesc" ? t("market_sort_priceDesc_orders") : t("market_sort_priceAsc_orders");

  }

  return value === "priceDesc" ? t("market_sort_priceDesc_split") : t("market_sort_priceAsc_split");

}



/** 双栏视图切换 + 排序（`/market` SSOT · 布局冻结） */

export function MarketContentViewSortBar({ view, setP29View, sortBy, setSortBy }: Props) {

  const { t } = useTranslation();

  const sortGroupId = useId();

  const options: MarketPageSortKey[] = ["latest", "priceDesc", "priceAsc"];



  return (

    <div

      className="flex flex-wrap items-center justify-between gap-4 mb-4"

      data-tt-market-p29-view={view}

      data-testid="market-view-sort-bar"

    >

      <ViewSwitcher value={view} onChange={setP29View} glass />

      <div className="flex items-center gap-2">

        <span id={sortGroupId} className={`${D.filterLabelGlass} text-meta font-medium`}>

          {t("market_sort_label")}

        </span>

        <div

          className="flex flex-wrap gap-1.5"

          role="radiogroup"

          aria-labelledby={sortGroupId}

        >

          {options.map((value) => (

            <button

              key={value}

              type="button"

              role="radio"

              aria-checked={sortBy === value}

              onClick={() => setSortBy(value)}

              className={`${touchTargetLink44Classes} ${D.marketSortPillBase} ${

                sortBy === value ? D.marketSortPillActive : D.marketSortPillIdle

              }`}

            >

              {sortOptionLabel(t, view, value)}

            </button>

          ))}

        </div>

      </div>

    </div>

  );

}

