"use client";

import { useState, useEffect, useCallback, useId, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { patchOrderItinerary, orderCancel, getIdempotencyKey } from "@/lib/apiClient";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import FinalityBadge from "../FinalityBadge";
import ChainSyncStatusPanel from "./ChainSyncStatusPanel";
import OnchainEventTimeline from "../OnchainEventTimeline";
import { normalizeChainSyncReadStatus, type ItineraryBlock, type OrderRow } from "./types";
import { useEscrowDetail } from "./useEscrowDetail";
import EscrowDetailHeader from "./EscrowDetailHeader";
import OrderFlowSteps, { orderStateToStep } from "../OrderFlowSteps";
import { orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";
import { mapApiReadError } from "@/lib/mapApiReadError";
import QuoteSummaryCard from "./QuoteSummaryCard";
import ChatBlock from "./ChatBlock";
import OrderActionsBlock from "./OrderActionsBlock";
import ReviewBlock from "./ReviewBlock";
import SetEscrowAddressBlock from "./SetEscrowAddressBlock";
import CreateOnChainEscrowBlock from "./CreateOnChainEscrowBlock";
import { getEscrowFactoryAddress } from "@/lib/escrowFactoryEnv";
import EscrowTxModal from "./EscrowTxModal";
import EscrowOnChainActions from "./EscrowOnChainActions";
import ReorgBanner from "./ReorgBanner";
import EscrowRiskNotice from "./EscrowRiskNotice";
import EscrowCancelPolicySection from "./EscrowCancelPolicySection";
import BilateralConfirmBlock from "./BilateralConfirmBlock";
import OrderMessageLink from "./OrderMessageLink";
import EscrowDetailSkeleton from "./EscrowDetailSkeleton";
import EscrowChainReadDegradedBanner from "./EscrowChainReadDegradedBanner";
import EscrowChainMismatchActions from "./EscrowChainMismatchActions";
import OrderEvidenceSection from "@/components/order/OrderEvidenceSection";
import DisputeResolutionFundBlock from "./DisputeResolutionFundBlock";
import UnifiedItineraryList from "@/components/itinerary/UnifiedItineraryList";
import { getDayDescription, type UnifiedDayRow } from "@/lib/itineraryUnified";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import { resolveDestinationZhForPresetCities } from "@/lib/resolveDestinationZhForPresetCities";
import { stashEscrowOrderPrefetchFromOrderAndItinerary } from "@/lib/orderEscrowPrefetch";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { useMeta } from "@/components/MetaProvider";
import { readProtocolPauseFromMeta } from "@/lib/readProtocolPauseFromMeta";
import {
  deepShellPillControlFocusClasses,
  marketCyanInlineLinkFocusClasses,
  marketCyanPillControlFocusClasses,
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

export interface EscrowDetailProps {
  escrowId: string;
}

export default function EscrowDetail({ escrowId }: EscrowDetailProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useEscrowDetail(escrowId, t);
  const { meta } = useMeta();
  const protocolPaused = useMemo(() => readProtocolPauseFromMeta(meta), [meta]);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [patchItineraryError, setPatchItineraryError] = useState<string | null>(null);
  const [patchItinerarySuccess, setPatchItinerarySuccess] = useState(false);
  const [copySummaryDone, setCopySummaryDone] = useState(false);
  const [copySummaryBusy, setCopySummaryBusy] = useState(false);
  const [deleteOrderPending, setDeleteOrderPending] = useState(false);
  const [deleteOrderError, setDeleteOrderError] = useState<string | null>(null);
  const [draftDailyItinerary, setDraftDailyItinerary] = useState<UnifiedDayRow[]>([]);
  const cancelPolicyHeadingId = useId();

  const itineraryForPatch = data.itinerary;
  const orderForDest = data.order;
  const canPatchItinerary = Boolean(
    data.isDraft && itineraryForPatch && !itineraryForPatch.snapshot_hash,
  );

  const rowsFromApi = useMemo(
    () => (itineraryForPatch?.daily_itinerary ?? []) as UnifiedDayRow[],
    [itineraryForPatch?.daily_itinerary],
  );
  const destinationZh = useMemo(
    () =>
      resolveDestinationZhForPresetCities(
        orderForDest
          ? { destination: orderForDest.destination, country: orderForDest.country }
          : null,
        rowsFromApi,
      ),
    [orderForDest, rowsFromApi],
  );
  const destinationEditable = Boolean(destinationZh && isAllowedProductZhCountryName(destinationZh));
  /** 可 PATCH 且已有按日行程时维护本地草稿（城市 + 每日文案） */
  const showDraftDayEditor = canPatchItinerary && rowsFromApi.length > 0;
  const showCityEditor =
    showDraftDayEditor && destinationEditable && (CITIES_BY_COUNTRY[destinationZh] ?? []).length > 0;
  const dailyFingerprint = useMemo(
    () =>
      rowsFromApi
        .map((d) => `${d.day_index}|${d.city ?? ""}|${getDayDescription(d).slice(0, 200)}`)
        .join(";"),
    [rowsFromApi],
  );
  const rowsFromApiRef = useRef(rowsFromApi);
  rowsFromApiRef.current = rowsFromApi;

  /** ChatBlock 内联上下文：须在 error / loading 分支之前声明，满足 hooks 顺序（53-S7） */
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
    const t = setTimeout(() => setPatchItinerarySuccess(false), 3000);
    return () => clearTimeout(t);
  }, [patchItinerarySuccess]);

  /** 53-S15：复制摘要。必须在所有 early return 之前调用，保证 hook 数量稳定。 */
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
          .replace("{{currency}}", curr)
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
          .replace("{{currency}}", String(order.currency))
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
    const canPatchCopy = Boolean(data.isDraft && itinerary && !itinerary.snapshot_hash);
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
  }, [data.order, data.itinerary, data.isDraft, draftDailyItinerary, t]);

  /** `/escrow/:id/rate` 与页脚 Pay hub：同快照 `order`+`itinerary`（07 §六 6.4 预填台账） */
  const stashEscrowDetailPayOrRatePrefetch = useCallback(() => {
    const o = data.order as OrderRow | null;
    if (!o) return;
    stashEscrowOrderPrefetchFromOrderAndItinerary(String(o.id), o, data.itinerary ?? null);
  }, [data.order, data.itinerary]);

  /** B-070：终版确认成功后直达 `/escrow/:id` 并刷新；须在 early return 之前声明，满足 hooks 顺序 */
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
  }, [data.refreshOrder, escrowId, router]);

  if (data.error) {
    if (typeof window !== "undefined") {
      console.error("EscrowDetail load error:", data.error);
    }
    return (
      <main className="space-y-4" aria-label={t("escrow_detailAria")}>
        <h1 className="sr-only">{t("escrow_errorTitle")}</h1>
        <ApiErrorAlert message={data.error} />
        <div className="flex flex-wrap items-center gap-2">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              data.refreshOrder();
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-200 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {t("escrow_backToOrders")}
          </Link>
        </div>
        <div className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 p-4 space-y-2">
          <h3 className="text-body-l font-semibold text-cyan-200">{t("escrow_itineraryBudget")}</h3>
          <p className="text-meta text-slate-300 leading-relaxed" role="status">
            {t("escrow_itineraryLockHint")}
          </p>
        </div>
        <EscrowCancelPolicySection headingId={cancelPolicyHeadingId} />
        <ProductCrossNav ariaLabelKey="escrow_detail_relatedNav_aria" showGuides />
      </main>
    );
  }
  if (!data.order) {
    return <EscrowDetailSkeleton />;
  }

  const order = data.order as OrderRow;
  const itinerary = data.itinerary;
  const onConfirmedRefresh = () => data.refreshOrder();
  const cityOptions = CITIES_BY_COUNTRY[destinationZh] ?? [];
  const draftRowsAligned = showDraftDayEditor && draftDailyItinerary.length === rowsFromApi.length;
  const itineraryListDays: UnifiedDayRow[] = draftRowsAligned ? draftDailyItinerary : rowsFromApi;
  const handleSaveItinerary = async () => {
    if (!itinerary || !order?.id || savingItinerary) return;
    setPatchItineraryError(null);
    setSavingItinerary(true);
    try {
      const body: Record<string, unknown> = {};
      const dailyToPatch = draftRowsAligned ? draftDailyItinerary : rowsFromApi;
      if (dailyToPatch.length) body.daily_itinerary = dailyToPatch;
      if (itinerary.amount_breakdown) body.amount_breakdown = itinerary.amount_breakdown;
      await patchOrderItinerary(String(order.id), body, getIdempotencyKey());
      setPatchItinerarySuccess(true);
      onConfirmedRefresh();
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("EscrowDetail patch itinerary:", e);
      }
      setPatchItineraryError(mapApiReadError(e, t, "escrow_saveItineraryFailed"));
    } finally {
      setSavingItinerary(false);
    }
  };
  const handleReorgRefresh = () => {
    data.refreshOrder();
    data.setDismissReorgBanner(true);
  };
  const handleTxConfirm = () => {
    if (protocolPaused) return;
    if (data.confirmAction === "deposit") {
      if (data.needsDepositApproval) return;
      data.deposit();
    } else if (data.confirmAction === "release") data.release();
    else if (data.confirmAction === "refund") data.refund();
  };

  const handleConfirmDispute = (reasonHash: `0x${string}`) => {
    if (protocolPaused) return;
    data.openDispute(reasonHash);
  };

  /* 53-S4：协议控制台区采用 30-DID 赛博朋克（附录 D D3：order-protocol-zone） */
  const protocolZoneClass = "order-protocol-zone rounded-[var(--radius-xl)] bg-slate-950 text-slate-200 space-y-6 p-4 md:p-6";
  const panelClass = "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md shadow-scifi-panel";

  return (
    <main className="space-y-10" role="main" aria-label={t("escrow_detailAria")}>
      {data.chainMismatch && (
        <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-4" role="alert">
          <p className="text-small font-semibold text-danger">{t("escrow_wrongChain")}</p>
          <p className="text-small text-slate-800 mt-0.5">{t("escrow_wrongChainDesc").replace("{expectedChainId}", String(data.expectedChainId)).replace("{chainId}", String(data.chainId))}</p>
          <EscrowChainMismatchActions
            isConnected={data.isConnected}
            expectedChainId={data.expectedChainId}
            chainId={data.chainId}
            variantDid={false}
          />
        </div>
      )}
      {data.hasEscrow && data.disputeWindowExpired && (
        <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-4" role="alert">
          <p className="text-small font-semibold text-danger">{t("escrow_disputeWindowExpired")}</p>
          <p className="text-small text-slate-800 mt-0.5">{t("escrow_disputeWindowExpiredDesc").replace("{deadline}", data.disputeDeadlineAt ?? "")}</p>
        </div>
      )}

      <div data-zone="order-protocol" className={protocolZoneClass} role="region" aria-label={t("order_protocolZoneAria")}>
        {protocolPaused ? (
          <div
            className="rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 p-4 space-y-1"
            role="status"
          >
            <p className="text-small font-semibold text-amber-200">{t("escrow_protocolPause_title")}</p>
            <p className="text-small text-slate-200 leading-relaxed">{t("escrow_protocolPause_body")}</p>
          </div>
        ) : null}
        <EscrowDetailHeader
          order={order}
          state={data.state}
          hasEscrow={data.hasEscrow}
          isDraft={data.isDraft}
          escrowId={escrowId}
          chainSync={data.chainSync}
          variantDid
        />

        <div id="escrow-after-final-plan" className="scroll-mt-24 outline-none" tabIndex={-1}>
          <OrderFlowSteps
            currentStep={orderStateToStep(order)}
            statusLabel={t(orderStateToStatusLabelKey(order))}
            variant="did"
          />
        </div>

      {data.isDraft && itinerary ? (
        <div className={`${panelClass} p-6 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-body-l font-semibold text-cyan-200">{t("escrow_itineraryBudget")}</h3>
              {canPatchItinerary && (
                <p className="text-meta text-slate-300 mt-0.5" role="status">{t("escrow_saveItineraryHint")}</p>
              )}
              <p className="text-meta text-slate-300 mt-0.5" role="status">{t("escrow_itineraryLockHint")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canPatchItinerary && (
                <form
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSaveItinerary();
                  }}
                >
                  <button
                    type="submit"
                    disabled={savingItinerary}
                    className={`px-4 py-2 text-small font-medium rounded-[var(--radius-md)] bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${marketCyanPillControlFocusClasses}`}
                    aria-busy={savingItinerary ? true : undefined}
                    aria-label={t("escrow_saveItinerary")}
                  >
                    {savingItinerary ? t("common_loading") : t("escrow_saveItinerary")}
                  </button>
                </form>
              )}
              {data.isDraft && (
                <Link
                  href={`/itinerary/new?fromOrder=${encodeURIComponent(String(order.id))}`}
                  className={`text-small font-medium text-cyan-300 hover:text-cyan-100 hover:underline transition-colors ${marketCyanInlineLinkFocusClasses}`}
                  aria-label={t("escrow_editItineraryLink")}
                >
                  {t("escrow_editItineraryLink")}
                </Link>
              )}
              {/* 54-S5：草稿态/可取消态提供「删除订单」入口，与 04 cancel API 一致；54 文档 2.6.2 确认（可选） */}
              {(data.isDraft || data.state === "created" || data.state === "accepted") && (
                <form
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void (async () => {
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
                    })();
                  }}
                >
                  <button
                    type="submit"
                    disabled={deleteOrderPending}
                    className="text-small font-medium text-danger/90 hover:text-danger hover:underline transition-colors disabled:opacity-50 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    aria-label={t("escrow_deleteOrder")}
                    aria-busy={deleteOrderPending ? true : undefined}
                  >
                    {deleteOrderPending ? t("common_submitting") : t("escrow_deleteOrder")}
                  </button>
                </form>
              )}
            </div>
          </div>
          {deleteOrderError && (
            <p className="text-small text-danger" role="alert">{deleteOrderError}</p>
          )}
          {patchItineraryError && (
            <p className="text-small text-danger" role="alert">{patchItineraryError}</p>
          )}
          {patchItinerarySuccess && (
            <p className="text-small text-success" role="status">{t("escrow_saveItinerarySuccess")}</p>
          )}
          <OrderMessageLink orderId={String(order.id)} variantDid compact />
          {showCityEditor && (
            <div className="rounded-[var(--radius-sm)] border border-cyan-500/25 bg-slate-950/40 p-4 space-y-3">
              <p className="text-meta text-slate-300">{t("escrow_draftDayCityHint")}</p>
              <ul className="space-y-2 list-none p-0 m-0">
                {(draftRowsAligned ? draftDailyItinerary : rowsFromApi).map((row, idx) => {
                  const rawCity = String(row.city ?? "").trim();
                  const validCityValues = new Set(cityOptions.map((c) => c.value));
                  const unknownPresetCity = rawCity !== "" && !validCityValues.has(rawCity);
                  return (
                    <li key={`city-${row.day_index}-${idx}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label
                        htmlFor={`escrow-day-city-${escrowId}-${idx}`}
                        className="text-small font-medium text-slate-200 shrink-0 min-w-[6rem]"
                      >
                        {t("order_dayN").replace("{{n}}", String(row.day_index ?? idx + 1))}
                      </label>
                      <select
                        id={`escrow-day-city-${escrowId}-${idx}`}
                        value={rawCity}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraftDailyItinerary((prev) => {
                            const base =
                              prev.length === rowsFromApi.length
                                ? prev.map((x) => ({ ...x }))
                                : rowsFromApi.map((r) => ({ ...r }));
                            return base.map((r, i) =>
                              i === idx ? { ...r, city: v.trim() ? v.trim() : undefined } : r,
                            );
                          });
                        }}
                        className="inline-flex w-full min-h-[44px] sm:max-w-xs items-center justify-start rounded-[var(--radius-md)] border border-cyan-500/35 bg-slate-950/80 text-small text-slate-100 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        aria-invalid={unknownPresetCity ? true : undefined}
                      >
                        <option value="">{t("escrow_draftDayCityPlaceholder")}</option>
                        {unknownPresetCity ? (
                          <option value={rawCity}>
                            {t("escrow_draftDayCityUnknownOption").replace("{{city}}", rawCity)}
                          </option>
                        ) : null}
                        {cityOptions.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {showDraftDayEditor && (
            <div className="rounded-[var(--radius-sm)] border border-cyan-500/25 bg-slate-950/40 p-4 space-y-3">
              <p className="text-meta text-slate-300">{t("escrow_draftDayNarrativeHint")}</p>
              <ul className="space-y-3 list-none p-0 m-0">
                {(draftRowsAligned ? draftDailyItinerary : rowsFromApi).map((row, idx) => (
                  <li key={`narr-${row.day_index}-${idx}`} className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`escrow-day-narrative-${escrowId}-${idx}`}
                      className="text-small font-medium text-slate-200"
                    >
                      {t("order_dayN").replace("{{n}}", String(row.day_index ?? idx + 1))}
                    </label>
                    <textarea
                      id={`escrow-day-narrative-${escrowId}-${idx}`}
                      value={getDayDescription(row)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraftDailyItinerary((prev) => {
                          const base =
                            prev.length === rowsFromApi.length
                              ? prev.map((x) => ({ ...x }))
                              : rowsFromApi.map((r) => ({ ...r }));
                          return base.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  description: v,
                                  content_text: "",
                                }
                              : r,
                          );
                        });
                      }}
                      rows={4}
                      maxLength={16000}
                      placeholder={t("escrow_draftDayNarrativePlaceholder")}
                      className="w-full rounded-[var(--radius-md)] border border-cyan-500/35 bg-slate-950/80 text-small text-slate-100 px-3 py-2 resize-y min-h-[5rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {itineraryListDays.length > 0 && (
            <UnifiedItineraryList days={itineraryListDays} variant="did" t={t} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            <div className="lg:col-span-2">
              <ChatBlock orderId={String(order.id)} variant="did" orderContextInline={chatOrderContextInline} />
            </div>
            <div className="lg:col-span-1">
              <QuoteSummaryCard
                amount={data.amount}
                currency={data.currency}
                amountBreakdown={itinerary.amount_breakdown ?? null}
                version={itinerary.version}
                snapshotHash={data.snapshotHash}
                orderId={String(order.id)}
                isDraft={data.isDraft}
                onConfirmed={onConfirmFinalPlanSuccess}
                variantDid
                protocolPaused={protocolPaused}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className={`${panelClass} p-4 space-y-2`}>
          <h3 className="text-body-l font-semibold text-cyan-200">{t("escrow_itineraryBudget")}</h3>
          <p className="text-meta text-slate-300 leading-relaxed" role="status">
            {t("escrow_itineraryLockHint")}
          </p>
        </div>
      )}

      <div className={`${panelClass} p-6 md:p-8 space-y-6`}>
        <div>
          <p className="text-small text-slate-300">{t("escrow_amountCurrency")}</p>
          <h2 className="text-h3 font-semibold tracking-tight font-mono text-cyan-300 drop-shadow-scifi-cyan-title">
            {data.amount} {data.currency}
          </h2>
        </div>
        <div>
          <p className="text-small text-slate-300">{t("escrow_participants")}</p>
          <ul className="text-small text-slate-300 space-y-1">
            <li>
              {t("escrow_tourist")}
              {order.tourist_id ? `${String(order.tourist_id).slice(0, 8)}…` : t("ui_em_dash")}
            </li>
            <li>{t("escrow_guide")}{order.guide_id && /[1-9a-fA-F]/.test(String(order.guide_id)) ? `${String(order.guide_id).slice(0, 8)}…` : t("escrow_guideUnassigned")}</li>
            <li>{t("escrow_arbitrator")}{(order as OrderRow & { arbitrator_id?: string }).arbitrator_id ? `${String((order as OrderRow & { arbitrator_id?: string }).arbitrator_id).slice(0, 8)}…` : t("escrow_arbitratorUnassigned")}</li>
          </ul>
        </div>
        {data.hasEscrow && !data.chainMismatch && data.chainContractReadDegraded ? (
          <EscrowChainReadDegradedBanner lastChainContractReadOkAt={data.lastChainContractReadOkAt} t={t} />
        ) : null}
        <FinalityBadge
          finalityBlock={data.hasEscrow ? (order as OrderRow & { finality_block?: number | null }).finality_block : undefined}
          escrowBlockNumber={data.hasEscrow ? (order as OrderRow & { escrow_block_number?: number | null }).escrow_block_number : undefined}
          confirmBlocks={data.chainSync?.finalityN ?? 12}
          createdAt={order.created_at}
          variant="dark"
          readModelSyncStatus={
            data.chainSync ? normalizeChainSyncReadStatus(data.chainSync.syncStatus) : null
          }
        />
        {data.chainSync ? (
          <ChainSyncStatusPanel chainSync={data.chainSync} t={t} variant="dark" />
        ) : null}
        {data.hasEscrow && data.snapshotHash && (
          <div>
            <p className="text-small text-slate-300">{t("agree_label_snapshot_hash")}</p>
            <p className="text-meta font-mono text-slate-300 break-all">{data.snapshotHash}</p>
          </div>
        )}
        {data.hasEscrow && !data.snapshotHash && (
          <p className="text-meta text-slate-400 leading-relaxed" role="status">
            {t("escrow_snapshotHashMissingNeutral")}
          </p>
        )}
        {data.hasEscrow && (
          <OnchainEventTimeline
            events={(order as OrderRow & { onchain_events?: { type: string; block?: number; txHash?: string; at?: string }[] }).onchain_events}
            title={t("escrow_txHistory")}
            variantDid
            readModelSyncStatusRaw={data.chainSync?.syncStatus ?? null}
          />
        )}
        {order.chat_confirm_deadline && [2, 3].includes(orderStateToStep(order)) && (
          <p className="text-meta text-slate-300" role="status">
            {t("order_chatConfirmDeadlineHint").replace("{{date}}", new Date(order.chat_confirm_deadline).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }))}
          </p>
        )}
        {order.payment_deadline && [4, 5].includes(orderStateToStep(order)) && (
          <p className="text-meta text-slate-300" role="status">
            {t("order_paymentDeadlineHint").replace("{{date}}", new Date(order.payment_deadline).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }))}
          </p>
        )}
        {order.rating_deadline && orderStateToStep(order) === 7 && (
          <p className="text-meta text-slate-300" role="status">
            {t("order_ratingDeadlineHint").replace(
              "{{date}}",
              new Date(order.rating_deadline).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }),
            )}
          </p>
        )}
      </div>

      {orderStateToStep(order) === 3 && !data.hasEscrow && (
        <BilateralConfirmBlock
          orderId={String(order.id)}
          isGuide={!!data.meData?.guide}
          touristConfirmed={(order as OrderRow & { tourist_confirmed?: boolean }).tourist_confirmed}
          guideConfirmed={(order as OrderRow & { guide_confirmed?: boolean }).guide_confirmed}
          onSuccess={data.refreshOrder}
          variantDid
          protocolPaused={protocolPaused}
        />
      )}

      {!data.isDraft && [2, 3, 4].includes(orderStateToStep(order)) && (
        <OrderMessageLink orderId={String(order.id)} variantDid />
      )}

      <EscrowTxModal
        confirmAction={data.confirmAction}
        onClose={() => data.setConfirmAction(null)}
        onConfirm={handleTxConfirm}
        onConfirmDispute={handleConfirmDispute}
        protocolPaused={protocolPaused}
        order={order}
        amount={data.amount}
        currency={data.currency}
        snapshotHash={data.snapshotHash}
        chainId={data.chainId}
        expectedChainId={data.expectedChainId}
        settlementTokenAddress={data.settlementTokenAddress}
        settlementTokenSymbol={data.settlementTokenSymbol}
        depositAmountOnChain={data.depositAmount}
        pending={data.txModalPending}
        success={data.txModalSuccess}
        failed={data.txModalFailed}
        txError={data.txErrorMessage.trim() ? data.txErrorMessage : null}
        onDismissTxError={data.resetChainWriteError}
        variantDid
      />

      {!data.hasEscrow && !data.isDraft && (
        getEscrowFactoryAddress() ? (
          <CreateOnChainEscrowBlock
            order={order}
            itinerary={itinerary}
            snapshotHash={data.snapshotHash}
            meUserId={data.meData?.user?.id}
            meDefaultWallet={data.meData?.user?.default_wallet_address ?? undefined}
            connectedAddress={data.connectedAddress}
            isConnected={data.isConnected}
            chainId={data.chainId}
            expectedChainId={data.expectedChainId}
            chainMismatch={data.chainMismatch}
            refreshOrder={data.refreshOrder}
            panelClassName={panelClass + " p-6 space-y-3"}
            variantDid
            protocolPaused={protocolPaused}
          />
        ) : (
          <SetEscrowAddressBlock
            orderId={String(order.id)}
            onSuccess={data.refreshOrder}
            variantDid
            protocolPaused={protocolPaused}
          />
        )
      )}

      {!data.isDraft && (
        <OrderActionsBlock
          orderId={String(order.id)}
          state={data.state}
          hasEscrow={data.hasEscrow}
          onSuccess={data.refreshOrder}
          guideWalletAddress={data.meData?.guide?.wallet_address ?? null}
          connectedAddress={data.connectedAddress ?? null}
          escrowAddress={order.escrow_address ?? null}
          expectedChainId={data.expectedChainId}
          disputeWindowExpired={data.disputeWindowExpired}
          variantDid
          protocolPaused={protocolPaused}
        />
      )}

      {!data.isDraft && (
        <OrderEvidenceSection orderId={String(order.id)} panelClassName={panelClass} variantDid />
      )}

      {!data.isDraft && (
        <DisputeResolutionFundBlock
          orderId={String(order.id)}
          orderAmountStr={String(data.amount)}
          currency={String(data.currency ?? "")}
          orderState={data.state}
          variantDid
        />
      )}

      {data.state === "completed" && (
        <>
          {orderStateToStep(order) >= 7 && (
            <div className={`${panelClass} p-4`}>
              <h3 className="text-small font-semibold text-cyan-200 mb-1">{t("order_ratingEntry")}</h3>
              <p className="text-small text-slate-300 mb-3 leading-relaxed">{t("order_ratingEntryDesc")}</p>
              <Link
                href={`/escrow/${encodeURIComponent(String(order.id))}/rate`}
                onClick={stashEscrowDetailPayOrRatePrefetch}
                className={`${touchTargetLink44Classes} inline-flex items-center gap-2 text-small font-medium text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors ${marketCyanInlineLinkFocusClasses}`}
                aria-label={t("order_ratingEntryCta")}
              >
                {t("order_ratingEntryCta")}
              </Link>
            </div>
          )}
          <ReviewBlock orderId={String(order.id)} variantDid />
        </>
      )}

      {data.hasEscrow && orderStateToStep(order) === 8 && (
        <p className="text-small text-slate-300 leading-relaxed" role="status">
          {t("escrow_releaseAfterRatingHint")}
        </p>
      )}
      {data.hasEscrow && (
        <EscrowOnChainActions
          isConnected={data.isConnected}
          chainMismatch={data.chainMismatch}
          expectedChainId={data.expectedChainId}
          chainId={data.chainId}
          confirmAction={data.confirmAction}
          pending={data.txSectionPending}
          success={data.txSectionSuccess}
          failed={data.txSectionFailed}
          depositAmount={data.depositAmount}
          depositPending={data.depositPending}
          releasePending={data.releasePending}
          refundPending={data.refundPending}
          disputePending={data.disputePending}
          disputeDisabled={data.disputeWindowExpired}
          canOpenDisputeOnChain={data.canOpenDisputeOnChain}
          disputeOnChainUnavailableReasonKey={data.disputeOnChainUnavailableReasonKey}
          canDepositOnChain={data.canDepositOnChain}
          canReleaseOnChain={data.canReleaseOnChain}
          canRefundOnChain={data.canRefundOnChain}
          needsDepositApproval={data.needsDepositApproval}
          onApproveForDeposit={data.approveForDeposit}
          approveDepositPending={data.approveDepositPending}
          onSetConfirmAction={(a) => {
            if (protocolPaused) return;
            data.setConfirmAction(a);
          }}
          onDeposit={data.deposit}
          onRelease={data.release}
          onRefund={data.refund}
          txErrorMessage={data.txErrorMessage}
          onDismissTxError={data.resetChainWriteError}
          variantDid
          protocolPaused={protocolPaused}
        />
      )}

      {data.showReorgBanner && (
        <ReorgBanner onRefresh={handleReorgRefresh} onDismiss={() => data.setDismissReorgBanner(true)} variantDid />
      )}

      <EscrowRiskNotice disputeDeadlineAt={data.disputeDeadlineAt} disputeWindowExpired={data.disputeWindowExpired} />

      <EscrowCancelPolicySection headingId={cancelPolicyHeadingId} />

      <p className="text-small text-slate-300 flex flex-wrap items-center gap-4">
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof window !== "undefined") window.print();
          }}
        >
          <button type="submit" className={`text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors rounded-[var(--radius-sm)] ${deepShellPillControlFocusClasses}`} aria-label={t("order_printPage")}>
            {t("order_printPage")}
          </button>
        </form>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCopySummary();
          }}
        >
          <button
            type="submit"
            disabled={copySummaryBusy}
            aria-busy={copySummaryBusy ? true : undefined}
            className={`text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors disabled:opacity-60 disabled:cursor-wait rounded-[var(--radius-sm)] ${deepShellPillControlFocusClasses}`}
            aria-label={t("order_copySummary")}
          >
            {copySummaryDone ? t("order_copySummaryDone") : t("order_copySummary")}
          </button>
        </form>
        <Link href="/orders" className={`text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors rounded-[var(--radius-sm)] ${deepShellPillControlFocusClasses}`}>{t("escrow_backToOrders")}</Link>
        <Link
          href={`/pay?orderId=${encodeURIComponent(String(order.id))}`}
          onClick={stashEscrowDetailPayOrRatePrefetch}
          className={`text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors rounded-[var(--radius-sm)] ${deepShellPillControlFocusClasses}`}
        >
          {t("orders_payHub")}
        </Link>
      </p>
        <ProductCrossNav
          ariaLabelKey="escrow_detail_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors rounded-[var(--radius-sm)] ${deepShellPillControlFocusClasses}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </main>
  );
}
