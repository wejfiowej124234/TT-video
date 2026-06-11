"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { patchOrderItinerary, orderCancel, getIdempotencyKey } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useCatalogCityOptions } from "@/lib/catalogApi/useCatalogGeo";
import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import { resolveDestinationZhForPresetCities } from "@/lib/resolveDestinationZhForPresetCities";
import { stashEscrowOrderPrefetchFromOrderAndItinerary } from "@/lib/orderEscrowPrefetch";
import { getDayDescription, type UnifiedDayRow } from "@/lib/itineraryUnified";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";
import type { ItineraryBlock, OrderRow } from "./types";

/** `useRouter()` 子集，避免依赖 Next 内部类型路径 */
export interface EscrowDetailRouterLike {
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
}

export interface UseEscrowDetailPageOrchestrationArgs {
  escrowId: string;
  data: UseEscrowDetailResult;
  router: EscrowDetailRouterLike;
  t: (key: string) => string;
}

export function useEscrowDetailPageOrchestration({
  escrowId,
  data,
  router,
  t,
}: UseEscrowDetailPageOrchestrationArgs) {
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [patchItineraryError, setPatchItineraryError] = useState<string | null>(null);
  const [patchItinerarySuccess, setPatchItinerarySuccess] = useState(false);
  const [copySummaryDone, setCopySummaryDone] = useState(false);
  const [copySummaryBusy, setCopySummaryBusy] = useState(false);
  const [deleteOrderPending, setDeleteOrderPending] = useState(false);
  const [deleteOrderError, setDeleteOrderError] = useState<string | null>(null);
  const [draftDailyItinerary, setDraftDailyItinerary] = useState<UnifiedDayRow[]>([]);

  const itineraryForPatch = data.itinerary;
  const orderForDest = data.order;
  const canPatchItinerary = Boolean(
    data.isPreEscrowProtocol && itineraryForPatch && !itineraryForPatch.snapshot_hash,
  );

  const rowsFromApi = useMemo(
    () => (itineraryForPatch?.daily_itinerary ?? []) as UnifiedDayRow[],
    [itineraryForPatch?.daily_itinerary],
  );
  const destinationZh = useMemo(
    () =>
      resolveDestinationZhForPresetCities(
        orderForDest ? { destination: orderForDest.destination, country: orderForDest.country } : null,
        rowsFromApi,
      ),
    [orderForDest, rowsFromApi],
  );
  const destinationEditable = Boolean(destinationZh && isAllowedProductZhCountryName(destinationZh));
  const cityOptions = useCatalogCityOptions(destinationZh);
  const showDraftDayEditor = canPatchItinerary && rowsFromApi.length > 0;
  const showCityEditor =
    showDraftDayEditor && destinationEditable && cityOptions.length > 0;
  const dailyFingerprint = useMemo(
    () =>
      rowsFromApi
        .map((d) => `${d.day_index}|${d.city ?? ""}|${getDayDescription(d).slice(0, 200)}`)
        .join(";"),
    [rowsFromApi],
  );
  const rowsFromApiRef = useRef(rowsFromApi);
  rowsFromApiRef.current = rowsFromApi;

  const chatOrderContextInline = useMemo(() => {
    if (!data.order) return null;
    return { order: data.order as OrderRow, itinerary: data.itinerary ?? null };
  }, [data.order, data.itinerary]);

  useEffect(() => {
    if (!showDraftDayEditor) {
      setDraftDailyItinerary([]);
      return;
    }
    setDraftDailyItinerary(rowsFromApiRef.current.map((r) => ({ ...r })));
  }, [showDraftDayEditor, dailyFingerprint]);

  useEffect(() => {
    if (!patchItinerarySuccess) return;
    const timer = setTimeout(() => setPatchItinerarySuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [patchItinerarySuccess]);

  const handleCopySummary = useCallback(async () => {
    const order = data.order as OrderRow | null;
    const itinerary = data.itinerary;
    if (!order) return;
    const lines: string[] = [];
    const curr = order.currency ?? "";
    const pushBreakdown = (label: string, amount: number) => {
      lines.push(
        t("order_copySummary_breakdownLine")
          .replace("{{label}}", label)
          .replace("{{amount}}", String(amount))
          .replace("{{currency}}", curr),
      );
    };

    lines.push(t("order_copySummary_orderRef").replace("{{id}}", String(order.id)));
    const dest = (order as Record<string, unknown>).destination ?? (order as Record<string, unknown>).city;
    if (dest) lines.push(t("order_destLabel") + String(dest));
    const travelDate = (order as Record<string, unknown>).travel_date;
    if (travelDate) lines.push(t("order_copySummary_travelDate").replace("{{date}}", String(travelDate)));
    const days = (order as Record<string, unknown>).days;
    if (days != null) lines.push(t("order_copySummary_days").replace("{{n}}", String(days)));
    if (order.amount && order.currency) {
      lines.push(
        t("order_copySummary_total")
          .replace("{{amount}}", String(order.amount))
          .replace("{{currency}}", String(order.currency)),
      );
    }
    if (itinerary?.amount_breakdown) {
      const b = itinerary.amount_breakdown;
      if (b.hotel != null) pushBreakdown(t("order_hotel"), b.hotel);
      if (b.catering != null) pushBreakdown(t("order_catering"), b.catering);
      if (b.tickets != null) pushBreakdown(t("order_tickets"), b.tickets);
      if (b.guide_fee != null) pushBreakdown(t("order_guideFee"), b.guide_fee);
      if (b.vehicle != null) pushBreakdown(t("order_transportFee"), b.vehicle);
      if (b.platform_fee != null) pushBreakdown(t("order_copySummary_platformFee"), b.platform_fee);
    }
    const rowsCopy = (itinerary?.daily_itinerary ?? []) as UnifiedDayRow[];
    const canPatchCopy = Boolean(data.isPreEscrowProtocol && itinerary && !itinerary.snapshot_hash);
    const showDraftCopy = canPatchCopy && rowsCopy.length > 0;
    const draftAlignedCopy = showDraftCopy && draftDailyItinerary.length === rowsCopy.length;
    const dailyForCopy = draftAlignedCopy ? draftDailyItinerary : rowsCopy;
    if (dailyForCopy.length) {
      lines.push(t("order_copySummary_itineraryHeading"));
      dailyForCopy.forEach((day) => {
        const text = getDayDescription(day);
        const snippet = `${text.slice(0, 120)}${text.length > 120 ? "…" : ""}`;
        const dayLabel = t("order_dayN").replace("{{n}}", String(day.day_index ?? 0));
        lines.push(t("order_copySummary_dayLine").replace("{{day}}", dayLabel).replace("{{text}}", snippet));
      });
    }
    const text = lines.join("\n");
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopySummaryBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopySummaryDone(true);
      setTimeout(() => setCopySummaryDone(false), 2000);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("EscrowDetail copyAgreementSummary:", err);
      }
    } finally {
      setCopySummaryBusy(false);
    }
  }, [data.order, data.itinerary, data.isPreEscrowProtocol, draftDailyItinerary, t]);

  const stashEscrowDetailPayOrRatePrefetch = useCallback(() => {
    const o = data.order as OrderRow | null;
    if (!o) return;
    stashEscrowOrderPrefetchFromOrderAndItinerary(String(o.id), o, data.itinerary ?? null);
  }, [data.order, data.itinerary]);

  const onConfirmFinalPlanSuccess = useCallback(() => {
    data.refreshOrder();
    const path = `/escrow/${encodeURIComponent(escrowId)}`;
    router.replace(path);
    router.refresh();
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById("escrow-after-final-plan")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  }, [data, escrowId, router]);

  const draftRowsAligned = showDraftDayEditor && draftDailyItinerary.length === rowsFromApi.length;
  const itineraryListDays: UnifiedDayRow[] = draftRowsAligned ? draftDailyItinerary : rowsFromApi;

  const handleSaveItinerary = useCallback(async () => {
    const itinerary = data.itinerary as ItineraryBlock | null;
    const order = data.order as OrderRow | null;
    if (!itinerary || !order?.id || savingItinerary) return;
    setPatchItineraryError(null);
    setSavingItinerary(true);
    try {
      const body: Record<string, unknown> = {};
      const aligned = showDraftDayEditor && draftDailyItinerary.length === rowsFromApi.length;
      const dailyToPatch = aligned ? draftDailyItinerary : rowsFromApi;
      if (dailyToPatch.length) body.daily_itinerary = dailyToPatch;
      if (itinerary.amount_breakdown) body.amount_breakdown = itinerary.amount_breakdown;
      await patchOrderItinerary(String(order.id), body, getIdempotencyKey());
      setPatchItinerarySuccess(true);
      await data.refreshOrder({ force: true });
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("EscrowDetail patch itinerary:", e);
      }
      setPatchItineraryError(mapApiReadError(e, t, "escrow_saveItineraryFailed"));
    } finally {
      setSavingItinerary(false);
    }
  }, [
    data,
    draftDailyItinerary,
    rowsFromApi,
    savingItinerary,
    showDraftDayEditor,
    t,
  ]);

  const handleReorgRefresh = useCallback(() => {
    data.refreshOrder();
    data.setDismissReorgBanner(true);
  }, [data]);

  const handleTxConfirm = useCallback(
    (protocolPaused: boolean) => {
      if (protocolPaused) return;
      if (data.confirmAction === "deposit") {
        if (data.needsDepositApproval) return;
        data.deposit();
      } else if (data.confirmAction === "release") data.release();
      else if (data.confirmAction === "refund") data.refund();
    },
    [data],
  );

  const handleConfirmDispute = useCallback(
    (protocolPaused: boolean, reasonHash: `0x${string}`) => {
      if (protocolPaused) return;
      data.openDispute(reasonHash);
    },
    [data],
  );

  const submitDeleteOrder = useCallback(async () => {
    const order = data.order as OrderRow | null;
    if (!order?.id) return;
    if (!window.confirm(t("escrow_deleteConfirm"))) return;
    setDeleteOrderError(null);
    setDeleteOrderPending(true);
    try {
      await orderCancel(String(order.id), getIdempotencyKey());
      router.push("/orders");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "invalid_state" || msg.includes("409")) {
        router.push("/orders");
      } else {
        if (typeof window !== "undefined") {
          console.error("EscrowDetail orderCancel:", err);
        }
        setDeleteOrderError(mapApiReadError(err, t, "order_error_cancel_failed"));
      }
    } finally {
      setDeleteOrderPending(false);
    }
  }, [data.order, router, t]);

  return {
    savingItinerary,
    patchItineraryError,
    patchItinerarySuccess,
    copySummaryDone,
    copySummaryBusy,
    deleteOrderPending,
    deleteOrderError,
    draftDailyItinerary,
    setDraftDailyItinerary,
    canPatchItinerary,
    showDraftDayEditor,
    showCityEditor,
    cityOptions,
    draftRowsAligned,
    itineraryListDays,
    rowsFromApi,
    chatOrderContextInline,
    handleCopySummary,
    stashEscrowDetailPayOrRatePrefetch,
    onConfirmFinalPlanSuccess,
    handleSaveItinerary,
    handleReorgRefresh,
    handleTxConfirm,
    handleConfirmDispute,
    submitDeleteOrder,
  };
}

export type EscrowDetailPageOrchestration = ReturnType<typeof useEscrowDetailPageOrchestration>;
