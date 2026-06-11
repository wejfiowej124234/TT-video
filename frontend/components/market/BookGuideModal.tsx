"use client";



import { useEffect, useId, useMemo, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import { useFocusTrap } from "@/hooks/useFocusTrap";

import { trackMarketEvent } from "@/lib/analytics";

import {

  fetchBindableOwnItineraryOrders,

  formatBookGuideItineraryOptionLabel,

  guideIdFromOrderPayload,

  orderItineraryConfirmedFromGetOrderPayload,

} from "@/lib/bookGuideItineraryPicker";

import {


  getIdempotencyKey,

  getOrder,

  patchOrderGuide,

  patchOrderTripDates,

} from "@/lib/apiClient";

import { fetchGuideAvailabilityCached } from "@/lib/guideAvailabilityClient";
import {
  formatTripRangeLabel,
  resolveOrderTripDatesFromGetOrderPayload,
  tripRangeOverlapsOccupied,
} from "@/lib/guideBookingDates";
import { isAssignedGuideId } from "@/lib/isAssignedGuideId";

import { mapOrderWriteError } from "@/lib/mapOrderWriteError";

import {
  marketHrefForEscrowGuideBind,
  marketHrefForGuideCustomItinerary,
  marketHrefForPickGuide,
} from "@/lib/ordersGuideDeepLink";

import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";

import type { OrderCardItem } from "@/lib/marketTypes";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import {

  TT_MARKETING_BTN_MARKET_GLASS,

  TT_MARKETING_BTN_MARKET_PRIMARY,

  TT_MARKETING_MARKET_DARK_PATH,

} from "@/lib/marketingUi";



const GUIDE_BIND_BLOCK_CODES = new Set([

  "guide_has_active_order",

  "schedule_conflict",

  "itinerary_already_confirmed",

]);



function writeErrorCode(err: unknown): string {

  return err instanceof Error ? err.message : "";

}



function parseOccupiedRanges(raw: unknown): { start_date: string; end_date: string }[] {

  if (!Array.isArray(raw)) return [];

  const out: { start_date: string; end_date: string }[] = [];

  for (const item of raw) {

    if (!item || typeof item !== "object") continue;

    const o = item as Record<string, unknown>;

    const start_date = typeof o.start_date === "string" ? o.start_date : "";

    const end_date = typeof o.end_date === "string" ? o.end_date : "";

    if (start_date && end_date) out.push({ start_date, end_date });

  }

  return out;

}



/**

 * P29 / GD-L5-P3 预约向导弹窗：itinerary-first 绑定向导（PATCH guide + 可选改期），

 * 或为 Escrow 深链传入的固定订单绑定向导。不再以 `/orders/new` 空订单为主链。

 */

export default function BookGuideModal({

  guideId,

  guideName,

  bindOrderId,

  tripStart,

  tripEnd,

  requireTripDates,

  onClose,

}: {

  guideId: string;

  guideName?: string;

  bindOrderId?: string | null;

  tripStart?: string | null;

  tripEnd?: string | null;

  requireTripDates?: boolean;

  onClose: () => void;

}) {

  const { t, locale } = useTranslation();

  const router = useRouter();

  const trapRef = useFocusTrap(true, onClose);

  const titleId = useId();

  const descId = useId();

  const subtitleId = useId();

  const itinerarySelectId = useId();

  const [binding, setBinding] = useState(false);

  const [preflightLoading, setPreflightLoading] = useState(false);

  const [itinerariesLoading, setItinerariesLoading] = useState(false);

  const [bindableOrders, setBindableOrders] = useState<OrderCardItem[]>([]);

  const [selectedOrderId, setSelectedOrderId] = useState("");

  const [bindBlocked, setBindBlocked] = useState(false);

  const [bindError, setBindError] = useState<string | null>(null);

  const [itineraryHint, setItineraryHint] = useState<string | null>(null);

  const [orderResolvedTrip, setOrderResolvedTrip] = useState<{ start: string; end: string } | null>(null);

  const [orderTripResolving, setOrderTripResolving] = useState(false);

  const [orderAlreadyBoundToThisGuide, setOrderAlreadyBoundToThisGuide] = useState(false);

  const [orderBindPreflightLoading, setOrderBindPreflightLoading] = useState(false);

  const bindTrimmed = bindOrderId?.trim() ?? "";

  const isPinnedBindMode = bindTrimmed.length > 0;

  const tripStartTrim = tripStart?.trim() ?? "";

  const tripEndTrim = tripEnd?.trim() ?? "";

  const propHasTrip = tripStartTrim.length > 0 && tripEndTrim.length > 0;

  const p = TT_MARKETING_MARKET_DARK_PATH;

  const hasBindableItineraries = bindableOrders.length > 0;

  const effectiveBindOrderId = isPinnedBindMode

    ? bindTrimmed

    : hasBindableItineraries

      ? selectedOrderId.trim()

      : "";

  const canSubmitBind = effectiveBindOrderId.length > 0;

  const effectiveTripStart = propHasTrip ? tripStartTrim : (orderResolvedTrip?.start ?? "");

  const effectiveTripEnd = propHasTrip ? tripEndTrim : (orderResolvedTrip?.end ?? "");

  const hasTrip = effectiveTripStart.length > 0 && effectiveTripEnd.length > 0;

  const tripMissing = requireTripDates && !hasTrip && !isPinnedBindMode;

  const bindSubmitDisabled =
    binding ||
    preflightLoading ||
    orderBindPreflightLoading ||
    (!orderAlreadyBoundToThisGuide && bindBlocked) ||
    !canSubmitBind ||
    tripMissing ||
    orderTripResolving;



  useEffect(() => {

    if (guideId) {

      trackMarketEvent("market_book_guide_open", {

        guideId,

        bindOrderId: bindTrimmed || undefined,

      });

    }

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {

      document.body.style.overflow = prevOverflow;

    };

  }, [guideId, bindTrimmed]);



  useEffect(() => {

    if (isPinnedBindMode) return;

    let cancelled = false;

    setItinerariesLoading(true);

    void fetchBindableOwnItineraryOrders({ bustCache: true })

      .then((items) => {

        if (cancelled) return;

        setBindableOrders(items);

        if (items.length >= 1) {

          setSelectedOrderId(String(items[0]!.id));

        }

      })

      .catch(() => {

        if (!cancelled) setBindableOrders([]);

      })

      .finally(() => {

        if (!cancelled) setItinerariesLoading(false);

      });

    return () => {

      cancelled = true;

    };

  }, [isPinnedBindMode]);



  useEffect(() => {

    const orderId = effectiveBindOrderId.trim();

    if (!orderId || propHasTrip) {

      setOrderResolvedTrip(null);

      setOrderTripResolving(false);

      return;

    }

    let cancelled = false;

    setOrderTripResolving(true);

    void getOrder(orderId)

      .then((data) => {

        if (cancelled) return;

        setOrderResolvedTrip(resolveOrderTripDatesFromGetOrderPayload(data));

      })

      .catch(() => {

        if (!cancelled) setOrderResolvedTrip(null);

      })

      .finally(() => {

        if (!cancelled) setOrderTripResolving(false);

      });

    return () => {

      cancelled = true;

    };

  }, [effectiveBindOrderId, propHasTrip]);



  useEffect(() => {

    const orderId = effectiveBindOrderId.trim();

    const gid = guideId.trim();

    if (!orderId) {

      setOrderAlreadyBoundToThisGuide(false);

      setOrderBindPreflightLoading(false);

      return;

    }

    let cancelled = false;

    setOrderBindPreflightLoading(true);

    void getOrder(orderId)

      .then((data) => {

        if (cancelled) return;

        const existing = guideIdFromOrderPayload(data);

        const sameGuide = !!gid && isAssignedGuideId(existing) && existing === gid;

        setOrderAlreadyBoundToThisGuide(sameGuide);

        if (sameGuide) {

          setBindBlocked(false);

          setBindError(null);

          setItineraryHint(t("book_guide_alreadyBoundHint"));

        } else {

          setItineraryHint(null);

        }

        if (orderItineraryConfirmedFromGetOrderPayload(data)) {

          setBindBlocked(true);

          setBindError(t("order_error_itinerary_already_confirmed"));

        }

      })

      .catch(() => {

        if (!cancelled) {

          setOrderAlreadyBoundToThisGuide(false);

          setItineraryHint(null);

        }

      })

      .finally(() => {

        if (!cancelled) setOrderBindPreflightLoading(false);

      });

    return () => {

      cancelled = true;

    };

  }, [effectiveBindOrderId, guideId, t]);



  useEffect(() => {

    if (!guideId.trim()) return;

    if (orderBindPreflightLoading || orderAlreadyBoundToThisGuide) {

      setPreflightLoading(false);

      return;

    }

    let cancelled = false;

    setPreflightLoading(true);

    setBindError(null);

    setBindBlocked(false);

    setItineraryHint(null);

    void fetchGuideAvailabilityCached(guideId.trim())

      .then((data) => {

        if (cancelled) return;

        const occupied = parseOccupiedRanges(data.occupied_ranges);

        const checkBind = isPinnedBindMode || canSubmitBind;

        if (!checkBind) return;



        if (occupied.length > 0) {

          setBindBlocked(true);

          if (hasTrip && tripRangeOverlapsOccupied(effectiveTripStart, effectiveTripEnd, occupied)) {

            setBindError(t("book_guide_tripConflict"));

          } else {

            setBindError(t("order_error_guide_has_active_order"));

          }

        }

      })

      .catch((err) => {

        if (cancelled) return;

        const code = writeErrorCode(err);

        if (code === "rate_limit_exceeded" || code.includes("429")) {

          setBindBlocked(true);

          setBindError(t("book_guide_availabilityRateLimited"));

        }

      })

      .finally(() => {

        if (!cancelled) setPreflightLoading(false);

      });

    return () => {

      cancelled = true;

    };

  }, [
    isPinnedBindMode,
    canSubmitBind,
    guideId,
    hasTrip,
    effectiveTripStart,
    effectiveTripEnd,
    orderAlreadyBoundToThisGuide,
    orderBindPreflightLoading,
    t,
  ]);



  const navigateToEscrow = (orderId: string) => {

    trackMarketEvent("market_escrow_guide_bound", { orderId, guideId });

    stashEscrowOrderPrefetchForOrderIdNav(orderId, "escrow");

    onClose();

    router.push(`/escrow/${encodeURIComponent(orderId)}`);

  };



  const applyTripDatesIfNeeded = async (orderId: string) => {

    if (!hasTrip) return;

    await patchOrderTripDates(

      orderId,

      { start_date: effectiveTripStart, end_date: effectiveTripEnd },

      getIdempotencyKey(),

    );

  };



  const handleBindToOrder = () => {

    const orderId = effectiveBindOrderId;

    if (orderAlreadyBoundToThisGuide && orderId) {

      navigateToEscrow(orderId);

      return;

    }

    if (bindSubmitDisabled) return;

    setBinding(true);

    setBindError(null);

    void (async () => {

      try {

        if (!isPinnedBindMode) {

          const fresh = await fetchBindableOwnItineraryOrders({ bustCache: true });

          setBindableOrders(fresh);

          if (!fresh.some((o) => String(o.id) === orderId)) {

            setBindError(t("order_error_guide_already_assigned"));

            return;

          }

        }



        let needGuidePatch = true;

        try {

          const detail = await getOrder(orderId);

          const existing = guideIdFromOrderPayload(detail);

          if (isAssignedGuideId(existing)) {

            if (existing === guideId.trim()) {

              needGuidePatch = false;

            } else if (!isPinnedBindMode) {

              setBindError(t("order_error_guide_already_assigned"));

              return;

            }

          }

        } catch {

          /* GET 失败不阻断 PATCH；服务端仍为 SSOT */

        }



        if (needGuidePatch) {

          try {

            const avail = await fetchGuideAvailabilityCached(guideId.trim());

            const occupied = parseOccupiedRanges(avail.occupied_ranges);

            if (occupied.length > 0) {

              setBindBlocked(true);

              if (hasTrip && tripRangeOverlapsOccupied(effectiveTripStart, effectiveTripEnd, occupied)) {

                setBindError(t("book_guide_tripConflict"));

              } else {

                setBindError(t("order_error_guide_has_active_order"));

              }

              return;

            }

          } catch (availErr) {

            const code = writeErrorCode(availErr);

            if (code === "rate_limit_exceeded" || code.includes("429")) {

              setBindBlocked(true);

              setBindError(t("book_guide_availabilityRateLimited"));

              return;

            }

          }

          await patchOrderGuide(orderId, guideId, getIdempotencyKey());

        }

        await applyTripDatesIfNeeded(orderId);

        navigateToEscrow(orderId);

      } catch (err) {

        const code = writeErrorCode(err);

        if (code === "guide_already_assigned") {

          try {

            const detail = await getOrder(orderId);

            const existing = guideIdFromOrderPayload(detail);

            if (existing === guideId.trim()) {

              await applyTripDatesIfNeeded(orderId);

              navigateToEscrow(orderId);

              return;

            }

          } catch {

            /* fall through to user-visible error */

          }

          setBindError(t("order_error_guide_already_assigned"));

          return;

        }

        if (GUIDE_BIND_BLOCK_CODES.has(code)) {

          setBindBlocked(true);

          setBindError(mapOrderWriteError(err, t, { fallbackKey: "escrow_bindGuideFailed" }));

        } else {

          setBindError(mapOrderWriteError(err, t, { fallbackKey: "escrow_bindGuideFailed" }));

        }

      } finally {

        setBinding(false);

      }

    })();

  };



  const tripLabel =

    hasTrip && !tripMissing ? formatTripRangeLabel(effectiveTripStart, effectiveTripEnd, locale) : null;



  const itineraryOptions = useMemo(

    () =>

      bindableOrders.map((item) => ({

        id: String(item.id),

        label: formatBookGuideItineraryOptionLabel(item, t),

      })),

    [bindableOrders, t],

  );



  const modalTitle = isPinnedBindMode ? t("book_guide_replaceTitle") : t("book_guide_title");

  const modalDesc = orderAlreadyBoundToThisGuide

    ? t("book_guide_alreadyBoundDesc")

    : isPinnedBindMode

      ? t("book_guide_replaceDesc")

      : hasBindableItineraries

        ? t("book_guide_desc_itineraryFirst")

        : t("book_guide_desc_noItinerary");



  const primaryBindLabel = orderAlreadyBoundToThisGuide

    ? t("book_guide_returnToOrder")

    : isPinnedBindMode

      ? t("book_guide_replaceSelect")

      : t("book_guide_bindAndBook");



  return (

    <div

      className={p.glassModalScrim}

      role="dialog"

      aria-modal="true"

      aria-labelledby={titleId}

      aria-describedby={guideName ? `${subtitleId} ${descId}` : descId}

      onClick={(e) => {

        if (e.target === e.currentTarget) onClose();

      }}

    >

      <div ref={trapRef} className={p.glassModalPanel} onClick={(e) => e.stopPropagation()}>

        <h2 id={titleId} className="text-body font-semibold text-white">

          {modalTitle}

        </h2>

        {guideName ? (

          <p id={subtitleId} className="text-small text-slate-200 mt-1">

            {guideName}

          </p>

        ) : null}

        <p id={descId} className="text-small text-slate-300 mt-3 leading-relaxed">

          {modalDesc}

        </p>

        {tripLabel ? (

          <p className="text-small text-ref-sun/90 mt-2" data-tt-book-guide-trip="1">

            {t("book_guide_tripLabel").replace("{{range}}", tripLabel)}

          </p>

        ) : null}

        {tripMissing ? (

          <p className="mt-3 text-small text-amber-200/95 leading-relaxed" role="alert">

            {t("book_guide_tripRequired")}

          </p>

        ) : null}

        {!isPinnedBindMode && itinerariesLoading ? (

          <p className="mt-3 text-small text-slate-400" role="status">

            {t("common_loading")}

          </p>

        ) : null}

        {!isPinnedBindMode && !itinerariesLoading && hasBindableItineraries ? (

          <div className="mt-3">

            <label htmlFor={itinerarySelectId} className="text-small text-slate-200 block mb-1.5">

              {t("book_guide_itinerarySelectLabel")}

            </label>

            <select

              id={itinerarySelectId}

              data-tt-book-guide-itinerary-select="1"

              value={selectedOrderId}

              onChange={(e) => setSelectedOrderId(e.target.value)}

              className="w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-3 py-2.5 text-small text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55"

            >

              {itineraryOptions.map((opt) => (

                <option key={opt.id} value={opt.id}>

                  {opt.label}

                </option>

              ))}

            </select>

          </div>

        ) : null}

        {!isPinnedBindMode && !itinerariesLoading && !hasBindableItineraries ? (

          <p className="mt-3 text-small text-slate-300/95 leading-relaxed" role="status">

            {t("book_guide_noItineraryHint")}

          </p>

        ) : null}

        {bindError ? (

          <p className="mt-3 text-small text-rose-200/95 leading-relaxed" role="alert">

            {bindError}

          </p>

        ) : null}

        {itineraryHint ? (

          <p className="mt-3 text-small text-slate-400 leading-relaxed" role="status">

            {itineraryHint}

          </p>

        ) : null}

        <div className="mt-4 flex flex-col gap-2">

          {bindBlocked && !orderAlreadyBoundToThisGuide ? (

            <Link

              href={
                isPinnedBindMode && effectiveBindOrderId
                  ? marketHrefForEscrowGuideBind(effectiveBindOrderId)
                  : marketHrefForPickGuide()
              }

              onClick={onClose}

              className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full text-center`}

            >

              {t("book_guide_pickAnotherGuide")}

            </Link>

          ) : hasBindableItineraries || isPinnedBindMode || orderAlreadyBoundToThisGuide ? (

            <button

              type="button"

              disabled={bindSubmitDisabled}

              data-tt-book-guide-cta="primary"

              className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full text-center disabled:cursor-not-allowed disabled:opacity-45`}

              aria-busy={binding || preflightLoading || itinerariesLoading ? true : undefined}

              onClick={handleBindToOrder}

            >

              {binding

                ? t("common_submitting")

                : preflightLoading || itinerariesLoading

                  ? t("common_loading")

                  : primaryBindLabel}

            </button>

          ) : (

            <Link

              href={`/itinerary/new?guide_id=${encodeURIComponent(guideId)}`}

              data-tt-book-guide-cta="primary"

              className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full text-center ${

                tripMissing ? "pointer-events-none opacity-45" : ""

              }`}

              aria-disabled={tripMissing ? true : undefined}

              onClick={() => trackMarketEvent("market_book_guide_create_itinerary", { guideId })}

            >

              {t("book_guide_createFirst")}

            </Link>

          )}

          {!isPinnedBindMode ? (

            <>

              {hasBindableItineraries ? (

                <Link

                  href={`/itinerary/new?guide_id=${encodeURIComponent(guideId)}`}

                  data-tt-book-guide-cta="itinerary"

                  className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_GLASS} w-full text-center`}

                >

                  {t("book_guide_createAnother")}

                </Link>

              ) : null}

              <Link

                href={marketHrefForGuideCustomItinerary(guideId)}

                data-tt-book-guide-cta="market_custom"

                onClick={() => trackMarketEvent("market_book_guide_market_custom", { guideId })}

                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_GLASS} w-full text-center`}

              >

                {t("book_guide_marketCustom")}

              </Link>

            </>

          ) : null}

        </div>

        <form

          className="mt-4 w-full"

          onSubmit={(e) => {

            e.preventDefault();

            onClose();

          }}

        >

          <button

            type="submit"

            className={`${touchTargetLink44Classes} w-full text-small font-medium text-slate-300 hover:text-ref-sun underline underline-offset-2 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 rounded-[var(--radius-sm)]`}

            aria-label={t("book_guide_cancelClose")}

          >

            {t("common_cancel")}

          </button>

        </form>

      </div>

    </div>

  );

}


