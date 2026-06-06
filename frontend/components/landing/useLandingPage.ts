"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { postItineraryCreate, getOrder } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  hydrateLandingUnlockedOrderDetails,
} from "@/lib/landingItineraryHydrate";
import { buildLandingToMarketHref } from "@/lib/landingMarketDeepLink";
import {
  LANDING_RESULT_ORDER_IDS_KEY,
  LANDING_UNLOCKED_ORDER_IDS_KEY,
  readLandingFavoriteOrderIds,
  readLandingResultOrderIds,
  readLandingUnlockedOrderIds,
  subscribeLandingItineraryStorage,
  writeLandingFavoriteOrderIds,
  writeLandingResultOrderIds,
  writeLandingUnlockedOrderIds,
} from "@/lib/landingItinerarySession";
import { FAV_ORDERS_KEY, loadFavSet, saveFavSet } from "@/lib/marketFavoritesStorage";
import {
  hasMarketAuthSession,
  pullMarketTravelBookmarksIntoLocal,
  pushMarketOrderBookmarkToggle,
} from "@/lib/marketTravelBookmarksSync";
import {
  dateToString,
  daysFromRange,
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
  const [diningStandards, setDiningStandards] = useState<string[]>(["当地特色"]);
  const [hotelStandards, setHotelStandards] = useState<string[]>(["标准"]);
  const [budget, setBudget] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [numRooms, setNumRooms] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  /** 客户端校验：i18n key（`landing_error_*`） */
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);
  /** POST /itineraries / getOrder 等：已由 `mapApiReadError` 翻译的文案 */
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** 未登录提交：Hero 区展示登录 CTA（returnUrl=/） */
  const [loginRequired, setLoginRequired] = useState(false);
  const [resultOrderIds, setResultOrderIds] = useState<string[]>([]);
  /** 按订单 ID 记录解锁（一单一卡，整单解锁） */
  const [unlockedOrderIds, setUnlockedOrderIds] = useState<Set<string>>(new Set());
  /** 解锁弹窗内错误（与 Hero submitError 分离） */
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [selectedForUnlock, setSelectedForUnlock] = useState<{ orderId: string; index: number } | null>(null);
  const [unlockPaying, setUnlockPaying] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Record<string, unknown>>({});
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const resultsSectionRef = useRef<HTMLElement>(null);
  const unlockPayGen = useRef(0);
  const sessionHydratedRef = useRef(false);

  const marketHref = useMemo(
    () => buildLandingToMarketHref({ country, city: cities[0], days }),
    [country, cities, days],
  );

  useEffect(() => {
    if (hasMarketAuthSession()) {
      void pullMarketTravelBookmarksIntoLocal().then(() => {
        setFavoritedIds(readLandingFavoriteOrderIds());
      });
    }
  }, []);

  const toggleFavorite = useCallback((orderId: string) => {
    const prev = loadFavSet(FAV_ORDERS_KEY);
    const next = new Set(prev);
    const willFavorite = !next.has(orderId);
    if (willFavorite) next.add(orderId);
    else next.delete(orderId);
    saveFavSet(FAV_ORDERS_KEY, next);
    setFavoritedIds(next);
    void pushMarketOrderBookmarkToggle(orderId, willFavorite).catch(() => {
      saveFavSet(FAV_ORDERS_KEY, prev);
      setFavoritedIds(prev);
    });
  }, []);

  useEffect(() => {
    if (sessionHydratedRef.current) return;
    sessionHydratedRef.current = true;

    const storedResults = readLandingResultOrderIds();
    const storedUnlocked = readLandingUnlockedOrderIds();
    const storedFavorites = readLandingFavoriteOrderIds();
    if (storedResults.length > 0) setResultOrderIds(storedResults);
    if (storedUnlocked.size > 0) setUnlockedOrderIds(storedUnlocked);
    if (storedFavorites.size > 0) setFavoritedIds(storedFavorites);

    if (storedUnlocked.size === 0) return;

    let cancelled = false;
    void hydrateLandingUnlockedOrderDetails([...storedUnlocked], getOrder).then(({ details, staleIds }) => {
      if (cancelled) return;
      if (Object.keys(details).length > 0) {
        setOrderDetails((prev) => ({ ...prev, ...details }));
      }
      if (staleIds.length === 0) return;
      const stale = new Set(staleIds);
      setResultOrderIds((prev) => prev.filter((id) => !stale.has(id)));
      setUnlockedOrderIds((prev) => new Set([...prev].filter((id) => !stale.has(id))));
      setFavoritedIds((prev) => new Set([...prev].filter((id) => !stale.has(id))));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeLandingResultOrderIds(resultOrderIds);
  }, [resultOrderIds]);

  useEffect(() => {
    writeLandingUnlockedOrderIds(unlockedOrderIds);
  }, [unlockedOrderIds]);

  useEffect(() => {
    writeLandingFavoriteOrderIds(favoritedIds);
  }, [favoritedIds]);

  useEffect(() => {
    return subscribeLandingItineraryStorage((key) => {
      if (key === LANDING_RESULT_ORDER_IDS_KEY) {
        setResultOrderIds(readLandingResultOrderIds());
        return;
      }
      if (key === LANDING_UNLOCKED_ORDER_IDS_KEY) {
        const storedUnlocked = readLandingUnlockedOrderIds();
        setUnlockedOrderIds(storedUnlocked);
        if (storedUnlocked.size === 0) return;
        void hydrateLandingUnlockedOrderDetails([...storedUnlocked], getOrder).then(({ details, staleIds }) => {
          if (Object.keys(details).length > 0) {
            setOrderDetails((prev) => ({ ...prev, ...details }));
          }
          if (staleIds.length === 0) return;
          const stale = new Set(staleIds);
          setResultOrderIds((prev) => prev.filter((id) => !stale.has(id)));
          setUnlockedOrderIds((prev) => new Set([...prev].filter((id) => !stale.has(id))));
          setFavoritedIds((prev) => new Set([...prev].filter((id) => !stale.has(id))));
        });
        return;
      }
      if (key === FAV_ORDERS_KEY) {
        setFavoritedIds(readLandingFavoriteOrderIds());
      }
    });
  }, []);

  useEffect(() => {
    if ((submitting || resultOrderIds.length > 0) && resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [submitting, resultOrderIds.length]);

  useEffect(() => {
    if (!selectedForUnlock) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedForUnlock(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedForUnlock]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrorKey(null);
    setSubmitError(null);
    setLoginRequired(false);
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
        party_size: partySize,
        num_rooms: numRooms,
      };
      const res = await postItineraryCreate(body);
      const data = res as { order_id?: string };
      const orderIdRaw = typeof data.order_id === "string" ? data.order_id.trim() : "";
      if (!orderIdRaw) {
        setValidationErrorKey("landing_error_missingOrderId");
        return;
      }
      setResultOrderIds([orderIdRaw]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "login_required" || msg === "unauthorized") {
        setLoginRequired(true);
        setSubmitError(t("landing_error_login"));
      } else {
        setSubmitError(mapApiReadError(err, t, "landing_error_request"));
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    budget,
    country,
    cities,
    startDate,
    endDate,
    days,
    attractionTypes,
    diningStandards,
    hotelStandards,
    partySize,
    numRooms,
    t,
  ]);

  const handleUnlockClick = useCallback((orderId: string, index: number) => {
    if (unlockedOrderIds.has(orderId)) return;
    setUnlockError(null);
    setSelectedForUnlock({ orderId, index });
  }, [unlockedOrderIds]);

  const handleUnlockPay = useCallback(async () => {
    if (!selectedForUnlock) return;
    const { orderId } = selectedForUnlock;
    const gen = ++unlockPayGen.current;
    setUnlockPaying(true);
    setUnlockError(null);
    try {
      const order = await getOrder(orderId);
      if (gen !== unlockPayGen.current) return;
      setOrderDetails((prev) => ({ ...prev, [orderId]: order }));
      setUnlockedOrderIds((prev) => new Set(prev).add(orderId));
      setSelectedForUnlock(null);
    } catch (err) {
      if (gen !== unlockPayGen.current) return;
      if (typeof window !== "undefined") {
        console.error("useLandingPage handleUnlockPay:", err);
      }
      const msg = err instanceof Error ? err.message : "";
      if (msg === "login_required" || msg === "unauthorized") {
        setLoginRequired(true);
        setUnlockError(t("landing_error_login"));
      } else {
        setUnlockError(mapApiReadError(err, t, "landing_error_request"));
      }
    } finally {
      if (gen === unlockPayGen.current) {
        setUnlockPaying(false);
      }
    }
  }, [selectedForUnlock, t]);

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
    loginRequired,
    resultOrderIds,
    unlockedOrderIds,
    selectedForUnlock,
    setSelectedForUnlock,
    unlockPaying,
    unlockError,
    orderDetails,
    favoritedIds,
    toggleFavorite,
    resultsSectionRef,
    handleSubmit,
    handleUnlockClick,
    handleUnlockPay,
    marketHref,
  };
}
