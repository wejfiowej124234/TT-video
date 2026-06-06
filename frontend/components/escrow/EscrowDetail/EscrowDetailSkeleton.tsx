"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_ESCROW_EXPERIENCE_PANEL,
  TT_ESCROW_EXPERIENCE_ZONE,
  escrowExperienceCompactFlowClass,
} from "@/lib/escrowExperienceUi";

/**
 * 53 §4.6.8 / ① 创新行程草稿：暖色 Experience 骨架（非协议青屏 + 全量风险提示，避免加载闪回 L4）。
 */
export default function EscrowDetailSkeleton() {
  const { t } = useTranslation();
  const zoneClass = TT_ESCROW_EXPERIENCE_ZONE;
  const panelClass = TT_ESCROW_EXPERIENCE_PANEL;

  return (
    <main className="space-y-10" role="main" aria-label={t("escrow_detailAria")} aria-busy="true">
      <div data-zone="order-protocol" className={zoneClass} role="region" aria-label={t("order_protocolZoneAria")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="h-8 w-48 max-w-full bg-white/10 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
            <div className="h-4 w-56 max-w-full bg-white/8 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          </div>
          <div className="h-6 w-28 bg-ref-sun/15 rounded-[var(--radius-sm)] animate-pulse shrink-0" aria-hidden />
        </div>

        <div className={escrowExperienceCompactFlowClass} aria-hidden>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-1 items-center gap-2 min-w-0">
                <div className="h-9 w-9 rounded-full bg-ref-sun/20 animate-pulse shrink-0" />
                <div className="h-3 flex-1 max-w-[4rem] bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className={`${panelClass} h-10 animate-pulse`} aria-hidden />

        <div className={`${panelClass} p-6`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
              <div className="h-5 w-32 bg-ref-sun/20 rounded animate-pulse" aria-hidden />
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse" aria-hidden />
              <div className={`${panelClass} p-4 space-y-3`}>
                <div className="h-4 w-24 bg-ref-sun/25 rounded animate-pulse" aria-hidden />
                <div className="h-20 bg-black/30 rounded-[var(--radius-md)] animate-pulse" aria-hidden />
              </div>
            </div>
            <div className="lg:col-span-1 order-1 lg:order-2 space-y-3">
              <div className="rounded-[var(--radius-md)] border border-ref-sun/22 bg-ref-sun/8 p-4 space-y-3">
                <div className="h-4 w-20 bg-ref-sun/30 rounded animate-pulse" aria-hidden />
                <div className="h-10 w-36 bg-white/15 rounded animate-pulse" aria-hidden />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-3 w-full bg-white/8 rounded animate-pulse" aria-hidden />
                  ))}
                </div>
                <div className="h-10 w-full bg-white/10 rounded-[var(--radius-md)] animate-pulse" aria-hidden />
                <div className="h-12 w-full bg-ref-sun/25 rounded-[var(--radius-md)] animate-pulse" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-meta text-ref-sun/80 text-center" role="status">
        {t("common_loading")}
      </p>
    </main>
  );
}
