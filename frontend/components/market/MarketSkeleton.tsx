"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** P29 自由市场加载骨架：订单卡片与向导卡片占位，与 28 玻璃态风格一致；sr-only 文案 i18n */
const glassCard = "rounded-[var(--radius-md)] border border-white/25 bg-white/5 backdrop-blur-md overflow-hidden";

export function OrderCardSkeleton({
  count = 4,
  gridClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}: { count?: number; gridClass?: string }) {
  const { t } = useTranslation();
  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">{t("common_loading")}</p>
      <ul className={`grid gap-4 list-none p-0 m-0 ${gridClass}`} aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <article className={glassCard}>
              <div className="aspect-video bg-white/10 animate-pulse" />
              <div className="p-4 space-y-3 border-t border-white/15">
                <div className="h-5 bg-white/15 rounded-[var(--radius-sm)] animate-pulse w-3/4" />
                <div className="h-4 bg-white/10 rounded-[var(--radius-sm)] animate-pulse w-1/3" />
                <div className="h-5 bg-white/15 rounded-[var(--radius-sm)] animate-pulse w-1/4" />
                <div className="flex gap-2 pt-1">
                  <div className="min-h-[44px] h-11 bg-white/10 rounded-[var(--radius-sm)] animate-pulse w-20" />
                  <div className="min-h-[44px] h-11 bg-white/10 rounded-[var(--radius-sm)] animate-pulse w-20" />
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}

export function GuideCardSkeleton({
  count = 3,
  gridClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}: { count?: number; gridClass?: string }) {
  const { t } = useTranslation();
  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">{t("common_loading")}</p>
      <ul className={`grid gap-4 list-none p-0 m-0 ${gridClass}`} aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <article className={glassCard}>
              <div className="p-4 flex gap-3 border-b border-white/15">
                <div className="w-14 h-14 rounded-full bg-white/15 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-4 bg-white/15 rounded-[var(--radius-sm)] animate-pulse w-2/3" />
                  <div className="h-3 bg-white/10 rounded-[var(--radius-sm)] animate-pulse w-1/2" />
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="min-h-[44px] h-11 min-w-[44px] w-16 bg-white/10 rounded-[var(--radius-sm)] animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-4 bg-white/10 rounded-[var(--radius-sm)] animate-pulse w-full" />
                <div className="min-h-[44px] h-11 bg-white/15 rounded-[var(--radius-sm)] animate-pulse w-full mt-2" />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
