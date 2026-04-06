"use client";

/** 31 §5.3：Feed 骨架卡（列表） */
export function FeedSkeleton({ count, t }: { count: number; t: (k: string) => string }) {
  return (
    <div className="space-y-4" aria-label={t("common_loading")}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 overflow-hidden"
          role="presentation"
        >
          <div className="aspect-[4/3] bg-slate-800/80 animate-pulse" />
          <div className="p-3 sm:p-4 space-y-2">
            <div className="h-4 bg-slate-700/60 rounded-[var(--radius-sm)] w-3/4 animate-pulse" />
            <div className="h-3 bg-slate-700/50 rounded-[var(--radius-sm)] w-full animate-pulse" />
            <div className="h-3 bg-slate-700/50 rounded-[var(--radius-sm)] w-1/2 animate-pulse" />
            <div className="flex gap-4 pt-2">
              <div className="min-h-[44px] h-11 min-w-[44px] w-16 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="min-h-[44px] h-11 min-w-[44px] w-16 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 移动端双列网格骨架（小红书式） */
export function FeedGridSkeleton({ t }: { t: (k: string) => string }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:hidden" aria-label={t("common_loading")}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-900/70 overflow-hidden" role="presentation">
          <div className="aspect-[3/4] bg-slate-800/80 animate-pulse" />
          <div className="p-2 space-y-1.5">
            <div className="h-3 bg-slate-700/50 rounded-[var(--radius-sm)] w-full animate-pulse" />
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-slate-700/50 animate-pulse" />
              <div className="h-3 bg-slate-700/50 rounded-[var(--radius-sm)] flex-1 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
