"use client";

import { useState, useEffect, useId, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { getGuides, postOrder } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import OrderFlowSteps from "@/components/escrow/OrderFlowSteps";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { stashEscrowOrderPrefetchFromPostOrderSuccess } from "@/lib/orderEscrowPrefetch";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { OrdersNewRouteSuspense } from "@/components/orders/OrdersNewRouteSuspense";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { ordersListHrefAfterCreate } from "@/lib/ordersExpectOrderParam";
import { authLoginHrefForGuideDetailReturn } from "@/lib/ordersGuideDeepLink";

function NewOrderPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const guideIdFromQuery = searchParams?.get("guide_id") ?? "";
  const [guideId, setGuideId] = useState(guideIdFromQuery);
  const [amount, setAmount] = useState("");
  const defaultFiat = t("orders_defaultFiatCurrency");
  const [currency, setCurrency] = useState(defaultFiat);
  const [guides, setGuides] = useState<{ id: string; city?: string }[]>([]);
  const [guidesLoadError, setGuidesLoadError] = useState<string | null>(null);
  const [guidesRetryKey, setGuidesRetryKey] = useState(0);
  const [loading, setLoading] = useState(false);
  /** B-034：连点或慢网络下禁止并发 POST（state 更新前第二下仍可能进 handler） */
  const submitInFlightRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const formBaseId = useId();
  const guideFieldId = `${formBaseId}-guide`;
  const amountFieldId = `${formBaseId}-amount`;
  const currencyFieldId = `${formBaseId}-currency`;

  useEffect(() => {
    setGuideId((prev) => guideIdFromQuery || prev);
  }, [guideIdFromQuery]);

  useEffect(() => {
    setGuidesLoadError(null);
    getGuides()
      .then((v) => (Array.isArray(v) ? v : []) as { id: string; city?: string }[])
      .then((list) => {
        const hasQueryGuide = guideIdFromQuery && !list.some((g) => g.id === guideIdFromQuery);
        if (hasQueryGuide) return [{ id: guideIdFromQuery, city: t("orders_fromLink") }, ...list];
        return list;
      })
      .then(setGuides)
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("OrdersNew getGuides:", err);
        }
        if (err instanceof Error && err.message === "login_required") {
          const loginHref = authLoginHrefForGuideDetailReturn(guideIdFromQuery);
          if (loginHref) {
            router.replace(loginHref);
            return;
          }
        }
        setGuides([]);
        setGuidesLoadError(mapApiReadError(err, t, "orders_guides_loadFailed"));
      });
  }, [guideIdFromQuery, t, guidesRetryKey, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideId.trim() || !amount.trim()) return;
    if (loading || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setLoading(true);
    setError(null);
    postOrder({
      guide_id: guideId.trim(),
      amount: amount.trim(),
      currency: currency.trim() || t("orders_defaultFiatCurrency"),
    })
      .then((res) => {
        const data = res as { order?: { id?: string } };
        const id = data?.order?.id ?? (res as { id?: string })?.id;
        if (typeof id === "string" && id.trim()) {
          setError(null);
          setCreatedId(id.trim());
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
          const loginHref = authLoginHrefForGuideDetailReturn(guideId.trim());
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

  if (createdId) {
    return (
      <main className="min-h-screen bg-bg-main flex items-center justify-center p-6" aria-label={t("orders_created")}>
        <div className="w-full max-w-md rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4">
          <h1 className="sr-only">{t("orders_created")}</h1>
          <p className="text-success font-medium">{t("orders_created")}</p>
          <p className="mt-3">
            <Link
              href={ordersListHrefAfterCreate(createdId)}
              className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("orders_afterCreate_goOrders")}
            </Link>
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href={`/escrow/${encodeURIComponent(createdId)}`}
              onClick={stashCreatedOrderEscrowPayPrefetch}
              className={`${touchTargetLink44Classes} text-travel-500 text-small hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("orders_viewDetail")}
            </Link>
            <Link
              href={`/pay?orderId=${encodeURIComponent(createdId)}`}
              onClick={stashCreatedOrderEscrowPayPrefetch}
              className={`${touchTargetLink44Classes} text-travel-500 text-small hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("orders_payHub")}
            </Link>
          </p>
          <ProductCrossNav ariaLabelKey="orders_new_relatedNav_aria" showGuides className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500" />
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-bg-main" aria-label={t("orders_createTitle")}>
      <section className="mx-auto max-w-md px-6 py-12">
        <OrderFlowSteps currentStep={1} />
        <h1 className="text-h4 font-semibold text-ink-900 mb-4 mt-6">{t("orders_createTitle")}</h1>
        {guidesLoadError && (
          <div className="mb-4 space-y-2">
            <ApiErrorAlert message={guidesLoadError} />
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                setGuidesRetryKey((k) => k + 1);
              }}
            >
              <button
                type="submit"
                className={`rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-3 py-1.5 text-meta text-ink-700 hover:bg-ink-50 focus:outline-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          aria-busy={loading ? true : undefined}
        >
          <div>
            <label htmlFor={guideFieldId} className="block text-meta text-ink-500 mb-0.5">
              {t("orders_guides")} *
            </label>
            <select
              id={guideFieldId}
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
              required
              disabled={loading}
              className={`inline-flex w-full min-h-[44px] items-center justify-start border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console focus:outline-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
            >
              <option value="">{t("orders_selectGuide")}</option>
              {guides.map((g) => (
                <option key={g.id} value={g.id}>{g.city ?? g.id}</option>
              ))}
            </select>
            {guidesLoadError == null && guides.length === 0 ? (
              <p className="text-meta text-ink-500 mt-0.5">
                {t("orders_noGuidesBefore")}
                <Link
                  href="/guide/register"
                  className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                >
                  {t("orders_noGuidesLink")}
                </Link>
                {t("orders_noGuidesAfter")}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={amountFieldId} className="block text-meta text-ink-500 mb-0.5">
              {t("orders_amount")}
            </label>
            <input
              id={amountFieldId}
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console focus:outline-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
              placeholder={t("orders_amountPlaceholder")}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor={currencyFieldId} className="block text-meta text-ink-500 mb-0.5">
              {t("orders_currency")}
            </label>
            <input
              id={currencyFieldId}
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={loading}
              className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console focus:outline-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console disabled:opacity-60`}
              placeholder={t("orders_currencyPlaceholder")}
              autoComplete="off"
            />
          </div>
          {error ? <ApiErrorAlert message={error} /> : null}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("orders_creating") : t("orders_create")}
          </button>
        </form>
        <ProductCrossNav ariaLabelKey="orders_new_relatedNav_aria" showGuides className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500" />
      </section>
    </main>
  );
}

export default function NewOrderPage() {
  return (
    <OrdersNewRouteSuspense>
      <NewOrderPageInner />
    </OrdersNewRouteSuspense>
  );
}
