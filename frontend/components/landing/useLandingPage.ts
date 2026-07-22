"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { postItineraryCreate, getOrder } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  hydrateLandingUnlockedOrderDetails,
  pruneLandingSessionOrderIds,
} from "@/lib/landingItineraryHydrate";
import { buildLandingToMarketHref } from "@/lib/landingMarketDeepLink";
import {
  clearCachedLandingDraftCap,
  draftQuotaFromCapError,
  fetchLandingDraftQuota,
  LANDING_DRAFT_CAP,
  type LandingDraftQuota,
} from "@/lib/landingDraftQuota";
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
  isLandingAiItineraryFormReady,
  parseLandingAiBudget,
} from "@/lib/landingAiItineraryFormReady";
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
  const [draftQuota, setDraftQuota] = useState<LandingDraftQuota>({
    count: 0,
    cap: LANDING_DRAFT_CAP,
    blocked: false,
  });
  const [resultOrderIds, setResultOrderIds] = useState<string[]>([]);
  /**
   * 本会话内主动点击「AI 生成行程」且创建成功后才为 true。
   * 会话恢复的 orderId 不单独解锁真卡（避免未填表即露出订单入口）。
   */
  const [aiGenerateCommitted, setAiGenerateCommitted] = useState(false);
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

  const refreshDraftQuota = useCallback(() => {
    if (!hasMarketAuthSession()) {
      setDraftQuota({ count: 0, cap: LANDING_DRAFT_CAP, blocked: false });
      return;
    }
    void fetchLandingDraftQuota().then(setDraftQuota);
  }, []);

  useEffect(() => {
    refreshDraftQuota();
  }, [refreshDraftQuota]);

  useEffect(() => {
    const onFocus = () => refreshDraftQuota();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshDraftQuota]);

  useEffect(() => {
    if (!validationErrorKey) return;
    if (validationErrorKey === "landing_error_country" && country) {
      setValidationErrorKey(null);
      return;
    }
    if (validationErrorKey === "landing_error_cities" && cities.length > 0) {
      setValidationErrorKey(null);
      return;
    }
    if (validationErrorKey === "landing_error_dates" && startDate && endDate) {
      setValidationErrorKey(null);
      return;
    }
    if (validationErrorKey === "landing_error_datesOrder" && startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      setValidationErrorKey(null);
      return;
    }
    if (validationErrorKey === "landing_error_days" && days >= 1 && days <= 30) {
      setValidationErrorKey(null);
      return;
    }
    if (validationErrorKey === "landing_error_budget") {
      const budgetNum = budget ? parseFloat(budget) : undefined;
      if (budgetNum === undefined || (!Number.isNaN(budgetNum) && budgetNum > 0)) {
        setValidationErrorKey(null);
      }
    }
  }, [validationErrorKey, country, cities, startDate, endDate, days, budget]);

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

    const idsToVerify = [...new Set([...storedResults, ...storedUnlocked])];
    if (idsToVerify.length === 0 || !hasMarketAuthSession()) return;

    let cancelled = false;
    void hydrateLandingUnlockedOrderDetails(idsToVerify, getOrder).then(({ details, staleIds }) => {
      if (cancelled) return;
      if (Object.keys(details).length > 0) {
        setOrderDetails((prev) => ({ ...prev, ...details }));
      }
      if (staleIds.length === 0) return;
      const pruned = pruneLandingSessionOrderIds(storedResults, storedUnlocked, storedFavorites, staleIds);
      setResultOrderIds(pruned.resultOrderIds);
      setUnlockedOrderIds(pruned.unlockedOrderIds);
      setFavoritedIds(pruned.favoritedIds);
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
        const storedResults = readLandingResultOrderIds();
        const storedFavorites = readLandingFavoriteOrderIds();
        setUnlockedOrderIds(storedUnlocked);
        const idsToVerify = [...new Set([...storedResults, ...storedUnlocked])];
        if (idsToVerify.length === 0 || !hasMarketAuthSession()) return;
        void hydrateLandingUnlockedOrderDetails(idsToVerify, getOrder).then(({ details, staleIds }) => {
          if (Object.keys(details).length > 0) {
            setOrderDetails((prev) => ({ ...prev, ...details }));
          }
          if (staleIds.length === 0) return;
          const pruned = pruneLandingSessionOrderIds(storedResults, storedUnlocked, storedFavorites, staleIds);
          setResultOrderIds(pruned.resultOrderIds);
          setUnlockedOrderIds(pruned.unlockedOrderIds);
          setFavoritedIds(pruned.favoritedIds);
        });
        return;
      }
      if (key === FAV_ORDERS_KEY) {
        setFavoritedIds(readLandingFavoriteOrderIds());
      }
    });
  }, []);

  /** 仅在用户主动「生成」后滚到结果区；会话恢复 / 首屏进入定制旅行须停在页顶（勿跳到官方精选或结果） */
  const prevSubmittingRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (!hash || hash === "form" || hash === "hero") {
      try {
        history.scrollRestoration = "manual";
      } catch {
        /* noop */
      }
      window.scrollTo(0, 0);
    }
  }, []);
  useEffect(() => {
    const justStartedSubmit = submitting && !prevSubmittingRef.current;
    const justFinishedSubmit =
      !submitting && prevSubmittingRef.current && resultOrderIds.length > 0;
    prevSubmittingRef.current = submitting;
    if (!(justStartedSubmit || justFinishedSubmit)) return;
    if (!resultsSectionRef.current) return;
    resultsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const budgetNum = parseLandingAiBudget(budget);
    if (budgetNum == null) {
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
    if (!Number.isFinite(partySize) || partySize < 1) {
      setValidationErrorKey("landing_error_party");
      return;
    }
    if (
      !isLandingAiItineraryFormReady({
        country,
        cities,
        startDate,
        endDate,
        partySize,
        budget,
      })
    ) {
      setValidationErrorKey("landing_error_form_incomplete");
      return;
    }
    if (draftQuota.blocked) {
      setValidationErrorKey("landing_error_draft_cap");
      return;
    }
    setAiGenerateCommitted(false);
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
        budget_min: budgetNum * 0.8,
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
      setAiGenerateCommitted(true);
      clearCachedLandingDraftCap();
      refreshDraftQuota();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "login_required" || msg === "unauthorized") {
        setLoginRequired(true);
        setSubmitError(t("landing_error_login"));
      } else if (msg === "draft_cap_exceeded") {
        setValidationErrorKey("landing_error_draft_cap");
        setDraftQuota((prev) => {
          const next = draftQuotaFromCapError(err);
          return {
            ...next,
            visibleCount: prev.visibleCount,
          };
        });
      } else if (msg === "in_progress_cap_exceeded") {
        setValidationErrorKey("landing_error_in_progress_cap");
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
    draftQuota.blocked,
    refreshDraftQuota,
  ]);

  const formReady = isLandingAiItineraryFormReady({
    country,
    cities,
    startDate,
    endDate,
    partySize,
    budget,
  });
  /** 未齐条件：磨砂锁；齐条件后仍须本会话 generate 成功才露真卡 */
  const previewLocked = !formReady;
  const showLiveAiResults =
    formReady && aiGenerateCommitted && resultOrderIds.length > 0;

  const handleUnlockClick = useCallback((orderId: string, index: number) => {
    if (
      !isLandingAiItineraryFormReady({
        country,
        cities,
        startDate,
        endDate,
        partySize,
        budget,
      })
    ) {
      return;
    }
    if (!aiGenerateCommitted) return;
    if (unlockedOrderIds.has(orderId)) return;
    setUnlockError(null);
    setSelectedForUnlock({ orderId, index });
  }, [
    unlockedOrderIds,
    country,
    cities,
    startDate,
    endDate,
    partySize,
    budget,
    aiGenerateCommitted,
  ]);

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
    draftQuota,
    refreshDraftQuota,
    resultOrderIds,
    unlockedOrderIds,
    previewLocked,
    showLiveAiResults,
    formReady,
    aiGenerateCommitted,
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
