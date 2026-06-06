"use client";

import { useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { marketHrefForEscrowGuideBind } from "@/lib/ordersGuideDeepLink";
import {
  formatEscrowStablecoinCurrency,
  resolveEscrowDisplayAmount,
} from "@/lib/escrowOrderAmountSsot";
import {
  escrowExperienceQuoteStickyClass,
  escrowExperienceMutedLinkClass,
  escrowExperienceSecondaryBtnClass,
  escrowExperienceLinkClass,
} from "@/lib/escrowExperienceUi";
import {
  escrowProtocolHeadingClass,
  escrowProtocolMetaClass,
  TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT,
} from "@/lib/escrowProtocolUi";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import ConfirmFinalPlanBlock, { type ConfirmPlanSummary } from "./ConfirmFinalPlanBlock";
import EscrowDraftTrustPayStrip from "./EscrowDraftTrustPayStrip";

/** 52 §3.2 独立金额项：与后端 AmountBreakdown、42 弹窗一致 */
export interface AmountBreakdownDisplay {
  hotel?: number;
  catering?: number;
  tickets?: number;
  guide_fee?: number;
  vehicle?: number;
  platform_fee?: number;
  total_budget?: number;
}

export interface QuoteSummaryCardProps {
  amount: string;
  currency: string;
  amountBreakdown?: AmountBreakdownDisplay | null;
  /** 52-S12b 可选：用户预算上限，若 total_budget 超过则显示轻提示 */
  budgetLimit?: number | null;
  version?: number | null;
  snapshotHash?: string | null;
  orderId: string;
  /** Draft 或 双边已确认后的 Accepted：显示终版确认入口 */
  allowConfirmFinalPlan: boolean;
  onConfirmed: () => void;
  /** 订单协议区 30-DID 玻璃面板，与 EscrowDetail panelClass 一致 */
  variantDid?: boolean;
  /** Draft pre-escrow：暖色 Experience 面板（与首页 L5 连续） */
  variantExperience?: boolean;
  /** B-067 */
  protocolPaused?: boolean;
  /** 确认弹窗行程摘要 */
  confirmPlanSummary?: ConfirmPlanSummary | null;
  confirmBlocked?: boolean;
  confirmBlockedReasonKey?: string | null;
  /** 草稿：保存与确认同栏，减少左右来回 */
  showDraftSaveAction?: boolean;
  onSaveItinerary?: () => void;
  savingItinerary?: boolean;
  canSaveItinerary?: boolean;
  /** 有未保存编辑时显示轻提示（不重复挡确认原因） */
  showUnsavedHint?: boolean;
  /** 订单额与分项不一致且未改行程：一键写回 */
  showQuoteSyncAction?: boolean;
  onSyncQuote?: () => void;
  saveSuccessFlash?: boolean;
  /** 最近一次保存是否已发布到 discover（Draft→Created） */
  savePublishedToMarket?: boolean;
  quoteQuietSyncing?: boolean;
  quoteQuietSyncError?: string | null;
  showConfirmReadyHint?: boolean;
  suppressConfirmCtaHint?: boolean;
  /** Draft：未选向导时向导费行展示为待选，且与 confirmBlocked_pickGuide 配合 */
  guideAssigned?: boolean;
}

/** P16/29 报价摘要卡：当前总价、明细拆分、version、Confirm Final Plan */
const BREAKDOWN_KEYS: { key: keyof AmountBreakdownDisplay; i18n: string }[] = [
  { key: "hotel", i18n: "escrow_hotel" },
  { key: "catering", i18n: "escrow_catering" },
  { key: "tickets", i18n: "escrow_tickets" },
  { key: "guide_fee", i18n: "escrow_guideFee" },
  { key: "vehicle", i18n: "escrow_vehicle" },
  { key: "platform_fee", i18n: "escrow_platformFee" },
];

export default function QuoteSummaryCard({
  amount,
  currency,
  amountBreakdown,
  budgetLimit,
  version,
  snapshotHash,
  orderId,
  allowConfirmFinalPlan,
  onConfirmed,
  variantDid,
  variantExperience = false,
  protocolPaused = false,
  confirmPlanSummary = null,
  confirmBlocked = false,
  confirmBlockedReasonKey = null,
  showDraftSaveAction = false,
  onSaveItinerary,
  savingItinerary = false,
  canSaveItinerary = false,
  showUnsavedHint = false,
  showQuoteSyncAction = false,
  onSyncQuote,
  saveSuccessFlash = false,
  savePublishedToMarket = false,
  quoteQuietSyncing = false,
  quoteQuietSyncError = null,
  showConfirmReadyHint = false,
  suppressConfirmCtaHint = false,
  guideAssigned = true,
}: QuoteSummaryCardProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const hasSnapshot = !!snapshotHash;
  const isExperience = !!variantExperience;
  const resolved = resolveEscrowDisplayAmount(amount, amountBreakdown ?? null);
  const displayCurrency = isExperience ? formatEscrowStablecoinCurrency(currency) : currency;
  const headlineTotal = resolved.canonicalTotal;
  const overBudget = headlineTotal != null && budgetLimit != null && headlineTotal > budgetLimit;
  const sumForBars = headlineTotal != null && headlineTotal > 0 ? headlineTotal : null;
  const isDid = !!variantDid && !isExperience;
  const shellClass = isExperience
    ? "rounded-[var(--radius-md)] border border-ref-sun/22 bg-ref-sun/8 backdrop-blur-md p-4"
    : isDid
      ? `${TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT} shadow-scifi-panel`
      : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-4 shadow-soft";
  const hClass = isExperience
    ? "text-small font-semibold text-ref-sun/95 mb-3"
    : isDid
      ? `${escrowProtocolHeadingClass} text-small mb-3`
      : "text-small font-semibold text-ink-800 mb-3";
  const amountClass = isExperience
    ? "text-h4 font-semibold text-white tabular-nums tracking-tight"
    : isDid
      ? "text-body font-semibold text-slate-100"
      : "text-body font-semibold text-ink-900";
  const ulClass = isExperience
    ? "text-small text-white/80 mt-3 space-y-1.5 tabular-nums"
    : isDid
      ? `text-meta ${escrowProtocolMetaClass} mt-2 space-y-1 tabular-nums`
      : "text-meta text-ink-600 mt-2 space-y-1 tabular-nums";
  const breakdownRowClass = "flex justify-between gap-3 items-baseline";
  const breakdownLabelClass = "text-left shrink min-w-0";
  const breakdownValueClass = "text-right shrink-0 font-medium";
  const hintClass = isExperience
    ? "text-meta text-white/70 mt-2 leading-relaxed"
    : isDid
      ? "text-meta text-warning/95 mt-1.5"
      : "text-meta text-warning mt-1.5";
  const overBudgetClass = hintClass;
  const snapClass = isExperience
    ? "text-meta font-mono text-white/70 mt-1 break-all"
    : isDid
      ? "text-meta font-mono text-slate-300 mt-1 break-all"
      : "text-meta font-mono text-ink-500 mt-1 break-all";
  const barTrackClass = isExperience
    ? "flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-white/10"
    : isDid
      ? "flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-700/60"
      : "flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-ink-100";

  const showConsumerAmountHint =
    isExperience &&
    showUnsavedHint &&
    (resolved.amountMismatch || resolved.lineItemsMismatch) &&
    !hasSnapshot;

  return (
    <div
      id={isExperience ? "escrow-draft-quote-confirm" : undefined}
      className={`${shellClass} ${isExperience ? escrowExperienceQuoteStickyClass : ""}`}
      aria-labelledby={headingId}
    >
      <h4 id={headingId} className={hClass}>
        {t("escrow_quoteSummary")}
      </h4>
      <p className={amountClass}>
        {resolved.displayAmount} {displayCurrency}
      </p>
      {!isExperience && resolved.lineItemsMismatch && resolved.breakdownTotal != null ? (
        <p className={overBudgetClass} role="status">
          {t("escrow_amountLinesMismatch")
            .replace("{{lines}}", `${resolved.displayAmount} ${displayCurrency}`)
            .replace("{{budget}}", `${resolved.breakdownTotal.toFixed(2)} ${displayCurrency}`)}
        </p>
      ) : null}
      {!isExperience && !resolved.lineItemsMismatch && resolved.amountMismatch ? (
        <p className={overBudgetClass} role="status">
          {t("escrow_amountSsotMismatch")
            .replace("{{order}}", String(resolved.orderAmountNum?.toFixed(2) ?? amount))
            .replace("{{breakdown}}", String(resolved.breakdownTotal?.toFixed(2) ?? ""))}
        </p>
      ) : null}
      {showConsumerAmountHint ? (
        <p className={hintClass} role="status">
          {t("escrow_amountSaveToSync")}
        </p>
      ) : null}
      {isExperience && showUnsavedHint && !showConsumerAmountHint ? (
        <p className={`${hintClass} mt-2`} role="status">
          {t("escrow_draftUnsavedHint")}
        </p>
      ) : null}
      {isExperience && quoteQuietSyncing ? (
        <p className={`${hintClass} mt-2`} role="status" aria-live="polite">
          {t("escrow_quoteQuietSyncing")}
        </p>
      ) : null}
      {isExperience && quoteQuietSyncError && !quoteQuietSyncing ? (
        <p className="mt-2 text-small text-red-300/95" role="alert">
          {quoteQuietSyncError}
        </p>
      ) : null}
      {isExperience && showConfirmReadyHint ? (
        <p
          className="mt-3 rounded-[var(--radius-md)] border border-ref-sun/35 bg-ref-sun/12 px-3 py-2.5 text-small font-medium text-ref-sun/95 leading-relaxed shadow-[0_0_24px_-8px_rgba(255,200,100,0.35)]"
          role="status"
        >
          {t("escrow_confirmReadyHint")}
        </p>
      ) : null}
      {amountBreakdown && (
        <>
          <ul className={ulClass} role="list">
            {BREAKDOWN_KEYS.map(({ key, i18n }) => {
              const v = amountBreakdown[key];
              if (v == null) return null;
              const guideFeePending =
                isExperience && !guideAssigned && key === "guide_fee";
              return (
                <li key={key} className={breakdownRowClass}>
                  <span className={breakdownLabelClass}>
                    {guideFeePending ? t("escrow_guideFee_pending") : t(i18n)}
                  </span>
                  <span
                    className={
                      guideFeePending ? `${breakdownValueClass} text-white/55` : breakdownValueClass
                    }
                  >
                    {guideFeePending
                      ? t("escrow_guideFeePendingValue")
                      : `${v.toFixed(2)} ${displayCurrency}`}
                  </span>
                </li>
              );
            })}
          </ul>
          {sumForBars != null && sumForBars > 0 && (
            <div className="mt-2 space-y-1" aria-hidden>
              <div className={barTrackClass}>
                {BREAKDOWN_KEYS.map(({ key, i18n }) => {
                  const v = amountBreakdown[key];
                  if (v == null || v <= 0) return null;
                  const pct = Math.round((v / sumForBars) * 100);
                  return (
                    <span
                      key={key}
                      className={
                        isExperience ? "bg-ref-sun/65 min-w-[2px]" : "bg-travel-500/70 min-w-[2px]"
                      }
                      style={{ width: `${pct}%` }}
                      title={`${t(i18n).trim()} ${pct}%`}
                    />
                  );
                })}
              </div>
            </div>
          )}
          {isExperience &&
          !guideAssigned &&
          amountBreakdown.guide_fee != null &&
          amountBreakdown.guide_fee > 0 ? (
            <p className={`${hintClass} mt-2`} role="note">
              {t("escrow_guideFeePendingHint")}
            </p>
          ) : null}
          {overBudget && (
            <p className={overBudgetClass} role="status">{t("escrow_overBudgetHint")}</p>
          )}
          {isExperience && showQuoteSyncAction && onSyncQuote ? (
            <button
              type="button"
              disabled={savingItinerary}
              className={`mt-3 ${escrowExperienceMutedLinkClass} text-left w-full`}
              aria-busy={savingItinerary ? true : undefined}
              onClick={() => onSyncQuote()}
            >
              {savingItinerary ? t("common_loading") : t("escrow_syncQuoteOneClick")}
            </button>
          ) : null}
        </>
      )}
      {!isExperience ? (
        <p className={isDid ? "text-meta text-slate-300 mt-2" : "text-meta text-ink-500 mt-2"}>
          {t("escrow_versionShort").replace("{{n}}", String(version ?? "1.0"))}
        </p>
      ) : null}
      {hasSnapshot && (
        <p className={snapClass}>
          {t("agree_label_snapshot_hash")}
          {snapshotHash}
        </p>
      )}
      {isExperience && saveSuccessFlash ? (
        <div
          className="mt-3 rounded-[var(--radius-md)] border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-small text-emerald-200 space-y-2"
          role="status"
        >
          <p className="m-0">
            {savePublishedToMarket
              ? t("escrow_saveItinerarySuccess_published")
              : t("escrow_saveItinerarySuccess_draft")}
          </p>
          {savePublishedToMarket && orderId ? (
            <Link
              href={marketHrefForEscrowGuideBind(orderId)}
              className={`${escrowExperienceLinkClass} inline-flex min-h-[44px] items-center font-semibold text-emerald-100`}
            >
              {t("escrow_goMarketSelectGuide")} →
            </Link>
          ) : null}
        </div>
      ) : null}
      {isExperience && showDraftSaveAction && canSaveItinerary && onSaveItinerary ? (
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSaveItinerary();
          }}
        >
          <button
            type="submit"
            disabled={savingItinerary}
            className={`${escrowExperienceSecondaryBtnClass} w-full ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`}
            aria-busy={savingItinerary ? true : undefined}
          >
            {savingItinerary ? t("common_loading") : t("escrow_saveItinerary")}
          </button>
        </form>
      ) : null}
      {isExperience && !hasSnapshot ? <EscrowDraftTrustPayStrip /> : null}
      <ConfirmFinalPlanBlock
        orderId={orderId}
        allowConfirmFinalPlan={allowConfirmFinalPlan}
        hasSnapshot={hasSnapshot}
        version={version}
        snapshotHash={snapshotHash}
        onConfirmed={onConfirmed}
        variantDid={variantDid && !isExperience}
        variantExperience={isExperience}
        protocolPaused={protocolPaused}
        primaryFullWidth={isExperience}
        confirmPlanSummary={confirmPlanSummary}
        confirmBlocked={confirmBlocked}
        confirmBlockedReasonKey={confirmBlockedReasonKey}
        suppressCtaHint={suppressConfirmCtaHint || showConfirmReadyHint}
      />
    </div>
  );
}
