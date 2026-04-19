"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import ConfirmFinalPlanBlock from "./ConfirmFinalPlanBlock";

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
  /** B-067 */
  protocolPaused?: boolean;
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
  protocolPaused = false,
}: QuoteSummaryCardProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const hasSnapshot = !!snapshotHash;
  const total = amountBreakdown?.total_budget ?? null;
  const overBudget = total != null && budgetLimit != null && total > budgetLimit;
  const sumForBars = total && total > 0 ? total : null;
  const isDid = !!variantDid;
  const shellClass = isDid
    ? "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 shadow-scifi-panel"
    : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-4 shadow-soft";
  const hClass = isDid ? "text-small font-semibold text-cyan-200 mb-3" : "text-small font-semibold text-ink-800 mb-3";
  const amountClass = isDid ? "text-body font-semibold text-slate-100" : "text-body font-semibold text-ink-900";
  const ulClass = isDid ? "text-meta text-slate-300 mt-2 space-y-0.5" : "text-meta text-ink-600 mt-2 space-y-0.5";
  const totalRowClass = isDid
    ? "font-semibold text-slate-200 pt-1 border-t border-slate-600/50 mt-1"
    : "font-semibold text-ink-800 pt-1 border-t border-ink-200 mt-1";
  const barTrackClass = isDid ? "flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-700/60" : "flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-ink-100";
  const overBudgetClass = isDid ? "text-meta text-warning/95 mt-1.5" : "text-meta text-warning mt-1.5";
  const versionClass = isDid ? "text-meta text-slate-300 mt-2" : "text-meta text-ink-500 mt-2";
  const snapClass = isDid ? "text-meta font-mono text-slate-300 mt-1 break-all" : "text-meta font-mono text-ink-500 mt-1 break-all";

  return (
    <div className={shellClass} aria-labelledby={headingId}>
      <h4 id={headingId} className={hClass}>
        {t("escrow_quoteSummary")}
      </h4>
      <p className={amountClass}>
        {amount} {currency}
      </p>
      {amountBreakdown && (
        <>
          <ul className={ulClass} role="list">
            {amountBreakdown.hotel != null && <li>{t("escrow_hotel")} {amountBreakdown.hotel} {currency}</li>}
            {amountBreakdown.catering != null && <li>{t("escrow_catering")} {amountBreakdown.catering} {currency}</li>}
            {amountBreakdown.tickets != null && <li>{t("escrow_tickets")} {amountBreakdown.tickets} {currency}</li>}
            {amountBreakdown.guide_fee != null && <li>{t("escrow_guideFee")} {amountBreakdown.guide_fee} {currency}</li>}
            {amountBreakdown.vehicle != null && <li>{t("escrow_vehicle")} {amountBreakdown.vehicle} {currency}</li>}
            {amountBreakdown.platform_fee != null && <li>{t("escrow_platformFee")} {amountBreakdown.platform_fee} {currency}</li>}
            {amountBreakdown.total_budget != null && <li className={totalRowClass}>{t("escrow_totalBudget")} {amountBreakdown.total_budget} {currency}</li>}
          </ul>
          {/* 52-S12b 预算可视化：分项占比条 */}
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
                      className="bg-travel-500/70 min-w-[2px]"
                      style={{ width: `${pct}%` }}
                      title={`${t(i18n).trim()} ${pct}%`}
                    />
                  );
                })}
              </div>
            </div>
          )}
          {overBudget && (
            <p className={overBudgetClass} role="status">{t("escrow_overBudgetHint")}</p>
          )}
        </>
      )}
      <p className={versionClass}>{t("escrow_versionShort").replace("{{n}}", String(version ?? "1.0"))}</p>
      {hasSnapshot && (
        <p className={snapClass}>
          {t("agree_label_snapshot_hash")}
          {snapshotHash}
        </p>
      )}
      <ConfirmFinalPlanBlock
        orderId={orderId}
        allowConfirmFinalPlan={allowConfirmFinalPlan}
        hasSnapshot={hasSnapshot}
        version={version}
        snapshotHash={snapshotHash}
        onConfirmed={onConfirmed}
        variantDid={variantDid}
        protocolPaused={protocolPaused}
      />
    </div>
  );
}
