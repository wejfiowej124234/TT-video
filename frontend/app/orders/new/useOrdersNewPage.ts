"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { getGuide, getGuideAvailability, getIdempotencyKey, postOrder } from "@/lib/apiClient";
import { normalizeTripRange, tripRangeOverlapsOccupied } from "@/lib/guideBookingDates";
import { authLoginHrefForOrdersNewReturn } from "@/lib/ordersGuideDeepLink";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { stashEscrowOrderPrefetchFromPostOrderSuccess } from "@/lib/orderEscrowPrefetch";
import {
  clearOrdersNewDraft,
  readOrdersNewDraft,
  stashOrdersNewDraft,
} from "@/lib/ordersNewDraftStorage";
import type { OrdersNewGuideRow } from "./ordersNewPageModel";

export type UseOrdersNewPageResult = {
  guideIdFromQuery: string;
  tripStartFromQuery: string;
  tripEndFromQuery: string;
  guideId: string;
  setGuideId: Dispatch<SetStateAction<string>>;
  amount: string;
  setAmount: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  guides: OrdersNewGuideRow[];
  scheduleBlocked: boolean;
  scheduleBlockMessage: string | null;
  loading: boolean;
  error: string | null;
  createdId: string | null;
  handleSubmit: (e: FormEvent) => void;
  stashCreatedOrderEscrowPayPrefetch: () => void;
};

function guideRowFromApi(api: unknown, fallbackId: string): OrdersNewGuideRow {
  if (api == null || typeof api !== "object") return { id: fallbackId };
  const o = api as Record<string, unknown>;
  const ratingRaw = o.rating;
  return {
    id: typeof o.id === "string" ? o.id : fallbackId,
    city: typeof o.city === "string" ? o.city.trim() : undefined,
    avatar_url: typeof o.avatar_url === "string" ? o.avatar_url : null,
    rating: typeof ratingRaw === "number" ? ratingRaw : null,
    languages: Array.isArray(o.languages) ? (o.languages as string[]) : null,
    service_types: Array.isArray(o.service_types) ? (o.service_types as string[]) : null,
    bio: typeof o.bio === "string" ? o.bio : null,
  };
}

export function useOrdersNewPage(): UseOrdersNewPageResult {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const guideIdFromQuery = searchParams?.get("guide_id") ?? "";
  const tripStartFromQuery = searchParams?.get("start_date") ?? "";
  const tripEndFromQuery = searchParams?.get("end_date") ?? "";
  const [guideId, setGuideId] = useState(guideIdFromQuery);
  const [amount, setAmount] = useState("");
  const defaultFiat = t("orders_defaultFiatCurrency");
  const [currency, setCurrency] = useState(defaultFiat);
  const [guides, setGuides] = useState<OrdersNewGuideRow[]>([]);
  const [scheduleBlocked, setScheduleBlocked] = useState(false);
  const [scheduleBlockMessage, setScheduleBlockMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submitInFlightRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const trip = normalizeTripRange(tripStartFromQuery, tripEndFromQuery);

  useEffect(() => {
    setGuideId((prev) => guideIdFromQuery || prev);
  }, [guideIdFromQuery]);

  useEffect(() => {
    const q = guideIdFromQuery.trim();
    if (!q) {
      setGuides([]);
      return;
    }
    const draft = readOrdersNewDraft(q);
    if (draft?.amount) setAmount(draft.amount);
    if (draft?.currency) setCurrency(draft.currency);
    setGuides([{ id: q, city: t("orders_fromLink") }]);
  }, [guideIdFromQuery, t]);

  useEffect(() => {
    const q = guideIdFromQuery.trim();
    if (!q) return;
    let cancelled = false;
    getGuide(q)
      .then((api) => {
        if (cancelled) return;
        setGuides([guideRowFromApi(api, q)]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [guideIdFromQuery]);

  useEffect(() => {
    const q = guideIdFromQuery.trim();
    if (!q) {
      setScheduleBlocked(false);
      setScheduleBlockMessage(null);
      return;
    }
    let cancelled = false;
    void getGuideAvailability(q)
      .then((data) => {
        if (cancelled) return;
        const raw = data.occupied_ranges;
        const occupied: { start_date: string; end_date: string }[] = [];
        if (Array.isArray(raw)) {
          for (const item of raw) {
            if (!item || typeof item !== "object") continue;
            const o = item as Record<string, unknown>;
            const start_date = typeof o.start_date === "string" ? o.start_date : "";
            const end_date = typeof o.end_date === "string" ? o.end_date : "";
            if (start_date && end_date) occupied.push({ start_date, end_date });
          }
        }
        if (trip && tripRangeOverlapsOccupied(trip.start, trip.end, occupied)) {
          setScheduleBlocked(true);
          setScheduleBlockMessage(t("orders_trip_conflict"));
          return;
        }
        if (!trip && occupied.length > 0) {
          setScheduleBlockMessage(t("orders_guide_busy_hint"));
        } else {
          setScheduleBlockMessage(null);
        }
        setScheduleBlocked(false);
      })
      .catch(() => {
        if (!cancelled) {
          setScheduleBlocked(false);
          setScheduleBlockMessage(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guideIdFromQuery, trip?.start, trip?.end, t]);

  useEffect(() => {
    const q = guideId.trim();
    if (!q) return;
    stashOrdersNewDraft({
      guide_id: q,
      amount,
      currency,
      start_date: trip?.start,
      end_date: trip?.end,
    });
  }, [guideId, amount, currency, trip?.start, trip?.end]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!guideId.trim() || !amount.trim() || scheduleBlocked) return;
    if (loading || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setLoading(true);
    setError(null);
    postOrder(
      {
        guide_id: guideId.trim(),
        amount: amount.trim(),
        currency: currency.trim() || t("orders_defaultFiatCurrency"),
        start_date: trip?.start,
        end_date: trip?.end,
      },
      getIdempotencyKey(),
    )
      .then((res) => {
        const data = res as { order?: { id?: string } };
        const id = data?.order?.id ?? (res as { id?: string })?.id;
        if (typeof id === "string" && id.trim()) {
          setError(null);
          setCreatedId(id.trim());
          clearOrdersNewDraft();
        } else {
          if (typeof window !== "undefined") {
            console.error("OrdersNew postOrder: missing order id in response", res);
          }
          setError(t("orders_createResponseMissingOrderId"));
        }
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("OrdersNew postOrder:", e);
        }
        if (e instanceof Error && e.message === "login_required") {
          stashOrdersNewDraft({
            guide_id: guideId.trim(),
            amount: amount.trim(),
            currency: currency.trim() || defaultFiat,
            start_date: trip?.start,
            end_date: trip?.end,
          });
          const loginHref = authLoginHrefForOrdersNewReturn(guideId.trim(), {
            startDate: trip?.start,
            endDate: trip?.end,
          });
          if (loginHref) {
            router.replace(loginHref);
            return;
          }
        }
        setError(mapApiReadError(e, t, "orders_createFailed"));
      })
      .finally(() => {
        submitInFlightRef.current = false;
        setLoading(false);
      });
  };

  const stashCreatedOrderEscrowPayPrefetch = useCallback(() => {
    if (!createdId) return;
    stashEscrowOrderPrefetchFromPostOrderSuccess({
      id: createdId,
      amount: amount.trim(),
      currency: (currency.trim() || defaultFiat).trim(),
      guide_id: guideId.trim(),
    });
  }, [createdId, amount, currency, guideId, defaultFiat]);

  return {
    guideIdFromQuery,
    tripStartFromQuery,
    tripEndFromQuery,
    guideId,
    setGuideId,
    amount,
    setAmount,
    currency,
    setCurrency,
    guides,
    scheduleBlocked,
    scheduleBlockMessage,
    loading,
    error,
    createdId,
    handleSubmit,
    stashCreatedOrderEscrowPayPrefetch,
  };
}
