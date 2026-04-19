/**
 * 行程弹窗提交逻辑：校验 + 构建 OrderCardItem（旅行者/向导）；49 A 构建 API 请求体。
 * 纯函数，供 useItineraryForm 的 handleSubmit 调用。
 * 旅行者侧提交时带上景区/美食/酒店配图，与行程单展示一致。
 */

import type { OrderCardItem } from "@/lib/marketTypes";
import type { CustomItineraryBody } from "@/lib/apiClient";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import { DEFAULT_COUNTRY, getPricingForCountry } from "@/lib/countries";
import { getAttractionDetails, getFoodDetails, getHotelDetails } from "@/lib/cityDetails";
import type { CustomItineraryForm, DayPlan, GuideDayPlan } from "./types";
import { MAX_AMOUNT } from "./constants";

export type TFunction = (key: string) => string;

const clampAmount = (n: number) => Math.min(MAX_AMOUNT, Math.round(n * 100) / 100);

/** 向导创建：校验并构建订单项 */
export function validateAndBuildGuide(
  form: CustomItineraryForm,
  t: TFunction,
  accountAvatarUrl: string
): { error: string } | { item: OrderCardItem } {
  const amountStr = form.amount.trim();
  if (!amountStr) return { error: t("market_pleaseFillRequired") };
  const daysNum = Math.max(1, Math.min(30, form.totalDays));
  const headcount = Math.min(20, Math.max(1, Number(form.headcount) || 1));
  const amountNum = parseFloat(amountStr.replace(/,/g, ""));
  if (isNaN(amountNum) || amountNum <= 0) return { error: t("market_budgetInvalid") };
  if (amountNum > MAX_AMOUNT) return { error: t("market_budgetTooLarge") };

  const plans = form.guideDayPlans ?? [];
  const dest = form.title.trim() || (plans[0] as GuideDayPlan | undefined)?.city?.trim() || form.country?.trim() || "";
  const title = form.title.trim() || dest;
  const dayHighlights = plans
    .slice(0, daysNum)
    .map((p, i) => {
      const parts = [(p as GuideDayPlan).attractions?.trim(), (p as GuideDayPlan).food?.trim(), (p as GuideDayPlan).hotel?.trim()].filter(Boolean);
      return parts.length ? `${t("market_dayN").replace("{n}", String(i + 1))}: ${parts.join(" · ")}`.slice(0, 120) : null;
    })
    .filter((s): s is string => !!s);
  const descLine = form.description.trim().slice(0, 200);
  const highlights = descLine ? [descLine, ...dayHighlights] : dayHighlights.length ? dayHighlights : undefined;
  const mainImage = form.image.trim() || accountAvatarUrl || undefined;
  const firstDayCity = (plans[0] as GuideDayPlan | undefined)?.city?.trim() ?? "";

  const item: OrderCardItem = {
    id: `guide-${Date.now()}`,
    destination: dest,
    country: form.country?.trim() ?? "",
    city: firstDayCity,
    days: daysNum,
    amount: String(clampAmount(amountNum)),
    currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    status: "draft",
    image: mainImage,
    highlights: highlights?.length ? highlights : undefined,
    headcount,
  };
  return { item };
}

/** 旅行者创建：校验并构建订单项 */
export function validateAndBuildTourist(
  form: CustomItineraryForm,
  t: TFunction,
  accountAvatarUrl: string,
  suggestedTransportFee: number
): { error: string } | { item: OrderCardItem } {
  const country = form.country.trim();
  const hasAllCities = form.dayPlans.every((d) => d.city.trim() !== "");
  const amountStr = form.amount.trim();
  if (!country || !hasAllCities || !amountStr) return { error: t("market_pleaseFillRequired") };

  const daysNum = form.totalDays;
  if (daysNum < 1 || daysNum > 30) return { error: t("market_daysInvalid") };
  const headcount = Math.min(20, Math.max(1, Number(form.headcount) || 1));
  if (headcount < 1 || headcount > 20) return { error: t("market_headcountInvalid") };

  const amount = amountStr.replace(/,/g, "");
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) return { error: t("market_budgetInvalid") };
  if (amountNum > MAX_AMOUNT) return { error: t("market_budgetTooLarge") };

  const firstCity = form.dayPlans[0]?.city || "";
  const suggestedGuideFee =
    (getPricingForCountry(form.country || DEFAULT_COUNTRY).guideLevelsSuggestedPerDay[form.needGuide] ?? 0) * form.totalDays;
  const guideFeeNum = suggestedGuideFee;
  const transportFeeNum = suggestedTransportFee > 0 ? suggestedTransportFee : undefined;
  if (guideFeeNum < 0 || (transportFeeNum != null && transportFeeNum < 0)) return { error: t("market_budgetInvalid") };
  if (guideFeeNum > MAX_AMOUNT || (transportFeeNum != null && transportFeeNum > MAX_AMOUNT)) return { error: t("market_budgetTooLarge") };

  const title =
    form.title.trim() || t("market_defaultTitle").replace("{{city}}", firstCity).replace("{{days}}", String(form.totalDays));
  const destination =
    form.dayPlans
      .map((d) => d.city)
      .filter(Boolean)
      .join(" → ") || title;
  const sep = t("market_listSeparator");
  const highlights = form.dayPlans.map((d: DayPlan) => {
    const parts = [d.city];
    if (d.attractions.length) parts.push(t("market_highlightAttractions") + d.attractions.join(sep));
    if (d.food.length) parts.push(t("market_highlightFood") + d.food.join(sep));
    if (d.hotel) parts.push(t("market_highlightHotel") + d.hotel);
    return parts.join(" · ");
  });
  const transportLegs: { from: string; to: string; type: "vehicle" | "rail" | "flight" }[] = [];
  for (let i = 1; i < form.dayPlans.length; i++) {
    const fromCity = form.dayPlans[i - 1]?.city?.trim();
    const toCity = form.dayPlans[i]?.city?.trim();
    if (fromCity && toCity && fromCity !== toCity) {
      transportLegs.push({
        from: fromCity,
        to: toCity,
        type: form.dayPlans[i]?.transport ?? "rail",
      });
    }
  }
  const hasGuideFee = guideFeeNum > 0;
  const hasTransportFee = transportFeeNum != null && !isNaN(transportFeeNum) && transportFeeNum >= 0;
  const breakdown =
    hasGuideFee || hasTransportFee
      ? {
          guideFee: hasGuideFee ? clampAmount(guideFeeNum) : undefined,
          carFee: hasTransportFee ? clampAmount(transportFeeNum) : undefined,
        }
      : undefined;
  const cityTransports = form.dayPlans.map((d) => d.cityTransport).filter((x): x is NonNullable<typeof x> => x != null);
  const coverImage = form.image.trim() || accountAvatarUrl || undefined;

  const item: OrderCardItem = {
    id: `custom-${Date.now()}`,
    destination,
    country,
    city: firstCity,
    days: daysNum,
    amount: String(clampAmount(amountNum)),
    currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    status: "draft",
    image: coverImage,
    highlights: highlights.length ? highlights : undefined,
    headcount,
    breakdown: breakdown ?? undefined,
    transportLegs: transportLegs.length ? transportLegs : undefined,
    cityTransports: cityTransports.length ? cityTransports : undefined,
    guideLevel: form.needGuide,
  };
  return { item };
}

/** 49 A.7：旅行者表单 → POST /itineraries/custom 请求体（调用前需已通过 validateAndBuildTourist） */
export function buildTouristCustomBody(
  form: CustomItineraryForm,
  suggestedTransportFee: number
): CustomItineraryBody {
  const amountStr = form.amount.trim().replace(/,/g, "");
  const amountNum = parseFloat(amountStr) || 0;
  const daysNum = Math.max(1, Math.min(30, form.totalDays));
  const headcount = Math.min(20, Math.max(1, Number(form.headcount) || 1));
  const suggestedGuideFee =
    (getPricingForCountry(form.country || DEFAULT_COUNTRY).guideLevelsSuggestedPerDay[form.needGuide] ?? 0) * form.totalDays;
  const transportFeeNum = suggestedTransportFee > 0 ? suggestedTransportFee : undefined;
  const breakdown =
    suggestedGuideFee > 0 || (transportFeeNum != null && transportFeeNum >= 0)
      ? {
          guide_fee: suggestedGuideFee > 0 ? suggestedGuideFee : undefined,
          car_fee: transportFeeNum != null && transportFeeNum >= 0 ? transportFeeNum : undefined,
        }
      : undefined;
  const transportLegs: { from: string; to: string; type?: string }[] = [];
  for (let i = 1; i < form.dayPlans.length; i++) {
    const fromCity = form.dayPlans[i - 1]?.city?.trim();
    const toCity = form.dayPlans[i]?.city?.trim();
    if (fromCity && toCity && fromCity !== toCity) {
      transportLegs.push({
        from: fromCity,
        to: toCity,
        type: form.dayPlans[i]?.transport ?? "rail",
      });
    }
  }
  return {
    creator_type: "tourist",
    country: form.country?.trim() ?? "",
    total_days: daysNum,
    amount: amountNum,
    currency: "USD",
    title: form.title.trim() || undefined,
    description: form.description.trim() || undefined,
    image: form.image.trim() || undefined,
    headcount,
    day_plans: form.dayPlans.slice(0, daysNum).map((d) => {
      const attractionDetails = getAttractionDetails(d.city);
      const foodDetails = getFoodDetails(d.city);
      const hotelDetails = getHotelDetails(d.city);
      const attractions = (d.attractions ?? []).map((value) => {
        const detail = attractionDetails.find((a) => a.value === value);
        return detail ? { name: detail.label, image: detail.image } : { name: value, image: undefined as string | undefined };
      });
      const food = (d.food ?? []).map((value) => {
        const detail = foodDetails.find((f) => f.value === value);
        return detail ? { name: detail.label, image: detail.image } : { name: value, image: undefined as string | undefined };
      });
      const hotel = d.hotel
        ? (() => {
            const detail = hotelDetails.find((h) => h.value === d.hotel);
            return detail ? { name: detail.label, image: detail.image } : { name: d.hotel, image: undefined as string | undefined };
          })()
        : undefined;
      return {
        city: d.city,
        attractions,
        food,
        hotel,
        city_transport: d.cityTransport,
        transport: d.transport,
      };
    }),
    need_guide: form.needGuide || undefined,
    breakdown,
    transport_legs: transportLegs.length ? transportLegs : undefined,
  };
}

/** 49 A.7：向导表单 → POST /itineraries/custom 请求体（调用前需已通过 validateAndBuildGuide）；含当日景区/美食配图 */
export function buildGuideCustomBody(form: CustomItineraryForm): CustomItineraryBody {
  const amountStr = form.amount.trim().replace(/,/g, "");
  const amountNum = parseFloat(amountStr) || 0;
  const daysNum = Math.max(1, Math.min(30, form.totalDays));
  const headcount = Math.min(20, Math.max(1, Number(form.headcount) || 1));
  const plans = form.guideDayPlans ?? [];
  return {
    creator_type: "guide",
    country: form.country?.trim() ?? "",
    total_days: daysNum,
    amount: amountNum,
    currency: "USD",
    title: form.title.trim() || undefined,
    description: form.description.trim() || undefined,
    image: form.image.trim() || undefined,
    headcount,
    guide_day_plans: plans.slice(0, daysNum).map((p) => ({
      city: (p as GuideDayPlan).city ?? "",
      attractions: (p as GuideDayPlan).attractions ?? "",
      food: (p as GuideDayPlan).food ?? "",
      hotel: (p as GuideDayPlan).hotel ?? "",
      attraction_image: (p as GuideDayPlan).attractionImage?.trim() || undefined,
      food_image: (p as GuideDayPlan).foodImage?.trim() || undefined,
    })),
  };
}
