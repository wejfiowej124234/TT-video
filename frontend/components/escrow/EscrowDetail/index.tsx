"use client";

import { useState, useEffect, useCallback, useId, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { patchOrderItinerary, orderCancel, getIdempotencyKey } from "@/lib/apiClient";
import EscrowDetailLoadErrorView from "./EscrowDetailLoadErrorView";
import FinalityBadge from "../FinalityBadge";
import ChainSyncStatusPanel from "./ChainSyncStatusPanel";
import OnchainEventTimeline from "../OnchainEventTimeline";
import { normalizeChainSyncReadStatus, type ItineraryBlock, type OrderRow } from "./types";
import { useEscrowDetail } from "./useEscrowDetail";
import EscrowDetailHeader from "./EscrowDetailHeader";
import OrderFlowSteps, { orderStateToStep, type DraftJourneyStep } from "../OrderFlowSteps";
import { orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";
import { mapApiReadError } from "@/lib/mapApiReadError";
import QuoteSummaryCard from "./QuoteSummaryCard";
import type { ConfirmPlanSummary } from "./ConfirmFinalPlanBlock";
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
import EscrowCopySummaryButton from "./EscrowCopySummaryButton";
import EscrowOrderPrintButton from "./EscrowOrderPrintButton";
import BilateralConfirmBlock from "./BilateralConfirmBlock";
import OrderMessageLink from "./OrderMessageLink";
import EscrowDetailSkeleton from "./EscrowDetailSkeleton";
import EscrowChainReadDegradedBanner from "./EscrowChainReadDegradedBanner";
import EscrowChainMismatchActions from "./EscrowChainMismatchActions";
import OrderEvidenceSection from "@/components/order/OrderEvidenceSection";
import DisputeResolutionFundBlock from "./DisputeResolutionFundBlock";
import UnifiedItineraryList from "@/components/itinerary/UnifiedItineraryList";
import {
  getDayDescription,
  itineraryHasStructuredBlocks,
  type UnifiedDayRow,
} from "@/lib/itineraryUnified";
import EscrowDraftGuideEmptyCard from "./EscrowDraftGuideEmptyCard";
import { marketHrefForEscrowGuideBind } from "@/lib/ordersGuideDeepLink";
import { isAssignedGuideId, isOrderPublishedToDiscover } from "@/lib/isAssignedGuideId";
import { canViewerAcceptOrder } from "@/lib/canViewerAcceptOrder";
import EscrowDraftGuideAssignedCard from "./EscrowDraftGuideAssignedCard";
import EscrowDraftPayStepCard from "./EscrowDraftPayStepCard";
import EscrowDraftMobileActionBar from "./EscrowDraftMobileActionBar";
import EscrowOrderGetRateLimitBanner from "./EscrowOrderGetRateLimitBanner";
import EscrowDraftDayNarrativePanel from "./EscrowDraftDayNarrativePanel";
import EscrowDraftPublishedBanner from "./EscrowDraftPublishedBanner";
import EscrowDraftAdvancedProtocolFold from "./EscrowDraftAdvancedProtocolFold";
import EscrowDraftItineraryTabBar, {
  type EscrowDraftItineraryTab,
} from "./EscrowDraftItineraryTabBar";
import EscrowDraftNextStepStrip from "./EscrowDraftNextStepStrip";
import EscrowDraftExperienceFooter from "./EscrowDraftExperienceFooter";
import EscrowDetailOrdersBreadcrumb from "./EscrowDetailOrdersBreadcrumb";
import {
  itineraryDescriptionsUniform,
  uniformItineraryDescription,
} from "@/lib/itineraryNarrativeUniform";
import { isEscrowExperienceDevToolsEnabled } from "@/lib/escrowExperienceDevTools";
import { formatEvenSplitAmount, resolveEvenSplitPerDay } from "@/lib/itineraryEvenSplit";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import { resolveDestinationZhForPresetCities } from "@/lib/resolveDestinationZhForPresetCities";
import { patchDraftDayCity } from "@/lib/itineraryDayContentSync";
import { stashEscrowOrderPrefetchFromOrderAndItinerary } from "@/lib/orderEscrowPrefetch";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { useMeta } from "@/components/MetaProvider";
import { readOrderMockPayEnabledFromMeta } from "@/lib/readOrderMockPayFromMeta";
import { readProtocolPauseFromMeta } from "@/lib/readProtocolPauseFromMeta";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";
import {
  TT_ESCROW_EXPERIENCE_ZONE,
  TT_ESCROW_EXPERIENCE_PANEL,
  TT_ESCROW_EXPERIENCE_PANEL_INNER,
  escrowExperienceHeadingClass,
  escrowExperienceMetaClass,
  escrowExperienceInputClass,
  escrowExperienceSelectClass,
  escrowExperienceMutedLinkClass,
  escrowExperienceFooterLinkClass,
  escrowExperienceSecondaryBtnClass,
  escrowExperienceDangerLinkClass,
  escrowExperienceLinkClass,
} from "@/lib/escrowExperienceUi";
import {
  TT_ESCROW_PROTOCOL_PAGE_SHELL,
  TT_ESCROW_PROTOCOL_ZONE,
  TT_ESCROW_PROTOCOL_PANEL,
  TT_ESCROW_PROTOCOL_PANEL_INNER,
  escrowProtocolDidTitleClass,
  escrowProtocolFooterActionClass,
  escrowProtocolHeadingClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolInputClass,
  escrowProtocolMetaClass,
  escrowProtocolSecondaryBtnClass,
  escrowProtocolSelectClass,
  escrowProtocolSubheadingClass,
} from "@/lib/escrowProtocolUi";
import {
  formatEscrowStablecoinCurrency,
  normalizeBreakdownTotals,
  resolveEscrowDisplayAmount,
} from "@/lib/escrowOrderAmountSsot";

export interface EscrowDetailProps {
  escrowId: string;
}

export default function EscrowDetail({ escrowId }: EscrowDetailProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useEscrowDetail(escrowId, t);
  const { meta } = useMeta();
  const protocolPaused = useMemo(() => readProtocolPauseFromMeta(meta), [meta]);
  const chainOffRestConfirmCompletionEnabled = useMemo(
    () => readOrderMockPayEnabledFromMeta(meta),
    [meta],
  );
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [patchItineraryError, setPatchItineraryError] = useState<string | null>(null);
  const [patchItinerarySuccess, setPatchItinerarySuccess] = useState(false);
  const [savePublishedToMarket, setSavePublishedToMarket] = useState(false);
  const [copySummaryDone, setCopySummaryDone] = useState(false);
  const [copySummaryBusy, setCopySummaryBusy] = useState(false);
  const [deleteOrderPending, setDeleteOrderPending] = useState(false);
  const [deleteOrderError, setDeleteOrderError] = useState<string | null>(null);
  const [draftDailyItinerary, setDraftDailyItinerary] = useState<UnifiedDayRow[]>([]);
  const [itineraryDraftDirty, setItineraryDraftDirty] = useState(false);
  const [quoteQuietSyncing, setQuoteQuietSyncing] = useState(false);
  const [quoteQuietSyncError, setQuoteQuietSyncError] = useState<string | null>(null);
  const [quoteAmountPersisted, setQuoteAmountPersisted] = useState(false);
  const amountQuietSyncFingerprintRef = useRef<string | null>(null);
  const amountQuietSyncInFlightRef = useRef(false);
  const cancelPolicyHeadingId = useId();
  const experienceDraftFlag = Boolean(data.isPreEscrowProtocol && !data.hasEscrow);

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
  const showNarrativeTabAvailable = showDraftDayEditor && !itineraryHasStructuredBlocks(rowsFromApi);
  const [itineraryTab, setItineraryTab] = useState<EscrowDraftItineraryTab>("preview");
  const orderCityTrim = String(orderForDest?.city ?? "").trim();
  const dailyFingerprint = useMemo(
    () =>
      rowsFromApi
        .map((d) => `${d.day_index}|${d.city ?? ""}|${getDayDescription(d).slice(0, 200)}`)
        .join(";"),
    [rowsFromApi],
  );
  const rowsFromApiRef = useRef(rowsFromApi);
  rowsFromApiRef.current = rowsFromApi;

  useEffect(() => {
    if (!showDraftDayEditor) {
      setDraftDailyItinerary([]);
      return;
    }
    setDraftDailyItinerary(rowsFromApiRef.current.map((r) => ({ ...r })));
  }, [showDraftDayEditor, dailyFingerprint]);

  useEffect(() => {
    if (!experienceDraftFlag || !showDraftDayEditor) return;
    if (rowsFromApi.length > 0) {
      setItineraryTab("preview");
    } else if (showCityEditor) {
      setItineraryTab("cities");
    } else if (showNarrativeTabAvailable) {
      setItineraryTab("narrative");
    }
  }, [
    escrowId,
    dailyFingerprint,
    experienceDraftFlag,
    showDraftDayEditor,
    showCityEditor,
    showNarrativeTabAvailable,
    rowsFromApi.length,
  ]);

  useEffect(() => {
    if (!patchItinerarySuccess) return;
    const t = setTimeout(() => setPatchItinerarySuccess(false), 3000);
    return () => clearTimeout(t);
  }, [patchItinerarySuccess]);

  useEffect(() => {
    if (isOrderPublishedToDiscover(data.order?.state ?? data.order?.status)) {
      setSavePublishedToMarket(true);
    }
  }, [data.order?.id, data.order?.state, data.order?.status]);

  /** ① 草稿：订单额与分项不一致时静默对齐一次（防重复 PATCH / 429） */
  useEffect(() => {
    if (!experienceDraftFlag || itineraryDraftDirty || savingItinerary) return;
    if (amountQuietSyncInFlightRef.current) return;
    const orderRow = data.order as OrderRow | null | undefined;
    const it = data.itinerary;
    if (!orderRow?.id || !it?.amount_breakdown || it.snapshot_hash) return;
    if (!data.isPreEscrowProtocol || data.hasEscrow) return;

    const resolved = resolveEscrowDisplayAmount(data.amount, it.amount_breakdown);
    if (!resolved.amountMismatch && !resolved.lineItemsMismatch) {
      setQuoteAmountPersisted(true);
      return;
    }

    const fingerprint = `${String(orderRow.id)}|v${it.version ?? 0}|${resolved.displayAmount}|${String(data.amount)}`;
    if (amountQuietSyncFingerprintRef.current === fingerprint) return;
    amountQuietSyncFingerprintRef.current = fingerprint;

    amountQuietSyncInFlightRef.current = true;
    setQuoteQuietSyncing(true);
    setQuoteQuietSyncError(null);
    void (async () => {
      try {
        const normalized = normalizeBreakdownTotals(it.amount_breakdown);
        if (!normalized) return;
        const patchRes = await patchOrderItinerary(
          String(orderRow.id),
          { amount_breakdown: normalized },
          getIdempotencyKey(),
        );
        const nextVersion =
          typeof (patchRes as { version?: number })?.version === "number"
            ? (patchRes as { version: number }).version
            : (it.version ?? 1) + 1;
        data.applyOptimisticItineraryPatch({
          amountBreakdown: normalized,
          version: nextVersion,
        });
        setQuoteAmountPersisted(true);
        setQuoteQuietSyncError(null);
      } catch (e) {
        amountQuietSyncFingerprintRef.current = null;
        if (typeof window !== "undefined") {
          console.error("EscrowDetail quiet amount sync:", e);
        }
        setQuoteQuietSyncError(mapApiReadError(e, t, "escrow_quoteQuietSyncFailed"));
      } finally {
        amountQuietSyncInFlightRef.current = false;
        setQuoteQuietSyncing(false);
      }
    })();
  }, [
    experienceDraftFlag,
    itineraryDraftDirty,
    savingItinerary,
    data.order,
    data.itinerary,
    data.amount,
    data.isPreEscrowProtocol,
    data.hasEscrow,
    data.applyOptimisticItineraryPatch,
  ]);

  useEffect(() => {
    const resolved = resolveEscrowDisplayAmount(data.amount, data.itinerary?.amount_breakdown ?? null);
    if (!resolved.amountMismatch && !resolved.lineItemsMismatch) {
      setQuoteAmountPersisted(true);
    }
  }, [data.amount, data.itinerary?.amount_breakdown, data.itinerary?.version]);

  useEffect(() => {
    if (itineraryDraftDirty) {
      setQuoteAmountPersisted(false);
      setSavePublishedToMarket(false);
    }
  }, [itineraryDraftDirty]);

  useEffect(() => {
    if (!quoteQuietSyncing) return;
    const timer = window.setTimeout(() => {
      amountQuietSyncInFlightRef.current = false;
      setQuoteQuietSyncing(false);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [quoteQuietSyncing]);

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
    if (itinerary?.amount_breakdown || order.amount) {
      const resolved = resolveEscrowDisplayAmount(order.amount, itinerary?.amount_breakdown ?? null);
      const draftExperience = Boolean(
        data.isPreEscrowProtocol && data.itinerary && !data.hasEscrow,
      );
      const cur = draftExperience
        ? formatEscrowStablecoinCurrency(String(order.currency ?? ""))
        : String(order.currency ?? "");
      lines.push(
        t("order_copySummary_total")
          .replace("{{amount}}", resolved.displayAmount)
          .replace("{{currency}}", cur),
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
  }, [data.order, data.itinerary, data.isPreEscrowProtocol, data.hasEscrow, draftDailyItinerary, t]);

  /** `/escrow/:id/rate` 与页脚 Pay hub：同快照 `order`+`itinerary`（07 §六 6.4 预填台账） */
  const stashEscrowDetailPayOrRatePrefetch = useCallback(() => {
    const o = data.order as OrderRow | null;
    if (!o) return;
    stashEscrowOrderPrefetchFromOrderAndItinerary(String(o.id), o, data.itinerary ?? null);
  }, [data.order, data.itinerary]);

  /** B-070：终版确认成功后直达 `/escrow/:id` 并刷新；须在 early return 之前声明，满足 hooks 顺序 */
  const onConfirmFinalPlanSuccess = useCallback(() => {
    data.refreshOrder({ force: true });
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

  const draftRowsAligned = showDraftDayEditor && draftDailyItinerary.length === rowsFromApi.length;
  const rowsForCityUi = draftRowsAligned ? draftDailyItinerary : rowsFromApi;
  const showCityEditorUi = useMemo(() => {
    if (!showCityEditor || rowsForCityUi.length === 0) return false;
    if (rowsForCityUi.length > 1) {
      const cities = rowsForCityUi.map((r) => String(r.city ?? "").trim()).filter(Boolean);
      const unique = new Set(cities);
      if (unique.size > 1) return true;
      return cities.length > 0 && cities[0] !== orderCityTrim;
    }
    const dayCity = String(rowsForCityUi[0]?.city ?? "").trim();
    return dayCity !== "" && dayCity !== orderCityTrim;
  }, [showCityEditor, rowsForCityUi, orderCityTrim]);

  const confirmPlanSummary = useMemo((): ConfirmPlanSummary | null => {
    if (!experienceDraftFlag || !data.order) return null;
    const resolved = resolveEscrowDisplayAmount(data.amount, data.itinerary?.amount_breakdown ?? null);
    const o = data.order as OrderRow;
    const ab = data.itinerary?.amount_breakdown;
    const curr = formatEscrowStablecoinCurrency(data.currency);
    const breakdownLines: ConfirmPlanSummary["breakdownLines"] = [];
    if (ab) {
      const keys: { key: keyof NonNullable<typeof ab>; i18n: string }[] = [
        { key: "hotel", i18n: "escrow_hotel" },
        { key: "catering", i18n: "escrow_catering" },
        { key: "tickets", i18n: "escrow_tickets" },
        { key: "guide_fee", i18n: "escrow_guideFee" },
        { key: "vehicle", i18n: "escrow_vehicle" },
        { key: "platform_fee", i18n: "escrow_platformFee" },
      ];
      for (const { key, i18n } of keys) {
        const v = ab[key];
        if (v == null || !Number.isFinite(v)) continue;
        breakdownLines.push({ label: t(i18n), amount: v.toFixed(2) });
      }
    }
    return {
      destination: String(o.destination ?? "").trim() || undefined,
      city: orderCityTrim || undefined,
      days: rowsForCityUi.length || 1,
      totalDisplay: resolved.displayAmount,
      currency: curr,
      breakdownLines: breakdownLines.length > 0 ? breakdownLines : undefined,
    };
  }, [
    experienceDraftFlag,
    data.order,
    data.amount,
    data.itinerary?.amount_breakdown,
    data.currency,
    orderCityTrim,
    rowsForCityUi.length,
    t,
  ]);

  if (data.error) {
    if (typeof window !== "undefined") {
      console.error("EscrowDetail load error:", data.error);
    }
    return (
      <EscrowDetailLoadErrorView
        message={data.error}
        onRetry={() => data.refreshOrder({ force: true })}
        cancelPolicyHeadingId={cancelPolicyHeadingId}
        t={t}
        orderGetRateLimited={data.orderGetRateLimited}
        variantExperience
      />
    );
  }
  if (!data.order) {
    return (
      <div className={TT_ESCROW_PROTOCOL_PAGE_SHELL}>
        <div className="container py-8 md:py-12 max-w-5xl space-y-4">
          {data.orderGetRateLimited ? (
            <EscrowOrderGetRateLimitBanner onRetry={() => data.refreshOrder({ force: true })} />
          ) : null}
          <EscrowDetailSkeleton />
        </div>
      </div>
    );
  }

  const order = data.order as OrderRow;
  const itinerary = data.itinerary;
  const onConfirmedRefresh = () => data.refreshOrder();
  const cityOptions = CITIES_BY_COUNTRY[destinationZh] ?? [];
  const itineraryListDays: UnifiedDayRow[] = rowsForCityUi;
  const handleSaveItinerary = async () => {
    if (!itinerary || !order?.id || savingItinerary) return;
    setPatchItineraryError(null);
    setSavingItinerary(true);
    try {
      const body: Record<string, unknown> = {};
      const dailyToPatch = draftRowsAligned ? draftDailyItinerary : rowsFromApi;
      if (dailyToPatch.length) body.daily_itinerary = dailyToPatch;
      if (itinerary.amount_breakdown) {
        body.amount_breakdown = normalizeBreakdownTotals(itinerary.amount_breakdown);
      }
      const patchRes = await patchOrderItinerary(String(order.id), body, getIdempotencyKey());
      const nextVersion =
        typeof (patchRes as { version?: number })?.version === "number"
          ? (patchRes as { version: number }).version
          : (itinerary.version ?? 1) + 1;
      const published = (patchRes as { published_to_market?: boolean }).published_to_market === true;
      const orderStateFromPatch = (patchRes as { order_state?: string }).order_state;
      setSavePublishedToMarket(published);
      setPatchItinerarySuccess(true);
      setItineraryDraftDirty(false);
      setQuoteAmountPersisted(true);
      setQuoteQuietSyncError(null);
      data.applyOptimisticItineraryPatch({
        amountBreakdown: body.amount_breakdown as typeof itinerary.amount_breakdown,
        dailyItinerary: body.daily_itinerary as typeof draftDailyItinerary,
        version: nextVersion,
        orderState: orderStateFromPatch,
      });
      await data.refreshOrder({ force: true });
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

  const experienceDraft = Boolean(data.isPreEscrowProtocol && !data.hasEscrow);
  const protocolZoneClass = experienceDraft ? TT_ESCROW_EXPERIENCE_ZONE : TT_ESCROW_PROTOCOL_ZONE;
  const panelClass = experienceDraft ? TT_ESCROW_EXPERIENCE_PANEL : TT_ESCROW_PROTOCOL_PANEL;
  const panelInnerClass = experienceDraft ? TT_ESCROW_EXPERIENCE_PANEL_INNER : TT_ESCROW_PROTOCOL_PANEL_INNER;
  const zoneHeadingClass = experienceDraft ? escrowExperienceHeadingClass : escrowProtocolHeadingClass;
  const zoneMetaClass = experienceDraft ? escrowExperienceMetaClass : escrowProtocolMetaClass;
  const zoneSaveBtnClass = experienceDraft ? escrowExperienceSecondaryBtnClass : escrowProtocolSecondaryBtnClass;
  const zoneEditLinkClass = experienceDraft ? escrowExperienceMutedLinkClass : escrowProtocolInlineLinkClass;
  const zoneInputClass = experienceDraft ? escrowExperienceInputClass : escrowProtocolInputClass;
  const zoneSelectClass = experienceDraft ? escrowExperienceSelectClass : escrowProtocolSelectClass;
  const zoneDayLabelClass = experienceDraft
    ? "text-small font-medium text-white/90 shrink-0 min-w-[6rem]"
    : "text-small font-medium text-slate-200 shrink-0 min-w-[6rem]";

  const hasGuideAssigned = isAssignedGuideId(order.guide_id);
  const allowOrderAccept = canViewerAcceptOrder({
    meUserId: data.meData?.user?.id,
    meGuideRowId: data.meData?.guide?.id,
    orderTouristId: order.tourist_id ?? order.traveler_id,
    orderGuideId: order.guide_id,
  });
  const orderStateNorm = String(data.state ?? order.state ?? order.status ?? "").toLowerCase();
  const publishedToDiscover =
    savePublishedToMarket || isOrderPublishedToDiscover(orderStateNorm);
  const showExperienceSaveAction =
    experienceDraft && canPatchItinerary && (itineraryDraftDirty || !publishedToDiscover);
  const amountResolved = resolveEscrowDisplayAmount(data.amount, itinerary?.amount_breakdown ?? null);
  const evenSplitPerDay = resolveEvenSplitPerDay(
    amountResolved.canonicalTotal,
    Math.max(1, itineraryListDays.length || rowsFromApi.length || 1),
  );
  const listCurrency = formatEscrowStablecoinCurrency(data.currency);
  const breakdownForList = itinerary?.amount_breakdown
    ? {
        ...itinerary.amount_breakdown,
        total_budget:
          amountResolved.canonicalTotal ?? itinerary.amount_breakdown.total_budget,
      }
    : null;
  const structuredItinerary = itineraryHasStructuredBlocks(rowsForCityUi);
  const showNarrativeEditor = showDraftDayEditor && !structuredItinerary;
  const subNorm = String(order.sub_status ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
  const planLocked = Boolean(data.snapshotHash) || subNorm === "confirmed";
  const draftJourneyStep: DraftJourneyStep = planLocked
    ? 3
    : itineraryDraftDirty || !publishedToDiscover
      ? 1
      : 2;
  const draftStep2Phase =
    experienceDraft && publishedToDiscover && !hasGuideAssigned && !planLocked
      ? "pickGuide"
      : "confirm";
  const guideRequiredForConfirm = experienceDraft && !hasGuideAssigned;
  const escrowGuideMarketHref =
    experienceDraft && !hasGuideAssigned && order?.id
      ? marketHrefForEscrowGuideBind(String(order.id))
      : "/market?view=split";
  const amountOutOfSync = Boolean(
    amountResolved.amountMismatch || amountResolved.lineItemsMismatch,
  );
  const confirmBlocked =
    itineraryDraftDirty ||
    guideRequiredForConfirm ||
    (amountOutOfSync && !quoteAmountPersisted && !quoteQuietSyncing);
  const confirmBlockedReasonKey = itineraryDraftDirty
    ? "escrow_confirmBlocked_saveFirst"
    : guideRequiredForConfirm
      ? "escrow_confirmBlocked_pickGuide"
      : amountOutOfSync && !quoteAmountPersisted && !quoteQuietSyncing
        ? "escrow_confirmBlocked_amountSync"
        : null;
  const hideListDayDescription = experienceDraft && showNarrativeEditor;
  const showExperienceItineraryList = itineraryListDays.length > 0 && !(experienceDraft && showNarrativeEditor);
  const showPreviewTab = itineraryListDays.length > 0;
  const showCitiesTab = showCityEditor;
  const showNarrativeTab = showNarrativeEditor;
  const itineraryTabCount = [showCitiesTab, showNarrativeTab, showPreviewTab].filter(Boolean).length;
  const showItineraryTabBar = experienceDraft && showDraftDayEditor && itineraryTabCount >= 2;
  const showCityPanel = showItineraryTabBar ? itineraryTab === "cities" && showCitiesTab : showCityEditorUi;
  const showNarrativePanel = showItineraryTabBar
    ? itineraryTab === "narrative" && showNarrativeTab
    : showNarrativeEditor;
  const showListPanel = showItineraryTabBar
    ? itineraryTab === "preview" && showPreviewTab
    : showExperienceItineraryList;
  const uniformNarrative =
    experienceDraft && showListPanel && itineraryDescriptionsUniform(itineraryListDays);
  const uniformNarrativeText = uniformNarrative ? uniformItineraryDescription(itineraryListDays) : "";
  const hideListDescriptions = hideListDayDescription || uniformNarrative;
  const showPublishedPickGuideBanner =
    publishedToDiscover && !hasGuideAssigned && !planLocked;
  const showExperienceFooterMarketLink =
    !hasGuideAssigned && !planLocked && !publishedToDiscover;
  const showExperienceFooterCancel =
    !planLocked &&
    !data.hasEscrow &&
    (publishedToDiscover || hasGuideAssigned) &&
    (data.isDraft || data.state === "created" || data.state === "accepted");
  const showExperienceFooterDelete =
    !planLocked &&
    !data.hasEscrow &&
    !publishedToDiscover &&
    !hasGuideAssigned &&
    (data.isDraft || data.state === "created" || data.state === "accepted");
  const showQuoteSyncAction =
    experienceDraft &&
    canPatchItinerary &&
    !itineraryDraftDirty &&
    amountOutOfSync &&
    !quoteAmountPersisted &&
    !quoteQuietSyncing;
  const showConfirmReadyHint =
    experienceDraft &&
    hasGuideAssigned &&
    canPatchItinerary &&
    !confirmBlocked &&
    data.allowConfirmFinalPlan &&
    !data.snapshotHash &&
    (quoteAmountPersisted || !amountOutOfSync) &&
    !quoteQuietSyncing &&
    !patchItinerarySuccess;

  return (
    <main
      className={`space-y-10 ${experienceDraft && canPatchItinerary ? "pb-24 lg:pb-10" : ""}`}
      role="main"
      aria-label={t("escrow_detailAria")}
      data-tt-escrow-detail-page="1"
    >
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

      <div
        data-zone="order-protocol"
        data-tt-escrow-draft-experience-ui-frozen={experienceDraft ? "1" : undefined}
        data-tt-escrow-protocol-l5={experienceDraft ? undefined : "1"}
        className={protocolZoneClass}
        role="region"
        aria-label={t("order_protocolZoneAria")}
      >
        {protocolPaused ? (
          <div
            className="rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 p-4 space-y-1"
            role="status"
          >
            <p className="text-small font-semibold text-amber-200">{t("escrow_protocolPause_title")}</p>
            <p className="text-small text-slate-200 leading-relaxed">{t("escrow_protocolPause_body")}</p>
          </div>
        ) : null}
        {experienceDraft && data.orderGetRateLimited ? (
          <EscrowOrderGetRateLimitBanner onRetry={() => data.refreshOrder({ force: true })} />
        ) : null}
        {!experienceDraft ? <EscrowDetailOrdersBreadcrumb /> : null}
        <EscrowDetailHeader
          order={order}
          state={data.state}
          hasEscrow={data.hasEscrow}
          isDraft={data.isDraft}
          escrowId={escrowId}
          chainSync={data.chainSync}
          variantDid={!experienceDraft}
          variantExperience={experienceDraft}
          hasGuideAssigned={hasGuideAssigned}
          experiencePreEscrow={experienceDraft}
          publishedToDiscover={publishedToDiscover}
        />

        {!experienceDraft ? (
          <>
            <TrustGrowthMomentBanner moment="first_order" surface="slate" dismissible />
            <InlineTransparencyVerification context="order" surface="slate" verificationKey={escrowId} />
          </>
        ) : null}

        <div id="escrow-after-final-plan" className="scroll-mt-24 outline-none" tabIndex={-1}>
          <OrderFlowSteps
            currentStep={orderStateToStep(order)}
            statusLabel={
              experienceDraft && draftJourneyStep
                ? draftStep2Phase === "pickGuide"
                  ? t("order_flow_draft_journey_sr_pickGuide")
                  : t("order_flow_draft_journey_sr").replace("{{step}}", String(draftJourneyStep))
                : t(orderStateToStatusLabelKey(order))
            }
            variant={experienceDraft ? "experience" : "did"}
            compact={experienceDraft}
            draftJourneyStep={experienceDraft ? draftJourneyStep : undefined}
            draftStep2Phase={experienceDraft ? draftStep2Phase : undefined}
          />
        </div>

        {experienceDraft ? (
          <EscrowDraftNextStepStrip
            draftJourneyStep={draftJourneyStep}
            hasGuideAssigned={hasGuideAssigned}
            publishedToDiscover={publishedToDiscover}
            itineraryDraftDirty={itineraryDraftDirty}
            planLocked={planLocked}
            hideWhenPublishedBanner
          />
        ) : null}

        {experienceDraft && showPublishedPickGuideBanner ? (
          <EscrowDraftPublishedBanner
            orderId={String(order.id)}
            saveFlash={patchItinerarySuccess}
            destinationLabel={String(order.destination ?? "").trim() || undefined}
          />
        ) : null}

        {experienceDraft ? (
          hasGuideAssigned ? (
            <EscrowDraftGuideAssignedCard
              guideId={String(order.guide_id)}
              orderId={String(order.id)}
            />
          ) : publishedToDiscover ? null : (
            <EscrowDraftGuideEmptyCard
              compact
              orderId={String(order.id)}
              destinationLabel={String(order.destination ?? "").trim() || undefined}
              publishedToMarket={false}
            />
          )
        ) : null}

        {experienceDraft && planLocked ? (
          <EscrowDraftPayStepCard
            orderId={String(order.id)}
            orderState={String(order.state ?? order.status ?? "draft")}
            mockPayEnabled={chainOffRestConfirmCompletionEnabled}
          />
        ) : null}

      {data.showItineraryBudgetZone && itinerary ? (
        <div className={`${panelClass} p-6`}>
          <div
            className={
              experienceDraft
                ? "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
                : "space-y-4"
            }
          >
          <div className={experienceDraft ? "lg:col-span-2 space-y-4 order-2 lg:order-1 min-w-0" : "space-y-4"}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className={zoneHeadingClass}>
                {experienceDraft ? t("escrow_itineraryBudget_experience") : t("escrow_itineraryBudget")}
              </h3>
              {experienceDraft && showNarrativeEditor ? (
                <p className={`${zoneMetaClass} mt-0.5`} role="status">
                  {t("escrow_draftLeftColumnLead")}
                </p>
              ) : null}
              {!experienceDraft && canPatchItinerary ? (
                <p className={`${zoneMetaClass} mt-0.5`} role="status">
                  {t("escrow_saveItineraryHint")}
                </p>
              ) : !experienceDraft ? (
                <p className={`${zoneMetaClass} mt-0.5`} role="status">{t("escrow_itineraryLockHint")}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canPatchItinerary && !experienceDraft && (
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
                    className={zoneSaveBtnClass}
                    aria-busy={savingItinerary ? true : undefined}
                    aria-label={t("escrow_saveItinerary")}
                  >
                    {savingItinerary ? t("common_loading") : t("escrow_saveItinerary")}
                  </button>
                </form>
              )}
              {data.isDraft && !(experienceDraft && (showDraftDayEditor || showCityEditorUi)) ? (
                <Link
                  href={`/itinerary/new?fromOrder=${encodeURIComponent(String(order.id))}`}
                  className={zoneEditLinkClass}
                  aria-label={t("escrow_editItineraryLink")}
                >
                  {t("escrow_editItineraryLink")}
                </Link>
              ) : null}
            </div>
          </div>
          {deleteOrderError && (
            <p className="text-small text-danger" role="alert">{deleteOrderError}</p>
          )}
          {patchItineraryError && (
            <p className="text-small text-danger" role="alert">{patchItineraryError}</p>
          )}
          {patchItinerarySuccess && !experienceDraft ? (
            <p className="text-small text-success" role="status">
              {t("escrow_saveItinerarySuccess")}
            </p>
          ) : null}
          {showItineraryTabBar ? (
            <EscrowDraftItineraryTabBar
              active={itineraryTab}
              onChange={setItineraryTab}
              showCities={showCitiesTab}
              showNarrative={showNarrativeTab}
              showPreview={showPreviewTab}
            />
          ) : null}
          {!experienceDraft ? (
            <OrderMessageLink
              orderId={String(order.id)}
              variantDid
              compact
            />
          ) : null}
          {experienceDraft && !showCityPanel && (order.destination || orderCityTrim) ? (
            <p className={zoneMetaClass} role="status">
              {t("escrow_draftDestinationSummary")
                .replace("{{dest}}", String(order.destination ?? "").trim() || t("ui_em_dash"))
                .replace("{{city}}", orderCityTrim || t("ui_em_dash"))
                .replace("{{days}}", String(rowsForCityUi.length || rowsFromApi.length || 1))}
            </p>
          ) : null}
          {showCityPanel && (
            <div className={panelInnerClass}>
              <p className={zoneMetaClass}>{t("escrow_draftDayCityHint_short")}</p>
              <ul className="space-y-2 list-none p-0 m-0">
                {(draftRowsAligned ? draftDailyItinerary : rowsFromApi).map((row, idx) => {
                  const rawCity = String(row.city ?? "").trim();
                  const validCityValues = new Set(cityOptions.map((c) => c.value));
                  const unknownPresetCity = rawCity !== "" && !validCityValues.has(rawCity);
                  return (
                    <li key={`city-${row.day_index}-${idx}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label
                        htmlFor={`escrow-day-city-${escrowId}-${idx}`}
                        className={zoneDayLabelClass}
                      >
                        {t("order_dayN").replace("{{n}}", String(row.day_index ?? idx + 1))}
                      </label>
                      <select
                        id={`escrow-day-city-${escrowId}-${idx}`}
                        value={rawCity}
                        onChange={(e) => {
                          const v = e.target.value;
                          setItineraryDraftDirty(true);
                          const dest = String(order.destination ?? "").trim();
                          setDraftDailyItinerary((prev) => {
                            const base =
                              prev.length === rowsFromApi.length
                                ? prev.map((x) => ({ ...x }))
                                : rowsFromApi.map((r) => ({ ...r }));
                            return patchDraftDayCity(base, idx, v.trim() ? v.trim() : undefined, dest);
                          });
                        }}
                        className={zoneSelectClass}
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
          {showNarrativePanel ? (
            <EscrowDraftDayNarrativePanel
              escrowId={escrowId}
              rowsFromApi={rowsFromApi}
              draftRowsAligned={draftRowsAligned}
              draftDailyItinerary={draftDailyItinerary}
              setDraftDailyItinerary={setDraftDailyItinerary}
              onDirty={() => setItineraryDraftDirty(true)}
              panelInnerClass={panelInnerClass}
              zoneMetaClass={zoneMetaClass}
              zoneDayLabelClass={zoneDayLabelClass}
              resetViewAfterSave={patchItinerarySuccess}
              contentRevisionKey={dailyFingerprint}
              hideViewModeLeadHint
            />
          ) : null}
          {experienceDraft && amountResolved.canonicalTotal != null ? (
            <p className={`${zoneMetaClass} font-medium text-white/90`} role="status">
              {t("escrow_draftCanonicalTotalLabel")}: {amountResolved.displayAmount} {listCurrency}
            </p>
          ) : null}
          {showNarrativePanel && evenSplitPerDay != null ? (
            <p className={`${zoneMetaClass}`} role="status">
              <span className="font-medium text-white/85">{t("itin_dayCostEvenSplitLabel")}: </span>
              {formatEvenSplitAmount(evenSplitPerDay)} {listCurrency}
              <span className="text-white/55"> {t("itin_dayCostEvenSplitHint")}</span>
            </p>
          ) : null}
          {uniformNarrative ? (
            <p className={`${zoneMetaClass} m-0`} role="status">
              {t("escrow_draftUniformNarrativeHint")}
            </p>
          ) : null}
          {showListPanel ? (
            <UnifiedItineraryList
              days={itineraryListDays}
              variant={experienceDraft ? "marketDark" : "did"}
              collapsible={itineraryListDays.length > 1}
              hideDayDescription={hideListDescriptions}
              amountBreakdown={breakdownForList}
              hideAmountBreakdown={experienceDraft}
              expandDayLabelMode={experienceDraft ? "experience" : "agreement"}
              richCollapsedPreview={experienceDraft}
              sharedCollapsedExcerpt={uniformNarrativeText || undefined}
              previewExcerptFallback={
                experienceDraft ? t("escrow_draftPreviewExcerptFallback") : undefined
              }
              currency={listCurrency}
              t={t}
            />
          ) : null}
          {!experienceDraft ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 items-start">
              <div className="lg:col-span-1 min-w-0">
                <QuoteSummaryCard
                  amount={data.amount}
                  currency={data.currency}
                  amountBreakdown={itinerary.amount_breakdown ?? null}
                  version={itinerary.version}
                  snapshotHash={data.snapshotHash}
                  orderId={String(order.id)}
                  allowConfirmFinalPlan={data.allowConfirmFinalPlan}
                  onConfirmed={onConfirmFinalPlanSuccess}
                  variantDid
                  protocolPaused={protocolPaused}
                />
              </div>
              <div className="lg:col-span-2 min-w-0">
                <OrderMessageLink orderId={String(order.id)} variantDid compact />
              </div>
            </div>
          ) : null}
          </div>
          {experienceDraft ? (
            <div className="lg:col-span-1 min-w-0 order-1 lg:order-2">
              <QuoteSummaryCard
                amount={data.amount}
                currency={data.currency}
                amountBreakdown={itinerary.amount_breakdown ?? null}
                version={itinerary.version}
                snapshotHash={data.snapshotHash}
                orderId={String(order.id)}
                allowConfirmFinalPlan={data.allowConfirmFinalPlan}
                onConfirmed={onConfirmFinalPlanSuccess}
                variantExperience
                protocolPaused={protocolPaused}
                confirmPlanSummary={confirmPlanSummary}
                confirmBlocked={confirmBlocked}
                confirmBlockedReasonKey={confirmBlockedReasonKey}
                showDraftSaveAction={showExperienceSaveAction}
                canSaveItinerary={canPatchItinerary}
                savingItinerary={savingItinerary}
                onSaveItinerary={() => void handleSaveItinerary()}
                showUnsavedHint={itineraryDraftDirty}
                showQuoteSyncAction={showQuoteSyncAction}
                onSyncQuote={() => void handleSaveItinerary()}
                saveSuccessFlash={patchItinerarySuccess}
                savePublishedToMarket={publishedToDiscover}
                quoteQuietSyncing={quoteQuietSyncing}
                quoteQuietSyncError={quoteQuietSyncError}
                showConfirmReadyHint={showConfirmReadyHint}
                guideAssigned={hasGuideAssigned}
              />
            </div>
          ) : null}
          </div>
        </div>
      ) : (
        <div className={`${panelClass} p-4 space-y-2`}>
          <h3 className={zoneHeadingClass}>{t("escrow_itineraryBudget")}</h3>
          <p className={`${zoneMetaClass} leading-relaxed`} role="status">
            {t("escrow_itineraryLockHint")}
          </p>
        </div>
      )}

      {experienceDraft && canPatchItinerary ? (
        <EscrowDraftMobileActionBar
          canSave={canPatchItinerary}
          showSaveButton={showExperienceSaveAction}
          saving={savingItinerary}
          onSave={() => void handleSaveItinerary()}
          confirmBlocked={confirmBlocked}
          confirmBlockedReasonKey={confirmBlockedReasonKey}
        />
      ) : null}

      {!experienceDraft && !(data.showItineraryBudgetZone && itinerary) ? (
      <div className={`${panelClass} p-6 md:p-8 space-y-6`}>
        <div>
          <p className={zoneMetaClass}>{t("escrow_amountCurrency")}</p>
          <h2 className={escrowProtocolDidTitleClass}>
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
            <li>{t("escrow_guide")}{isAssignedGuideId(order.guide_id) ? `${String(order.guide_id).slice(0, 8)}…` : t("escrow_guideUnassigned")}</li>
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
      ) : null}

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

      {!data.showItineraryBudgetZone && [2, 3, 4].includes(orderStateToStep(order)) && (
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

      {experienceDraft && !data.isDraft && isEscrowExperienceDevToolsEnabled() ? (
        <EscrowDraftAdvancedProtocolFold defaultOpen={Boolean(data.snapshotHash)}>
          {!data.hasEscrow &&
            (getEscrowFactoryAddress() ? (
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
                panelClassName={`${panelInnerClass} space-y-3`}
                variantExperience
                protocolPaused={protocolPaused}
              />
            ) : (
              <SetEscrowAddressBlock
                orderId={String(order.id)}
                onSuccess={data.refreshOrder}
                variantExperience
                protocolPaused={protocolPaused}
              />
            ))}
          {data.meData?.guide ? (
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
              variantExperience
              protocolPaused={protocolPaused}
              chainOffRestConfirmCompletionEnabled={chainOffRestConfirmCompletionEnabled}
              allowAccept={allowOrderAccept}
            />
          ) : (
            <p className="text-small text-slate-300 leading-relaxed rounded-[var(--radius-sm)] border border-white/10 bg-black/25 px-3 py-2.5">
              {t("escrow_orderActions_touristDevFoldHint")}
            </p>
          )}
          <OrderEvidenceSection
            orderId={String(order.id)}
            panelClassName={panelInnerClass}
            variantExperience
          />
        </EscrowDraftAdvancedProtocolFold>
      ) : (
        <>
          {!data.hasEscrow && !data.isDraft &&
            (getEscrowFactoryAddress() ? (
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
            ))}
          {!data.isDraft ? (
            <>
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
                chainOffRestConfirmCompletionEnabled={chainOffRestConfirmCompletionEnabled}
                allowAccept={allowOrderAccept}
              />
              <OrderEvidenceSection orderId={String(order.id)} panelClassName={panelClass} variantDid />
              <DisputeResolutionFundBlock
                orderId={String(order.id)}
                orderAmountStr={String(data.amount)}
                currency={String(data.currency ?? "")}
                orderState={data.state}
                variantDid
              />
            </>
          ) : null}
        </>
      )}

      {data.state === "completed" && (
        <>
          {orderStateToStep(order) >= 6 && orderStateToStep(order) < 8 && (
            <div className={`${panelClass} p-4`}>
              <h3 className={`${escrowProtocolSubheadingClass} mb-1`}>{t("order_ratingEntry")}</h3>
              <p className={`${zoneMetaClass} mb-3`}>{t("order_ratingEntryDesc")}</p>
              <Link
                href={`/escrow/${encodeURIComponent(String(order.id))}/rate`}
                onClick={stashEscrowDetailPayOrRatePrefetch}
                className={`${touchTargetLink44Classes} inline-flex items-center gap-2 ${escrowProtocolInlineLinkClass}`}
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

      {!experienceDraft ? (
        <>
          <EscrowRiskNotice disputeDeadlineAt={data.disputeDeadlineAt} disputeWindowExpired={data.disputeWindowExpired} />
          <EscrowCancelPolicySection headingId={cancelPolicyHeadingId} />
        </>
      ) : null}

      {experienceDraft ? (
        <EscrowDraftExperienceFooter
          marketHref={escrowGuideMarketHref}
          showMarketLink={showExperienceFooterMarketLink}
          showCancelOrder={showExperienceFooterCancel}
          showDeleteOrder={showExperienceFooterDelete}
          orderActionPending={deleteOrderPending}
          onCopySummary={() => void handleCopySummary()}
          copySummaryBusy={copySummaryBusy}
          copySummaryDone={copySummaryDone}
          onCancelOrder={() => {
            void (async () => {
              if (!window.confirm(t("escrow_cancelConfirm"))) return;
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
          onDeleteOrder={() => {
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
        />
      ) : (
        <div className="text-small flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300">
          <EscrowOrderPrintButton variant="protocolDid" />
          <EscrowCopySummaryButton
            variant="protocolDid"
            onCopy={handleCopySummary}
            busy={copySummaryBusy}
            done={copySummaryDone}
          />
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolFooterActionClass}`}
          >
            {t("escrow_backToOrders")}
          </Link>
          <Link
            href={`/pay?orderId=${encodeURIComponent(String(order.id))}`}
            onClick={stashEscrowDetailPayOrRatePrefetch}
            className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolFooterActionClass}`}
          >
            {t("orders_payHub")}
          </Link>
        </div>
      )}
      {experienceDraft && planLocked ? (
        <p className="text-small mt-2">
          <Link
            href={`/pay?orderId=${encodeURIComponent(String(order.id))}`}
            onClick={stashEscrowDetailPayOrRatePrefetch}
            className={`${touchTargetLink44Classes} ${escrowExperienceFooterLinkClass}`}
          >
            {t("escrow_draftPay_goPayHub")}
          </Link>
        </p>
      ) : null}
        {!experienceDraft ? (
        <ProductCrossNav
          ariaLabelKey="escrow_detail_relatedNav_aria"
          showGuides
          className={`mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta ${experienceDraft ? "text-white/65" : "text-slate-300"}`}
          linkClassName={
            experienceDraft
              ? `inline-flex min-h-[44px] items-center justify-center ${escrowExperienceFooterLinkClass}`
              : `inline-flex min-h-[44px] items-center justify-center ${escrowProtocolFooterActionClass}`
          }
          separatorClassName={experienceDraft ? "text-white/35" : "text-slate-500"}
        />
        ) : null}
      </div>
    </main>
  );
}
