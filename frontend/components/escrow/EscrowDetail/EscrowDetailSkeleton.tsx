"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import EscrowCancelPolicySection from "./EscrowCancelPolicySection";
import EscrowCopySummaryButton from "./EscrowCopySummaryButton";
import EscrowOrderPrintButton from "./EscrowOrderPrintButton";
import EscrowRiskNotice from "./EscrowRiskNotice";

/** 53 §4.6.8：订单/Escrow 详情骨架与首屏布局同构，减少 CLS；协议区用深色底与 30-DID 协调 */
export default function EscrowDetailSkeleton() {
  const { t } = useTranslation();
  const cancelPolicyHeadingId = useId();
  const protocolZoneClass = "order-protocol-zone rounded-[var(--radius-xl)] bg-slate-950 text-slate-200 space-y-6 p-4 md:p-6";
  const panelClass = "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md shadow-scifi-panel";

  return (
    <main className="space-y-10" role="main" aria-label={t("escrow_detailAria")} aria-busy="true">
      <div data-zone="order-protocol" className={protocolZoneClass} role="region" aria-label={t("order_protocolZoneAria")}>
        {/* Header: title + meta */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="min-h-[44px] h-11 w-48 bg-slate-700/60 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
            <div className="h-4 w-32 mt-2 bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          </div>
          <div className="flex gap-2">
            <div className="min-h-[44px] h-11 w-20 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
            <div className="min-h-[44px] h-11 w-20 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          </div>
        </div>

        {/* Steps bar: 8 steps */}
        <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-1" aria-hidden>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="min-h-[44px] h-11 min-w-[4rem] flex-1 max-w-[5rem] rounded-[var(--radius-sm)] bg-slate-800/60 animate-pulse" />
          ))}
        </div>

        <div className={`${panelClass} p-4 space-y-2`}>
          <h3 className="text-body-l font-semibold text-cyan-200">{t("escrow_itineraryBudget")}</h3>
          <p className="text-meta text-slate-300 leading-relaxed" role="status">
            {t("escrow_itineraryLockHint")}
          </p>
          <p className="text-small text-slate-300 flex flex-wrap items-center gap-4 pt-1">
            <EscrowOrderPrintButton variant="protocolDid" />
            <EscrowCopySummaryButton variant="protocolDid" onCopy={() => {}} disabled />
          </p>
        </div>

        <EscrowRiskNotice />

        {/* Panel: itinerary / amount / participants area */}
        <div className={`${panelClass} p-6 md:p-8 space-y-6`}>
          <div>
            <div className="h-4 w-24 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse mb-2" aria-hidden />
            <div className="min-h-[44px] h-11 w-32 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          </div>
          <div>
            <div className="h-4 w-20 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse mb-2" aria-hidden />
            <ul className="space-y-2">
              <li className="h-4 w-full max-w-[12rem] bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
              <li className="h-4 w-full max-w-[10rem] bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
              <li className="h-4 w-full max-w-[8rem] bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
            </ul>
          </div>
          <div className="h-12 w-full max-w-md rounded-[var(--radius-sm)] bg-slate-800/50 animate-pulse" aria-hidden />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <div className="h-4 w-28 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
              <div className="h-24 rounded-[var(--radius-sm)] bg-slate-800/50 animate-pulse" aria-hidden />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
              <div className="h-20 rounded-[var(--radius-sm)] bg-slate-800/50 animate-pulse" aria-hidden />
            </div>
          </div>
        </div>
      </div>
      <p className="text-meta text-ink-500 text-center" role="status">{t("common_loading")}</p>
      <EscrowCancelPolicySection headingId={cancelPolicyHeadingId} />
    </main>
  );
}
