"use client";

type TFunc = (key: string) => string;

/** 首屏/切换 period：单榜骨架（与书页式主内容区同宽） */
export default function DidRankSkeleton({ t }: { t: TFunc }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-white/20 bg-slate-900/70 backdrop-blur-md overflow-hidden ring-1 ring-white/5" aria-hidden>
      <div className="border-b border-white/10 bg-slate-950/50 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="h-5 w-40 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="h-3 w-72 mt-1.5 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
      </div>
      <div className="p-3 sm:p-4">
        <div className="h-4 w-24 mb-3 bg-slate-600/30 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-white/10 bg-slate-800/50 p-2 sm:p-3 animate-pulse">
              <div className="mb-1 flex min-h-[30px] items-center justify-center" aria-hidden>
                <div className="h-[30px] w-14 shrink-0 rounded-[var(--radius-sm)] bg-slate-600/60" />
              </div>
              <div className="h-11 w-11 mx-auto mb-1 rounded-full bg-slate-600/60" />
              <div className="h-3 w-12 mx-auto mb-0.5 rounded-[var(--radius-sm)] bg-slate-600/60" />
              <div className="h-4 w-14 mx-auto mb-0.5 rounded-[var(--radius-sm)] bg-slate-600/60" />
              <div className="h-3 w-16 mx-auto rounded-[var(--radius-sm)] bg-slate-600/60" />
            </div>
          ))}
        </div>
        <div className="h-4 w-28 mb-2 bg-slate-600/30 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="rounded border border-white/10 bg-slate-800/40 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2 border-b border-slate-700/50 last:border-b-0">
              <div className="h-4 w-5 rounded-[var(--radius-sm)] bg-slate-600/50 animate-pulse" />
              <div className="h-11 w-11 shrink-0 rounded-full bg-slate-600/50 animate-pulse" />
              <div className="h-4 flex-1 max-w-[80px] rounded-[var(--radius-sm)] bg-slate-600/50 animate-pulse" />
              <div className="h-4 w-16 rounded-[var(--radius-sm)] bg-slate-600/50 animate-pulse" />
            </div>
          ))}
          <div className="px-2 py-2 border-t border-white/10 flex justify-between text-meta text-slate-400">
            <span>{t("didRank_loading")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
