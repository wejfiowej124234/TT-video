"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { getMe } from "@/lib/apiClient";
import type { AttractionDetail, FoodDetail, HotelDetail } from "@/lib/cityDetails";
import type { CityTransportType, CustomItineraryForm, DayPlan, GuideDayPlan } from "./types";
import { defaultForm, defaultDayPlan, defaultGuideDayPlan } from "./types";
import { DEFAULT_COUNTRY, getPricingForCountry } from "@/lib/countries";
import { useQuoteCalculation } from "./useQuoteCalculation";
import { postItineraryCustom } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { validateAndBuildGuide, validateAndBuildTourist, buildTouristCustomBody, buildGuideCustomBody } from "./itinerarySubmitLogic";
import { isUuidString } from "@/lib/isUuidString";

export interface UseItineraryFormProps {
  open: boolean;
  onClose: () => void;
  /** 49 A：提交成功后回调，传入后端返回的 order_id */
  onSuccess: (orderId: string) => void;
  /** 深链：与 `/itinerary/new?guide_id=` 一致，写入 POST /itineraries/custom */
  preselectedGuideId?: string;
}

function withGuideId<T extends object>(body: T, guideId?: string): T & { guide_id?: string } {
  const g = guideId?.trim();
  if (!g || !isUuidString(g)) return body;
  return { ...body, guide_id: g };
}

export function useItineraryForm({ open, onClose, onSuccess, preselectedGuideId }: UseItineraryFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CustomItineraryForm>(() => defaultForm(5));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewingAttraction, setViewingAttraction] = useState<AttractionDetail | null>(null);
  const [viewingFood, setViewingFood] = useState<FoodDetail | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<CityTransportType | null>(null);
  const [viewingHotel, setViewingHotel] = useState<HotelDetail | null>(null);
  const [viewingGuideImage, setViewingGuideImage] = useState<{ label: string; url: string } | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [coverFileTooBig, setCoverFileTooBig] = useState(false);

  const submitErrorRef = useRef<HTMLParagraphElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const attractionOverlayRef = useRef<HTMLDivElement>(null);
  const viewingAttractionRef = useRef<AttractionDetail | null>(null);
  const userHasEditedBudgetRef = useRef(false);
  const guideHasEditedAmountRef = useRef(false);

  const quote = useQuoteCalculation(form);
  const {
    suggestedTransportFee,
    guideQuoteBreakdown,
    budgetBreakdown,
  } = quote;

  const scrollToSubmitError = useCallback(() => {
    setTimeout(() => submitErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
  }, []);

  const setTotalDays = useCallback((days: number) => {
    setForm((f) => {
      const current = f.dayPlans;
      const nextPlans = Array.from({ length: days }, (_, i) =>
        i < current.length ? current[i] : defaultDayPlan()
      );
      const next: CustomItineraryForm = { ...f, totalDays: days, dayPlans: nextPlans };
      const suggestedPerDay = getPricingForCountry(f.country || DEFAULT_COUNTRY).guideLevelsSuggestedPerDay[f.needGuide];
      if (suggestedPerDay != null) next.guideFee = String(suggestedPerDay * days);
      return next;
    });
  }, []);

  const setDayPlan = useCallback((dayIndex: number, patch: Partial<DayPlan>) => {
    setForm((f) => {
      const next = [...f.dayPlans];
      next[dayIndex] = { ...next[dayIndex], ...patch };
      return { ...f, dayPlans: next };
    });
  }, []);

  const setGuideDayPlan = useCallback((dayIndex: number, patch: Partial<GuideDayPlan>) => {
    setForm((f) => {
      const next = [...(f.guideDayPlans ?? [])];
      while (next.length <= dayIndex) next.push(defaultGuideDayPlan());
      next[dayIndex] = { ...next[dayIndex], ...patch };
      return { ...f, guideDayPlans: next };
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm(defaultForm(5));
    setSubmitError(null);
    setSubmitting(false);
    setCoverFileTooBig(false);
  }, []);

  useEffect(() => {
    viewingAttractionRef.current = viewingAttraction;
  }, [viewingAttraction]);

  useEffect(() => {
    if (open) {
      userHasEditedBudgetRef.current = false;
      guideHasEditedAmountRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open || form.creatorType !== "tourist" || budgetBreakdown.total <= 0) return;
    if (userHasEditedBudgetRef.current) return;
    setForm((f) => ({ ...f, amount: String(budgetBreakdown.total) }));
  }, [open, form.creatorType, budgetBreakdown.total]);

  useEffect(() => {
    if (!open || form.creatorType !== "guide" || guideQuoteBreakdown.total <= 0 || guideHasEditedAmountRef.current) return;
    setForm((f) => ({ ...f, amount: String(guideQuoteBreakdown.total) }));
  }, [open, form.creatorType, guideQuoteBreakdown.total]);

  useEffect(() => {
    if (open) {
      resetForm();
      getMe()
        .then((data) => {
          const u = data as { avatar_url?: string | null };
          setAccountAvatarUrl(typeof u?.avatar_url === "string" ? u.avatar_url : "");
        })
        .catch((err) => {
          if (typeof window !== "undefined") {
            console.error("useItineraryForm getMe:", err);
          }
          setAccountAvatarUrl("");
        });
    }
  }, [open, resetForm]);

  const requestClose = useCallback(() => {
    if (viewingAttractionRef.current) setViewingAttraction(null);
    else onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      if (submitting) return;

      if (form.creatorType === "guide") {
        const result = validateAndBuildGuide(form, t, accountAvatarUrl);
        if ("error" in result) {
          setSubmitError(result.error);
          scrollToSubmitError();
          return;
        }
        setSubmitting(true);
        try {
          const body = withGuideId(buildGuideCustomBody(form), preselectedGuideId);
          const res = await postItineraryCustom(body);
          onSuccess(res.order_id);
          onClose();
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("useItineraryForm guide submit:", err);
          }
          setSubmitError(mapApiReadError(err, t, "itin_error_requestFailed"));
          scrollToSubmitError();
        } finally {
          setSubmitting(false);
        }
        return;
      }

      const result = validateAndBuildTourist(form, t, accountAvatarUrl, suggestedTransportFee);
      if ("error" in result) {
        setSubmitError(result.error);
        scrollToSubmitError();
        return;
      }
      setSubmitting(true);
      try {
        const body = withGuideId(buildTouristCustomBody(form, suggestedTransportFee), preselectedGuideId);
        const res = await postItineraryCustom(body);
        onSuccess(res.order_id);
        onClose();
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("useItineraryForm tourist submit:", err);
        }
        setSubmitError(mapApiReadError(err, t, "itin_error_requestFailed"));
        scrollToSubmitError();
      } finally {
        setSubmitting(false);
      }
    },
    [
      form,
      submitting,
      t,
      scrollToSubmitError,
      accountAvatarUrl,
      suggestedTransportFee,
      onClose,
      onSuccess,
      preselectedGuideId,
    ]
  );

  const cities = form.country ? (CITIES_BY_COUNTRY[form.country] ?? []) : [];

  return {
    form,
    setForm,
    submitError,
    setSubmitError,
    submitting,
    viewingAttraction,
    setViewingAttraction,
    viewingFood,
    setViewingFood,
    viewingVehicle,
    setViewingVehicle,
    viewingHotel,
    setViewingHotel,
    viewingGuideImage,
    setViewingGuideImage,
    accountAvatarUrl,
    coverFileTooBig,
    setCoverFileTooBig,
    submitErrorRef,
    dialogRef,
    attractionOverlayRef,
    userHasEditedBudgetRef,
    guideHasEditedAmountRef,
    scrollToSubmitError,
    setTotalDays,
    setDayPlan,
    setGuideDayPlan,
    resetForm,
    handleSubmit,
    requestClose,
    cities,
    quote,
  };
}
