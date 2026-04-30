"use client";

/**
 * `/market/provider` · `/market/acquisition`：目录 GET 飞行中与重试时的占位，
 * 避免 `catalogItemsRaw` 尚未写入时被误判为空而展示「目录离线」（生产级 IA）。
 */
export function MarketSubsiteCatalogLoadingSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <section
      className="mx-auto max-w-5xl px-4 py-8 sm:py-10"
      aria-busy="true"
      aria-label={ariaLabel}
      data-tt-market-subsite-surface="catalog_loading_skeleton"
    >
      <div className="mb-4 h-8 w-40 max-w-[50%] rounded-[var(--radius-md)] bg-white/10 animate-pulse motion-reduce:animate-none" />
      <ul className="m-0 columns-1 gap-4 p-0 sm:columns-2 [column-fill:_balance] list-none">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="mb-4 break-inside-avoid">
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-ink-900/40 ring-1 ring-white/[0.06]">
              <div className="aspect-[4/5] w-full animate-pulse motion-reduce:animate-none bg-white/10 sm:aspect-[3/4]" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-full max-w-[14rem] rounded bg-white/10 animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-full max-w-[10rem] rounded bg-white/[0.07] animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
