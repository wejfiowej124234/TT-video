// search-params gate: parent route provides Suspense boundary.
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { getOrder, postItineraryCreate } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  defaultForm,
  type ItineraryForm,
  type ItineraryResponse,
} from "@/components/itinerary/itineraryNewPage/itineraryNewTypes";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { isUuidString } from "@/lib/isUuidString";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";
import { apiOrderSliceMatchesRoute } from "@/lib/orderGetEnvelopeGuard";
import { stashEscrowOrderPrefetchFromItineraryCreateResult } from "@/lib/orderEscrowPrefetch";
import {
  MARKET_ITINERARY_DRAFT_QUERY,
  buildPathStrippingItineraryDraftQuery,
} from "@/lib/marketDeepLink";
import { hydrateCustomItineraryStudioDraftFromServer, studioDraftPayloadToForm } from "@/lib/customItineraryDraft";
import { mapCustomItineraryFormToItineraryNewForm } from "./draftHydrateMap";
import { formFromOrderItinerary, type OrderHeadPrefill } from "./fromOrderPrefill";
import { ITINERARY_NEW_ERROR_LOGIN_REQUIRED } from "@/components/itinerary/itineraryNewPage/itineraryNewConstants";

export type UseItineraryNewPageResult = {
  itinNewLoginReturnPath: string;
  fromOrderId: string | null;
  guideIdFromQuery: string;
  guideQueryOk: boolean;
  guideQueryInvalid: boolean;
  draftQueryInvalid: boolean;
  form: ItineraryForm;
  submitting: boolean;
  error: string | null;
  result: ItineraryResponse | null;
  fromOrderLoading: boolean;
  fromOrderPrefetchError: string | null;
  fromOrderFullResponse: OrderResponse | null;
  draftHydrateLoading: boolean;
  draftHydrateError: string | null;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCountryPill: (nameZh: string) => void;
  onCityPill: (cityName: string) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  stashPostCreateEscrowPayPrefetch: () => void;
};

export function useItineraryNewPage(): UseItineraryNewPageResult {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const itinNewLoginReturnPath = useMemo(() => {
    const base = pathname && pathname.length > 0 ? pathname : "/itinerary/new";
    const q = searchParams?.toString() ?? "";
    return q ? `${base}?${q}` : base;
  }, [pathname, searchParams]);
  const fromOrderId = searchParams?.get("fromOrder") ?? null;
  const guideIdFromQuery = searchParams?.get("guide_id")?.trim() ?? "";
  const guideQueryOk = guideIdFromQuery !== "" && isUuidString(guideIdFromQuery);
  const guideQueryInvalid = guideIdFromQuery !== "" && !isUuidString(guideIdFromQuery);
  const draftIdRaw = searchParams?.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim() ?? "";
  const draftQueryInvalid = draftIdRaw !== "" && !isUuidString(draftIdRaw);
  const itineraryDraftIdForHydrate = useMemo(() => {
    if (fromOrderId) return "";
    const raw = searchParams?.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim() ?? "";
    return raw && isUuidString(raw) ? raw : "";
  }, [fromOrderId, searchParams]);

  const [form, setForm] = useState<ItineraryForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [fromOrderLoading, setFromOrderLoading] = useState(!!fromOrderId);
  const [fromOrderPrefetchError, setFromOrderPrefetchError] = useState<string | null>(null);
  const [fromOrderFullResponse, setFromOrderFullResponse] = useState<OrderResponse | null>(null);
  const [draftHydrateLoading, setDraftHydrateLoading] = useState(false);
  const [draftHydrateError, setDraftHydrateError] = useState<string | null>(null);
  const fromOrderFetchGen = useRef(0);
  const draftHydrateGen = useRef(0);

  useEffect(() => {
    setFromOrderFullResponse(null);
  }, [fromOrderId]);

  useEffect(() => {
    const raw = searchParams?.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim() ?? "";
    if (!raw || isUuidString(raw)) return;
    if (!searchParams) return;
    router.replace(buildPathStrippingItineraryDraftQuery(pathname, searchParams), { scroll: false });
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (!fromOrderId) return;
    const raw = searchParams?.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim() ?? "";
    if (!raw) return;
    if (!searchParams) return;
    router.replace(buildPathStrippingItineraryDraftQuery(pathname, searchParams), { scroll: false });
  }, [fromOrderId, searchParams, router, pathname]);

  useEffect(() => {
    const id = itineraryDraftIdForHydrate;
    if (!id) {
      setDraftHydrateLoading(false);
      return;
    }
    const gen = ++draftHydrateGen.current;
    setDraftHydrateLoading(true);
    setDraftHydrateError(null);
    let cancelled = false;
    void (async () => {
      try {
        const row = await hydrateCustomItineraryStudioDraftFromServer(id);
        if (cancelled || gen !== draftHydrateGen.current) return;
        const cf = studioDraftPayloadToForm(row.payload);
        if (!cf) {
          setDraftHydrateError(t("itin_error_requestFailed"));
          return;
        }
        setForm(mapCustomItineraryFormToItineraryNewForm(cf));
        router.replace(buildPathStrippingItineraryDraftQuery(pathname, searchParams), { scroll: false });
      } catch (err) {
        if (cancelled || gen !== draftHydrateGen.current) return;
        setDraftHydrateError(mapApiReadError(err, t, "itin_error_requestFailed"));
      } finally {
        if (!cancelled && gen === draftHydrateGen.current) setDraftHydrateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itineraryDraftIdForHydrate, searchParams, router, pathname, t]);

  useEffect(() => {
    const gen = ++fromOrderFetchGen.current;
    if (!fromOrderId) {
      setFromOrderLoading(false);
      return;
    }
    setFromOrderLoading(true);
    setFromOrderPrefetchError(null);
    getOrder(fromOrderId)
      .then((res) => {
        if (gen !== fromOrderFetchGen.current) return;
        const data = res as OrderResponse & {
          order?: {
            destination?: string;
            city?: string;
            travel_date?: string | null;
            days?: number;
          };
          itinerary?: { daily_itinerary?: UnifiedDayRow[] };
        };
        if (!apiOrderSliceMatchesRoute(data?.order, fromOrderId)) {
          setFromOrderFullResponse(null);
          setFromOrderPrefetchError(t("orderGet_payloadOrderMismatch"));
          return;
        }
        setFromOrderFullResponse(data);
        const daily = data?.itinerary?.daily_itinerary;
        const o = data?.order;
        const orderHead: OrderHeadPrefill | undefined = o
          ? {
              destination: o.destination,
              city: o.city,
              travel_date: o.travel_date ?? undefined,
              days: typeof o.days === "number" ? o.days : undefined,
            }
          : undefined;
        setForm((prev) => formFromOrderItinerary(daily, prev, orderHead));
      })
      .catch((err) => {
        if (gen !== fromOrderFetchGen.current) return;
        setFromOrderFullResponse(null);
        if (typeof window !== "undefined") {
          console.error("ItineraryNew getOrder fromOrder:", err);
        }
        setFromOrderPrefetchError(mapApiReadError(err, t, "itin_fromOrder_loadFailed"));
      })
      .finally(() => {
        if (gen !== fromOrderFetchGen.current) return;
        setFromOrderLoading(false);
      });
  }, [fromOrderId, t]);

  const stashPostCreateEscrowPayPrefetch = useCallback(() => {
    if (!result) return;
    stashEscrowOrderPrefetchFromItineraryCreateResult(result.order_id, result);
  }, [result]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "days" ? parseInt(value, 10) || 1 : value }));
  };

  const onCountryPill = (nameZh: string) => {
    setForm((prev) => {
      /** 与「单选国家」心智一致：重复点同一 pill 不清空（避免误触清空城市区；E2E/全矩阵更稳）。换国或清理由选其它国家覆盖。 */
      if (prev.destination === nameZh) {
        return prev;
      }
      const cities = CITIES_BY_COUNTRY[nameZh] ?? [];
      const keepCity = cities.some((c) => c.value === prev.city);
      return { ...prev, destination: nameZh, city: keepCity ? prev.city : "" };
    });
  };

  const onCityPill = (cityName: string) => {
    setForm((prev) => ({ ...prev, city: prev.city === cityName ? "" : cityName }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const body = {
        destination: form.destination.trim(),
        city: form.city.trim(),
        travel_date: form.travel_date.trim() || new Date().toISOString().slice(0, 10),
        days: Math.max(1, Math.min(30, form.days || 1)),
        hotel_type: form.hotel_type.trim() || undefined,
        food_preference: form.food_preference.trim() || undefined,
        transport: form.transport.trim() || undefined,
        budget_min: form.budget_min ? parseFloat(form.budget_min) : undefined,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : undefined,
        notes: form.notes.trim() || undefined,
        ...(guideQueryOk ? { guide_id: guideIdFromQuery } : {}),
      };
      if (!body.destination || !body.city) {
        setError(t("itin_error_destCity"));
        return;
      }
      if (!isAllowedProductZhCountryName(body.destination)) {
        setError(t("itin_error_invalidDestinationCountry"));
        return;
      }
      const allowedCities = CITIES_BY_COUNTRY[body.destination] ?? [];
      if (!allowedCities.some((c) => c.value === body.city)) {
        setError(t("itin_error_invalidCityForCountry"));
        return;
      }
      const data = await postItineraryCreate(body);
      setResult(data as ItineraryResponse);
      if (searchParams?.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim()) {
        router.replace(buildPathStrippingItineraryDraftQuery(pathname, searchParams), { scroll: false });
      }
    } catch (err) {
      if (err instanceof Error && err.message === "login_required") {
        setError(ITINERARY_NEW_ERROR_LOGIN_REQUIRED);
        return;
      }
      if (typeof window !== "undefined") {
        console.error("ItineraryNew:", err);
      }
      setError(mapApiReadError(err, t, "itin_error_requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    itinNewLoginReturnPath,
    fromOrderId,
    guideIdFromQuery,
    guideQueryOk,
    guideQueryInvalid,
    draftQueryInvalid,
    form,
    submitting,
    error,
    result,
    fromOrderLoading,
    fromOrderPrefetchError,
    fromOrderFullResponse,
    draftHydrateLoading,
    draftHydrateError,
    handleChange,
    onCountryPill,
    onCityPill,
    handleSubmit,
    stashPostCreateEscrowPayPrefetch,
  };
}
