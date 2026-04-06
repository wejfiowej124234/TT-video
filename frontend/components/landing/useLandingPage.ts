"use client";

import { useState, useRef, useEffect } from "react";
import { postItineraryCreate, getOrder } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  dateToString,
  daysFromRange,
  ITINERARY_CARD_COUNT,
} from "./constants";

export function useLandingPage(t: (key: string) => string) {
  const [country, setCountry] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return dateToString(d);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7 + 4);
    return dateToString(d);
  });
  const days = daysFromRange(startDate, endDate);
  const [attractionTypes, setAttractionTypes] = useState<string[]>(["世界遗产"]);
  const [diningStandards, setDiningStandards] = useState<string[]>(["标准"]);
  const [hotelStandards, setHotelStandards] = useState<string[]>(["标准"]);
  const [budget, setBudget] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [numRooms, setNumRooms] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  /** 客户端校验：i18n key（`landing_error_*`） */
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);
  /** POST /itineraries / getOrder 等：已由 `mapApiReadError` 翻译的文案 */
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultOrderIds, setResultOrderIds] = useState<string[]>([]);
  /** 按「订单+卡片下标」记录解锁，避免同一订单多张卡时一点击就全解锁；key = `${orderId}-${index}` */
  const [unlockedCardKeys, setUnlockedCardKeys] = useState<Set<string>>(new Set());
  const [selectedForUnlock, setSelectedForUnlock] = useState<{ orderId: string; index: number } | null>(null);
  const [unlockPaying, setUnlockPaying] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Record<string, unknown>>({});
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const resultsSectionRef = useRef<HTMLElement>(null);
  const unlockPayGen = useRef(0);

  const toggleFavorite = (orderId: string) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  useEffect(() => {
    if (resultOrderIds.length > 0 && resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resultOrderIds.length]);

  useEffect(() => {
    if (!selectedForUnlock) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedForUnlock(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedForUnlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrorKey(null);
    setSubmitError(null);
    const budgetNum = budget ? parseFloat(budget) : undefined;
    if (budgetNum !== undefined && (isNaN(budgetNum) || budgetNum <= 0)) {
      setValidationErrorKey("landing_error_budget");
      return;
    }
    if (!country) {
      setValidationErrorKey("landing_error_country");
      return;
    }
    if (!cities.length) {
      setValidationErrorKey("landing_error_cities");
      return;
    }
    if (!startDate || !endDate) {
      setValidationErrorKey("landing_error_dates");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setValidationErrorKey("landing_error_datesOrder");
      return;
    }
    if (days < 1 || days > 30) {
      setValidationErrorKey("landing_error_days");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        destination: country,
        city: cities.length > 0 ? cities[0]! : country,
        travel_date: startDate,
        days,
        cities: cities.length > 0 ? cities : undefined,
        hotel_type: hotelStandards.join(","),
        food_preference: diningStandards.join(","),
        notes:
          attractionTypes.length > 0
            ? t("landing_notes_attraction_types").replace(/\{\{list\}\}/g, attractionTypes.join(","))
            : undefined,
        budget_min: budgetNum ? budgetNum * 0.8 : undefined,
        budget_max: budgetNum,
      };
      // 只创建 1 个订单，避免自由市场出现多张相同行程卡（53/49：一单一流程）
      const res = await postItineraryCreate(body);
      const data = res as { order_id?: string };
      const orderIdRaw = typeof data.order_id === "string" ? data.order_id.trim() : "";
      if (!orderIdRaw) {
        setValidationErrorKey("landing_error_missingOrderId");
        return;
      }
      const singleId = orderIdRaw;
      setResultOrderIds(Array(ITINERARY_CARD_COUNT).fill(singleId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "login_required" || msg === "unauthorized") {
        setSubmitError(t("landing_error_login"));
      } else {
        setSubmitError(mapApiReadError(err, t, "landing_error_request"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlockClick = (orderId: string, index: number) => {
    const key = `${orderId}-${index}`;
    if (unlockedCardKeys.has(key)) return;
    setSelectedForUnlock({ orderId, index });
  };

  const handleUnlockPay = async () => {
    if (!selectedForUnlock) return;
    const { orderId, index } = selectedForUnlock;
    const key = `${orderId}-${index}`;
    const gen = ++unlockPayGen.current;
    setUnlockPaying(true);
    try {
      const order = await getOrder(orderId);
      if (gen !== unlockPayGen.current) return;
      setOrderDetails((prev) => ({ ...prev, [orderId]: order }));
      setUnlockedCardKeys((prev) => new Set(prev).add(key));
      setSelectedForUnlock(null);
    } catch (err) {
      if (gen !== unlockPayGen.current) return;
      if (typeof window !== "undefined") {
        console.error("useLandingPage handleUnlockPay:", err);
      }
      const msg = err instanceof Error ? err.message : "";
      if (msg === "login_required" || msg === "unauthorized") {
        setSubmitError(t("landing_error_login"));
      } else {
        setSubmitError(mapApiReadError(err, t, "landing_error_request"));
      }
    } finally {
      if (gen === unlockPayGen.current) {
        setUnlockPaying(false);
      }
    }
  };

  return {
    country,
    setCountry,
    cities,
    setCities,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    days,
    attractionTypes,
    setAttractionTypes,
    diningStandards,
    setDiningStandards,
    hotelStandards,
    setHotelStandards,
    budget,
    setBudget,
    partySize,
    setPartySize,
    numRooms,
    setNumRooms,
    submitting,
    validationErrorKey,
    submitError,
    resultOrderIds,
    unlockedCardKeys,
    selectedForUnlock,
    setSelectedForUnlock,
    unlockPaying,
    orderDetails,
    favoritedIds,
    toggleFavorite,
    resultsSectionRef,
    handleSubmit,
    handleUnlockClick,
    handleUnlockPay,
  };
}
