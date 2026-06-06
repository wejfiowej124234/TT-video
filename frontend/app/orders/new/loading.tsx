"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_ORDERS_NEW_L5 } from "@/lib/orders/ordersNewL5";

/** 与 orders/new：步骤条 + 创建表单壳（53 下单入口 · L5 深色） */
export default function OrdersNewLoading() {
  const { t } = useTranslation();
  return (
    <main
      className={TT_ORDERS_NEW_L5.pageShell}
      role="status"
      aria-label={t("orders_createTitle")}
      aria-busy="true"
      data-tt-orders-new-page="1"
      data-tt-orders-new-l5="l5"
    >
      <div className={TT_ORDERS_NEW_L5.pageVignette} aria-hidden />
      <div className={TT_ORDERS_NEW_L5.ambient} aria-hidden />
      <div className={TT_ORDERS_NEW_L5.dotGrid} aria-hidden />
      <section className={TT_ORDERS_NEW_L5.pageInner} aria-hidden>
        <div className={TT_ORDERS_NEW_L5.formFrame}>
          <div className={`relative ${TT_ORDERS_NEW_L5.formInner}`}>
            <div className={TT_ORDERS_NEW_L5.formInnerGlow} aria-hidden />
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`min-h-[44px] min-w-[44px] h-11 w-11 rounded-full border ${
                    i === 0
                      ? "border-ref-sun/45 bg-ref-sun/20"
                      : "border-white/15 bg-slate-950/40"
                  } ${TT_ORDERS_NEW_L5.skeletonShimmer}`}
                />
              ))}
            </div>
            <div className={`min-h-[44px] h-11 w-48 rounded-[var(--radius-sm)] mt-6 mb-4 ${TT_ORDERS_NEW_L5.skeletonShimmer} bg-slate-800/60`} />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className={`h-3 w-24 rounded-[var(--radius-sm)] ${TT_ORDERS_NEW_L5.skeletonShimmer} bg-slate-800/50`} />
                  <div className={`min-h-[44px] h-11 w-full rounded-[var(--radius-sm)] border border-white/15 bg-slate-950/40 ${TT_ORDERS_NEW_L5.skeletonShimmer}`} />
                </div>
              ))}
              <div className={`min-h-[44px] h-11 w-full rounded-[var(--radius-sm)] ${TT_ORDERS_NEW_L5.skeletonShimmer} bg-ref-sun/20`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`h-4 w-24 rounded-[var(--radius-sm)] ${TT_ORDERS_NEW_L5.skeletonShimmer} bg-slate-800/40`} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
