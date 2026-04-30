import type { MarketView } from "@/components/market/ViewSwitcher";
import { CITIES_BY_COUNTRY, LANGUAGES_BY_COUNTRY, SERVICE_TYPE_OPTIONS } from "@/lib/geoOptions";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";

function countrySummaryLabel(t: LocaleTranslateFn, countryZh: string): string {
  const row = PRODUCT_COUNTRIES.find((c) => c.nameZh === countryZh);
  return row ? t(row.guideRegisterLabelKey) : countryZh;
}

function guideFilterLabels(country: string, languages: string[], serviceTypes: string[]): string[] {
  const langOpts = LANGUAGES_BY_COUNTRY[country] ?? [];
  const langLabels = languages.map((code) => langOpts.find((o) => o.value === code)?.label ?? code);
  const svcLabels = serviceTypes.map((v) => SERVICE_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v);
  return [...langLabels, ...svcLabels];
}

function buildSides(
  t: LocaleTranslateFn,
  args: {
    country: string;
    city: string;
    languages: string[];
    serviceTypes: string[];
  },
): { orderSide: string; guideSide: string } {
  const sep = t("market_travel_summary_sep");
  const orderSide = !args.country
    ? t("market_travel_summary_orders_any")
    : (() => {
        const cLab = countrySummaryLabel(t, args.country);
        if (!args.city) return cLab;
        const cityRow = CITIES_BY_COUNTRY[args.country]?.find((c) => c.value === args.city);
        return `${cLab}${sep}${cityRow?.label ?? args.city}`;
      })();

  const guideSide = !args.country
    ? t("market_travel_summary_guides_need_country")
    : (() => {
        const labels = guideFilterLabels(args.country, args.languages, args.serviceTypes);
        if (labels.length === 0) return t("market_travel_summary_guides_open");
        if (labels.length <= 2) return labels.join(sep);
        return t("market_travel_summary_guides_picked", { n: labels.length });
      })();

  return { orderSide, guideSide };
}

/** 两行摘要：上行筛选口径，下行布局/排序/条数（窄屏更易扫读）。 */
export function formatMarketTravelFilterSummaryBlocks(
  t: LocaleTranslateFn,
  args: {
    country: string;
    city: string;
    languages: string[];
    serviceTypes: string[];
    view: MarketView;
    sortBy: "latest" | "priceDesc" | "priceAsc";
    orderCount: number;
    guideCount: number;
  },
): { filterLine: string; listLine: string } {
  const { orderSide, guideSide } = buildSides(t, args);
  const viewLabel =
    args.view === "split" ? t("view_split") : args.view === "orders" ? t("view_orders") : t("view_guides");
  const sortLabel =
    args.sortBy === "latest"
      ? t("market_sort_latest")
      : args.sortBy === "priceDesc"
        ? t("market_sort_priceDesc")
        : t("market_sort_priceAsc");

  const filterLine = t("market_travel_filter_summary_filters", { orderSide, guideSide });

  const listLine = t("market_travel_filter_summary_list_meta", {
    view: viewLabel,
    sort: sortLabel,
    orderCount: args.orderCount,
    guideCount: args.guideCount,
  });

  return { filterLine, listLine };
}

/** 单行完整摘要（兼容旧文案/测试）。 */
export function formatMarketTravelFilterSummaryLine(
  t: LocaleTranslateFn,
  args: {
    country: string;
    city: string;
    languages: string[];
    serviceTypes: string[];
    view: MarketView;
    sortBy: "latest" | "priceDesc" | "priceAsc";
    orderCount: number;
    guideCount: number;
  },
): string {
  const { orderSide, guideSide } = buildSides(t, args);
  const viewLabel =
    args.view === "split" ? t("view_split") : args.view === "orders" ? t("view_orders") : t("view_guides");
  const sortLabel =
    args.sortBy === "latest"
      ? t("market_sort_latest")
      : args.sortBy === "priceDesc"
        ? t("market_sort_priceDesc")
        : t("market_sort_priceAsc");

  return t("market_travel_filter_summary_line", {
    orderSide,
    guideSide,
    view: viewLabel,
    sort: sortLabel,
    orderCount: args.orderCount,
    guideCount: args.guideCount,
  });
}
