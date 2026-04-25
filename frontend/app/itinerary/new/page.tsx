"use client";

import { useState, useEffect, useId, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { getOrder, postItineraryCreate } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { ordersNewHrefForGuide } from "@/lib/ordersGuideDeepLink";
import OrderFlowSteps from "@/components/escrow/OrderFlowSteps";
import { defaultForm, type ItineraryForm, type ItineraryResponse } from "./types";
import AgreementSummaryAccordion from "./AgreementSummaryAccordion";
import UnifiedItineraryList from "@/components/itinerary/UnifiedItineraryList";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { isUuidString } from "@/lib/isUuidString";
import { COUNTRY_OPTIONS, CITIES_BY_COUNTRY, productCountryZhForCityName } from "@/lib/geoOptions";
import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";
import { apiOrderSliceMatchesRoute } from "@/lib/orderGetEnvelopeGuard";
import {
  stashEscrowOrderPrefetchForFromOrderDeepLink,
  stashEscrowOrderPrefetchFromItineraryCreateResult,
} from "@/lib/orderEscrowPrefetch";
import { ItineraryNewRouteSuspense } from "@/components/itinerary/ItineraryNewRouteSuspense";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

const ERROR_LOGIN_REQUIRED = "login_required";

type OrderHeadPrefill = {
  destination?: string;
  city?: string;
  travel_date?: string | null;
  days?: number;
};

/** 从 GET order 的 order 头与 itinerary 推导可预填字段（53 fromOrder；国家/城市与 geoOptions SSOT 一致） */
function formFromOrderItinerary(
  daily: UnifiedDayRow[] | undefined,
  existing: ItineraryForm,
  orderHead?: OrderHeadPrefill
): ItineraryForm {
  const first = daily?.[0];
  const hasDaily = Boolean(daily?.length);
  if (!hasDaily && !orderHead) return existing;

  const daysFromDaily = hasDaily ? Math.max(1, Math.min(30, daily!.length)) : undefined;

  let destination =
    (orderHead?.destination?.trim() && isAllowedProductZhCountryName(orderHead.destination)
      ? orderHead.destination.trim()
      : "") ||
    (existing.destination?.trim() && isAllowedProductZhCountryName(existing.destination)
      ? existing.destination.trim()
      : "");

  const cityCandidate =
    (orderHead?.city?.trim() || first?.city?.trim() || existing.city?.trim() || "").trim();

  if (!destination && cityCandidate) {
    destination = productCountryZhForCityName(cityCandidate) || "";
  }

  if (!destination && first) {
    const desc = String(first.description ?? first.content_text ?? "");
    const slice = desc.slice(0, 50).trim();
    if (isAllowedProductZhCountryName(slice)) destination = slice;
  }

  let city = cityCandidate;
  if (destination) {
    const allowed = CITIES_BY_COUNTRY[destination] ?? [];
    if (!allowed.some((c) => c.value === city)) city = "";
  } else {
    city = "";
  }

  const travel_date =
    (orderHead?.travel_date != null && String(orderHead.travel_date).trim()) ||
    (first?.date != null && String(first.date).trim()) ||
    existing.travel_date ||
    "";

  let days = existing.days;
  if (orderHead?.days != null && Number.isFinite(orderHead.days) && orderHead.days > 0) {
    days = Math.max(1, Math.min(30, Math.floor(Number(orderHead.days))));
  } else if (daysFromDaily != null) {
    days = daysFromDaily;
  }

  return {
    ...existing,
    destination,
    city,
    travel_date,
    days,
  };
}

function ItineraryNewPageInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
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

  const [form, setForm] = useState<ItineraryForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [fromOrderLoading, setFromOrderLoading] = useState(!!fromOrderId);
  const [fromOrderPrefetchError, setFromOrderPrefetchError] = useState<string | null>(null);
  const [fromOrderFullResponse, setFromOrderFullResponse] = useState<OrderResponse | null>(null);
  const fromOrderFetchGen = useRef(0);
  const formBaseId = useId();
  const formErrorId = useId();
  const fid = (name: string) => `${formBaseId}-${name}`;
  const itinDailyHeadingId = useId();
  const itinCostHeadingId = useId();

  useEffect(() => {
    setFromOrderFullResponse(null);
  }, [fromOrderId]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "days" ? parseInt(value, 10) || 1 : value }));
  };

  const formFieldFocus = `focus:outline-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const inputMinH = "min-h-[44px]";
  const inlineLinkClass = `${touchTargetLink44Classes} font-medium text-travel-500 underline-offset-2 transition-colors hover:underline motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;
  const pillBase =
    `inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-1.5 text-meta font-medium border border-ink-200 transition-colors motion-reduce:transition-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const pillSelected = "bg-travel-500/20 border-travel-500/50 text-ink-900";
  const pillUnselected = "bg-bg-soft border-ink-200 text-ink-600 hover:bg-bg-console";

  const onCountryPill = (nameZh: string) => {
    setForm((prev) => {
      if (prev.destination === nameZh) {
        return { ...prev, destination: "", city: "" };
      }
      const cities = CITIES_BY_COUNTRY[nameZh] ?? [];
      const keepCity = cities.some((c) => c.value === prev.city);
      return { ...prev, destination: nameZh, city: keepCity ? prev.city : "" };
    });
  };

  const onCityPill = (cityName: string) => {
    setForm((prev) => ({ ...prev, city: prev.city === cityName ? "" : cityName }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    } catch (err) {
      if (err instanceof Error && err.message === "login_required") {
        setError(ERROR_LOGIN_REQUIRED);
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

  return (
    <main className="mx-auto max-w-2xl p-8" aria-label={t("itin_title")}>
      <OrderFlowSteps currentStep={1} />
      <h1 className="text-h3 font-semibold text-ink-900 mt-6">{t("itin_title")}</h1>
      <p className="mt-2 text-body text-ink-600">
        {t("itin_desc")}
      </p>
      {guideQueryInvalid ? (
        <div
          className="mt-4 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 p-4 text-small text-ink-800"
          role="alert"
        >
          {t("itin_error_invalidGuideQuery")}
        </div>
      ) : null}
      {guideQueryOk ? (
        <div
          className="mt-4 rounded-[var(--radius-sm)] border border-travel-300/60 bg-travel-500/5 p-4 text-small text-ink-800"
          role="status"
        >
          <p className="font-medium text-ink-900">{t("itin_guideContext_title")}</p>
          <p className="mt-1 text-meta text-ink-600">{t("itin_guideContext_body")}</p>
          <Link
            href={ordersNewHrefForGuide(guideIdFromQuery)}
            className={`mt-3 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-travel-500/50 bg-travel-500/15 px-4 py-2 text-small font-medium text-travel-800 transition-colors hover:bg-travel-500/25 motion-reduce:transition-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {t("itin_guideContext_cta")}
          </Link>
        </div>
      ) : null}

      {fromOrderId && (
        <div className="mt-4 p-4 rounded-[var(--radius-sm)] border border-cyan-500/40 bg-cyan-500/5 text-small text-slate-800" role="status">
          <p>
            {fromOrderLoading ? t("common_loading") : t("itin_fromOrderHint", { id: fromOrderId })}
          </p>
          {!fromOrderLoading && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href={`/escrow/${encodeURIComponent(fromOrderId)}`}
                onClick={() =>
                  stashEscrowOrderPrefetchForFromOrderDeepLink(fromOrderId, fromOrderFullResponse, "escrow")
                }
                className={inlineLinkClass}
              >
                {t("itin_backToOrder")}
              </Link>
              <Link
                href={`/pay?orderId=${encodeURIComponent(fromOrderId)}`}
                onClick={() =>
                  stashEscrowOrderPrefetchForFromOrderDeepLink(fromOrderId, fromOrderFullResponse, "pay")
                }
                className={inlineLinkClass}
              >
                {t("orders_payHub")}
              </Link>
            </div>
          )}
          {fromOrderPrefetchError && !fromOrderLoading && (
            <div className="mt-3">
              <ApiErrorAlert message={fromOrderPrefetchError} />
            </div>
          )}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="space-y-3"
        noValidate
        aria-describedby={error ? formErrorId : undefined}
      >
        <div role="group" aria-labelledby={fid("destination-legend")}>
          <span id={fid("destination-legend")} className="block text-small font-medium mb-1">
            {t("itin_label_destination")}
          </span>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onCountryPill(c.value)}
                className={`${pillBase} ${form.destination === c.value ? pillSelected : pillUnselected}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-labelledby={fid("city-legend")}>
          <span id={fid("city-legend")} className="block text-small font-medium mb-1">
            {t("itin_label_city")}
          </span>
          {!form.destination ? (
            <p className="text-meta text-ink-500 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft px-3 py-2">
              {t("filter_selectCountryFirst")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(CITIES_BY_COUNTRY[form.destination] ?? []).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onCityPill(c.value)}
                  className={`${pillBase} ${form.city === c.value ? pillSelected : pillUnselected}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label htmlFor={fid("travel_date")} className="block text-small font-medium mb-1">
            {t("itin_label_date")}
          </label>
          <input
            id={fid("travel_date")}
            type="date"
            name="travel_date"
            value={form.travel_date}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
          />
        </div>
        <div>
          <label htmlFor={fid("days")} className="block text-small font-medium mb-1">
            {t("itin_label_days")}
          </label>
          <input
            id={fid("days")}
            type="number"
            name="days"
            min={1}
            max={30}
            value={form.days}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
          />
        </div>
        <div>
          <label htmlFor={fid("hotel_type")} className="block text-small font-medium mb-1">
            {t("itin_label_hotel")}
          </label>
          <input
            id={fid("hotel_type")}
            type="text"
            name="hotel_type"
            value={form.hotel_type}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
            placeholder={t("itin_placeholder_hotel")}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={fid("food_preference")} className="block text-small font-medium mb-1">
            {t("itin_label_food")}
          </label>
          <input
            id={fid("food_preference")}
            type="text"
            name="food_preference"
            value={form.food_preference}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
            placeholder={t("itin_placeholder_food")}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={fid("transport")} className="block text-small font-medium mb-1">
            {t("itin_label_transport")}
          </label>
          <input
            id={fid("transport")}
            type="text"
            name="transport"
            value={form.transport}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
            placeholder={t("itin_placeholder_transport")}
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={fid("budget_min")} className="block text-small font-medium mb-1">
              {t("itin_label_budgetMin")}
            </label>
            <input
              id={fid("budget_min")}
              type="number"
              name="budget_min"
              min={0}
              step={100}
              value={form.budget_min}
              onChange={handleChange}
              aria-invalid={!!error}
              aria-errormessage={error ? formErrorId : undefined}
              className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
              placeholder={t("itin_placeholder_optional")}
            />
          </div>
          <div>
            <label htmlFor={fid("budget_max")} className="block text-small font-medium mb-1">
              {t("itin_label_budgetMax")}
            </label>
            <input
              id={fid("budget_max")}
              type="number"
              name="budget_max"
              min={0}
              step={100}
              value={form.budget_max}
              onChange={handleChange}
              aria-invalid={!!error}
              aria-errormessage={error ? formErrorId : undefined}
              className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
              placeholder={t("itin_placeholder_optional")}
            />
          </div>
        </div>
        <div>
          <label htmlFor={fid("notes")} className="block text-small font-medium mb-1">
            {t("itin_label_notes")}
          </label>
          <textarea
            id={fid("notes")}
            name="notes"
            value={form.notes}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`min-h-[80px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full bg-bg-console ${formFieldFocus}`}
            placeholder={t("itin_placeholder_optional")}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting ? true : undefined}
          className={`btn-console inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-6 py-2.5 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
        >
          {submitting ? t("itin_submitting") : t("itin_submit")}
        </button>
        {error ? (
          <div
            id={formErrorId}
            className="mt-4 rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-3 text-small text-danger"
            role="alert"
          >
            {error === ERROR_LOGIN_REQUIRED ? t("itin_error_loginRequired") : error}
            {error === ERROR_LOGIN_REQUIRED && (
              <span className="ml-2">
                <Link href={`/auth/login?returnUrl=${encodeURIComponent(itinNewLoginReturnPath)}`} className={inlineLinkClass}>
                  {t("itin_goLogin")}
                </Link>
              </span>
            )}
          </div>
        ) : null}
      </form>
      {result && (
        <div className="mt-12 animate-fadeUp space-y-10">
          <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-success/5 p-6" role="status">
            <p className="font-semibold text-success">{t("itin_result_title")}</p>
            <p className="mt-1 text-small text-ink-600">{t("itin_result_orderId")}<code className="rounded-[var(--radius-sm)] bg-bg-console px-1.5 py-0.5 font-mono text-meta">{result.order_id}</code></p>
            <p className="text-meta text-ink-500">
              {t("itin_result_version", {
                n: result.version,
                status: result.order_status ?? result.status ?? "",
              })}
            </p>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-soft p-5 shadow-soft">
            <h2 className="text-body font-semibold text-ink-900">{t("itin_result_next_title")}</h2>
            <p className="mt-1 text-meta text-ink-600">{t("itin_result_next_sub")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/escrow/${encodeURIComponent(result.order_id)}`}
                onClick={stashPostCreateEscrowPayPrefetch}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none hover:bg-travel-600 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("itin_result_cta_escrow")}
              </Link>
              <Link
                href={`/pay?orderId=${encodeURIComponent(result.order_id)}`}
                onClick={stashPostCreateEscrowPayPrefetch}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-4 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("itin_result_cta_pay")}
              </Link>
              <Link
                href="/market?view=guides"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-4 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("itin_result_cta_market")}
              </Link>
              <Link
                href="/orders"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-200 px-4 py-2 text-small text-ink-600 transition-colors motion-reduce:transition-none hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("itin_result_cta_orders")}
              </Link>
            </div>
          </div>

          {result.daily_itinerary && result.daily_itinerary.length > 0 && (
            <section className="space-y-4" aria-labelledby={itinDailyHeadingId}>
              <h2 id={itinDailyHeadingId} className="text-h3 font-semibold text-ink-900">{t("itin_section_daily")}</h2>
              <UnifiedItineraryList
                days={result.daily_itinerary}
                variant="trust"
                t={t}
              />
            </section>
          )}

          {result.amount_breakdown && (
            <section className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-soft p-6" aria-labelledby={itinCostHeadingId}>
              <h2 id={itinCostHeadingId} className="text-body-l font-semibold text-ink-800 mb-4">{t("itin_section_cost")}</h2>
              <table className="w-full text-small text-ink-700 border-collapse" role="table">
                <tbody>
                  {result.amount_breakdown.hotel != null && (
                    <tr><td className="py-1 pr-4">{t("itin_hotel")}</td><td className="py-1 text-right font-medium">{result.amount_breakdown.hotel}{t("ui_currency_suffix_usdc")}</td></tr>
                  )}
                  {result.amount_breakdown.catering != null && (
                    <tr><td className="py-1 pr-4">{t("itin_catering")}</td><td className="py-1 text-right font-medium">{result.amount_breakdown.catering}{t("ui_currency_suffix_usdc")}</td></tr>
                  )}
                  {result.amount_breakdown.tickets != null && (
                    <tr><td className="py-1 pr-4">{t("itin_tickets")}</td><td className="py-1 text-right font-medium">{result.amount_breakdown.tickets}{t("ui_currency_suffix_usdc")}</td></tr>
                  )}
                  {result.amount_breakdown.guide_fee != null && (
                    <tr><td className="py-1 pr-4">{t("itin_guideFee")}</td><td className="py-1 text-right font-medium">{result.amount_breakdown.guide_fee}{t("ui_currency_suffix_usdc")}</td></tr>
                  )}
                  {result.amount_breakdown.vehicle != null && (
                    <tr><td className="py-1 pr-4">{t("itin_vehicle")}</td><td className="py-1 text-right font-medium">{result.amount_breakdown.vehicle}{t("ui_currency_suffix_usdc")}</td></tr>
                  )}
                  {result.amount_breakdown.platform_fee != null && (
                    <tr><td className="py-1 pr-4">{t("itin_platformFee")}</td><td className="py-1 text-right font-medium">{result.amount_breakdown.platform_fee}{t("ui_currency_suffix_usdc")}</td></tr>
                  )}
                  {result.amount_breakdown.total_budget != null && (
                    <tr className="border-t border-ink-200"><td className="pt-2 pr-4 font-semibold text-ink-900">{t("escrow_totalBudget_short")}</td><td className="pt-2 text-right font-semibold text-ink-900">{result.amount_breakdown.total_budget}{t("ui_currency_suffix_usdc")}</td></tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          <AgreementSummaryAccordion
            total={result.amount_breakdown.total_budget}
            platformFee={result.amount_breakdown.platform_fee}
            orderId={result.order_id}
          />
        </div>
      )}
      <ProductCrossNav ariaLabelKey="itin_relatedNav_aria" />
    </main>
  );
}

export default function ItineraryNewPage() {
  return (
    <ItineraryNewRouteSuspense>
      <ItineraryNewPageInner />
    </ItineraryNewRouteSuspense>
  );
}
