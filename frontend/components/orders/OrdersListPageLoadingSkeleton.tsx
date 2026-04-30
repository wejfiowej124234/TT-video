"use client";

/**
 * `/orders` 首屏 `GET /api/v1/orders` 飞行中：与成功态订单卡片（图左文右 / 单列堆叠）同构骨架，避免整页仅 `LoadingText` 的 IA 落差。
 */
export function OrdersListPageLoadingSkeleton() {
  return (
    <ul className="m-0 list-none space-y-4 p-0" role="presentation">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white shadow-soft">
            <div className="flex flex-col sm:flex-row">
              <div className="relative aspect-[16/10] w-full shrink-0 animate-pulse motion-reduce:animate-none bg-ink-100 sm:h-[180px] sm:w-44" />
              <div className="min-w-0 flex-1 space-y-3 p-4 sm:p-5">
                <div className="h-5 w-full max-w-xs rounded bg-ink-100 animate-pulse motion-reduce:animate-none" />
                <div className="h-4 w-full max-w-[14rem] rounded bg-ink-50 animate-pulse motion-reduce:animate-none" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="h-6 w-20 rounded-[var(--radius-md)] bg-ink-100 animate-pulse motion-reduce:animate-none" />
                  <div className="h-6 w-24 rounded-[var(--radius-md)] bg-ink-50 animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
