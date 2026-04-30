"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import {
  ACQUISITION_CATEGORY_SLUGS,
  MARKET_SUBSITE_COUNTRY_STORAGE,
  MERCHANT_CATEGORY_SLUGS,
  parseAcquisitionCategoryParam,
  parseAcquisitionSortParam,
  parseCountryParam,
  parseMerchantCategoryParam,
  parseMerchantSortParam,
  type MarketSubsiteCountryParam,
} from "@/lib/marketSubsiteFilters";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

type Variant = "provider" | "acquisition";

const pillBase =
  `${touchTargetLink44Classes} shrink-0 rounded-[var(--radius-sm)] border px-3 py-2 text-small font-semibold text-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 `;

function pillActive(active: boolean) {
  return active
    ? "border-white/35 bg-white text-slate-900 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] ring-1 ring-black/10"
    : "border-white/30 bg-white/10 text-slate-50 hover:border-white/45 hover:bg-white/[0.14] hover:text-white " + travelFocusRingCoreOffset2Classes;
}

export type MarketSubsiteListSummaryMode = "postgres_catalog" | "demo_client" | "no_catalog";

type Props = {
  variant: Variant;
  /** 当前筛选结果条数 */
  resultCount: number;
  /** 与 `MarketStandaloneBusinessPage` 目录 SSOT 对齐，避免 PG 目录仍显示「演示」摘要 */
  listSummaryMode: MarketSubsiteListSummaryMode;
};

export default function MarketSubsiteFilterBar({ variant, resultCount, listSummaryMode }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const didHydrateCountry = useRef(false);

  const country = parseCountryParam(searchParams.get("country"));
  const categoryMerchant = parseMerchantCategoryParam(searchParams.get("category"));
  const categoryAcquisition = parseAcquisitionCategoryParam(searchParams.get("category"));
  const sortMerchant = parseMerchantSortParam(searchParams.get("sort"));
  const sortAcquisition = parseAcquisitionSortParam(searchParams.get("sort"));

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === "all") next.delete(k);
        else next.set(k, v);
      }
      const q = next.toString();
      router.replace(buildPathnameSearchHref(pathname, q), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** 推荐 B：无 URL 参数时从 localStorage 恢复一次国家偏好 */
  useEffect(() => {
    if (typeof window === "undefined" || didHydrateCountry.current) return;
    const existing = new URLSearchParams(window.location.search).get("country");
    if (existing) {
      didHydrateCountry.current = true;
      return;
    }
    try {
      const raw = localStorage.getItem(MARKET_SUBSITE_COUNTRY_STORAGE[variant]);
      const c = parseCountryParam(raw);
      if (c !== "all") {
        const next = new URLSearchParams(searchParams?.toString() ?? "");
        next.set("country", c);
        const q = next.toString();
        router.replace(buildPathnameSearchHref(pathname, q), { scroll: false });
      }
    } catch {
      /* ignore */
    }
    didHydrateCountry.current = true;
  }, [pathname, router, searchParams, variant]);

  const pickCountry = (c: MarketSubsiteCountryParam) => {
    if (c === "all") {
      try {
        localStorage.removeItem(MARKET_SUBSITE_COUNTRY_STORAGE[variant]);
      } catch {
        /* ignore */
      }
      setParams({ country: null });
      return;
    }
    try {
      localStorage.setItem(MARKET_SUBSITE_COUNTRY_STORAGE[variant], c);
    } catch {
      /* ignore */
    }
    setParams({ country: c });
  };

  const resetAll = () => {
    try {
      localStorage.removeItem(MARKET_SUBSITE_COUNTRY_STORAGE[variant]);
    } catch {
      /* ignore */
    }
    router.replace(pathname, { scroll: false });
  };

  const isProvider = variant === "provider";
  const category = isProvider ? categoryMerchant : categoryAcquisition;
  const sort = isProvider ? sortMerchant : sortAcquisition;

  const countryRow = PRODUCT_COUNTRIES.find((c) => c.iso === country);
  const countryLabel =
    country === "all" || !countryRow ? t("market_subsite_filter_country_all") : t(countryRow.guideRegisterLabelKey);

  const categoryLabel =
    category === "all"
      ? t("market_subsite_filter_category_all")
      : t(isProvider ? `market_subsite_m_cat_${category}` : `market_subsite_a_cat_${category}`);

  const sortLabelKey = isProvider
    ? sort === "recent"
      ? "market_subsite_sort_recent"
      : sort === "price_asc"
        ? "market_subsite_sort_price_asc"
        : "market_subsite_sort_price_desc"
    : sort === "recent"
      ? "market_subsite_sort_recent"
      : "market_subsite_sort_bounty_desc";
  const sortLabel = t(sortLabelKey);

  return (
    <div data-testid="market-subsite-filter-bar" className="space-y-3 px-4 py-3 supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-small font-semibold uppercase tracking-wide text-cyan-200">
            {t("market_subsite_filter_band_title")}
          </span>
          <button
            type="button"
            onClick={resetAll}
            className={`${touchTargetLink44Classes} text-meta font-medium text-white/90 underline decoration-amber-400/50 underline-offset-4 hover:text-white ${travelFocusRingCoreOffset2Classes}`}
          >
            {t("market_subsite_filter_reset")}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-small font-semibold text-slate-200">{t("market_subsite_filter_country_label")}</p>
          <div
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={t("market_subsite_filter_country_aria")}
          >
            <button
              type="button"
              aria-pressed={country === "all"}
              onClick={() => pickCountry("all")}
              className={pillBase + pillActive(country === "all")}
            >
              {t("market_subsite_filter_country_all")}
            </button>
            {PRODUCT_COUNTRIES.map((c) => (
              <button
                key={c.iso}
                type="button"
                aria-pressed={country === c.iso}
                onClick={() => pickCountry(c.iso)}
                className={pillBase + pillActive(country === c.iso)}
              >
                {t(c.guideRegisterLabelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <div className="space-y-2">
            <p className="text-small font-semibold text-slate-200">{t("market_subsite_filter_category_label")}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("market_subsite_filter_category_aria")}>
            <button
              type="button"
              aria-pressed={category === "all"}
              onClick={() => setParams({ category: null })}
              className={pillBase + pillActive(category === "all")}
            >
              {t("market_subsite_filter_category_all")}
            </button>
            {(isProvider ? MERCHANT_CATEGORY_SLUGS : ACQUISITION_CATEGORY_SLUGS).map((slug) => (
              <button
                key={slug}
                type="button"
                aria-pressed={category === slug}
                onClick={() => setParams({ category: slug })}
                className={pillBase + pillActive(category === slug)}
              >
                {t(isProvider ? `market_subsite_m_cat_${slug}` : `market_subsite_a_cat_${slug}`)}
              </button>
            ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-small font-semibold text-slate-200">{t("market_subsite_filter_sort_label")}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("market_subsite_filter_sort_aria")}>
            {isProvider ? (
              <>
                <button
                  type="button"
                  aria-pressed={sortMerchant === "recent"}
                  onClick={() => setParams({ sort: "recent" })}
                  className={pillBase + pillActive(sortMerchant === "recent")}
                >
                  {t("market_subsite_sort_recent")}
                </button>
                <button
                  type="button"
                  aria-pressed={sortMerchant === "price_asc"}
                  onClick={() => setParams({ sort: "price_asc" })}
                  className={pillBase + pillActive(sortMerchant === "price_asc")}
                >
                  {t("market_subsite_sort_price_asc")}
                </button>
                <button
                  type="button"
                  aria-pressed={sortMerchant === "price_desc"}
                  onClick={() => setParams({ sort: "price_desc" })}
                  className={pillBase + pillActive(sortMerchant === "price_desc")}
                >
                  {t("market_subsite_sort_price_desc")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-pressed={sortAcquisition === "recent"}
                  onClick={() => setParams({ sort: "recent" })}
                  className={pillBase + pillActive(sortAcquisition === "recent")}
                >
                  {t("market_subsite_sort_recent")}
                </button>
                <button
                  type="button"
                  aria-pressed={sortAcquisition === "bounty_desc"}
                  onClick={() => setParams({ sort: "bounty_desc" })}
                  className={pillBase + pillActive(sortAcquisition === "bounty_desc")}
                >
                  {t("market_subsite_sort_bounty_desc")}
                </button>
              </>
            )}
            </div>
          </div>
        </div>

        <p className="text-left text-small leading-relaxed text-slate-200" aria-live="polite">
          {t(
            listSummaryMode === "postgres_catalog"
              ? "market_subsite_filter_summary_line_catalog"
              : listSummaryMode === "demo_client"
                ? "market_subsite_filter_summary_line"
                : "market_subsite_filter_summary_line_offline",
            {
              country: countryLabel,
              category: categoryLabel,
              sort: sortLabel,
              count: resultCount,
            },
          )}
        </p>
    </div>
  );
}
