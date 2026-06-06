"use client";

import { TT_ORDERS_LIST_L5, ordersListL5ListItemStaggerMs } from "@/lib/orders/ordersListL5";

const shimmer = TT_ORDERS_LIST_L5.skeletonShimmer;

/**
 * `/orders` 首屏骨架：与成功态暖金卡片（外框 / 封面 / 操作列）同构，降低 CLS。
 */
export function OrdersListPageLoadingSkeleton() {
  return (
    <ul className="m-0 list-none space-y-4 p-0" role="presentation">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className={TT_ORDERS_LIST_L5.listItemEnter}
          style={{ animationDelay: `${ordersListL5ListItemStaggerMs(i)}ms` }}
        >
          <div className={TT_ORDERS_LIST_L5.listCardFrame}>
            <div className={`${TT_ORDERS_LIST_L5.listCardInner} flex flex-col sm:flex-row`}>
              <div className="w-full shrink-0 p-3 sm:w-48 sm:p-4 sm:pr-0">
                <div
                  className={`relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] sm:h-[168px] sm:aspect-auto ${TT_ORDERS_LIST_L5.coverRing}`}
                >
                  <div className={`absolute inset-0 ${shimmer}`} />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pl-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className={`h-5 w-full max-w-xs ${shimmer}`} />
                  <div className={`h-4 w-full max-w-[14rem] ${shimmer}`} />
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <div className={`h-6 w-20 rounded-full ${shimmer}`} />
                  </div>
                  <div className={`h-8 w-32 ${shimmer}`} />
                </div>
                <div className={`w-full shrink-0 space-y-2 sm:w-auto sm:min-w-[11rem] ${TT_ORDERS_LIST_L5.cardActionsPanel}`}>
                  <div className={`h-11 w-full rounded-[var(--radius-md)] ${shimmer}`} />
                  <div className={`h-11 w-full rounded-[var(--radius-md)] ${shimmer}`} />
                  <div className={`h-11 w-full rounded-[var(--radius-md)] ${shimmer}`} />
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 加载更多时底部单行骨架（与列表卡片同构） */
export function OrdersListLoadMoreRowSkeleton() {
  return (
    <ul className="m-0 list-none space-y-4 p-0" role="presentation">
      <li className={TT_ORDERS_LIST_L5.listItemEnter}>
        <div className={TT_ORDERS_LIST_L5.listCardFrame}>
          <div className={`${TT_ORDERS_LIST_L5.listCardInner} flex flex-col sm:flex-row`}>
            <div className="w-full shrink-0 p-3 sm:w-48 sm:p-4 sm:pr-0">
              <div
                className={`relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] sm:h-[168px] sm:aspect-auto ${TT_ORDERS_LIST_L5.coverRing}`}
              >
                <div className={`absolute inset-0 ${shimmer}`} />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pl-3">
              <div className="min-w-0 flex-1 space-y-3">
                <div className={`h-5 w-full max-w-xs ${shimmer}`} />
                <div className={`h-4 w-full max-w-[14rem] ${shimmer}`} />
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <div className={`h-6 w-20 rounded-full ${shimmer}`} />
                  <div className={`h-6 w-28 rounded-full ${shimmer}`} />
                </div>
              </div>
              <div className={`w-full shrink-0 space-y-2 sm:w-auto sm:min-w-[11rem] ${TT_ORDERS_LIST_L5.cardActionsPanel}`}>
                <div className={`h-11 w-full rounded-[var(--radius-md)] ${shimmer}`} />
                <div className={`h-11 w-full rounded-[var(--radius-md)] ${shimmer}`} />
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  );
}

export function OrdersListSearchLoadingSkeleton() {
  return (
    <div className={`${TT_ORDERS_LIST_L5.searchWrap} mb-5`} aria-hidden>
      <div className={`relative h-11 w-full ${shimmer} rounded-[var(--radius-lg)]`} />
    </div>
  );
}

export function OrdersListToolbarLoadingSkeleton() {
  return (
    <div className={TT_ORDERS_LIST_L5.toolbarShell} aria-hidden>
      <div className={`${TT_ORDERS_LIST_L5.toolbarInnerFlat} space-y-3`}>
        <div className={`h-4 w-24 ${shimmer}`} />
        <div className={`h-12 w-full max-w-lg ${shimmer} rounded-[var(--radius-lg)]`} />
        <div className={`h-11 w-full ${shimmer} rounded-[var(--radius-lg)]`} />
      </div>
    </div>
  );
}

export function OrdersListFilterRailLoadingSkeleton() {
  return (
    <div className={`${TT_ORDERS_LIST_L5.stickyFilterRail} -mt-1 mb-5`} aria-hidden>
      <div className={`h-4 w-24 ${shimmer}`} />
      <div className={`mt-3 h-12 w-full max-w-lg ${shimmer} rounded-[var(--radius-lg)]`} />
    </div>
  );
}

export function OrdersListPageHeroLoadingSkeleton() {
  return (
    <div className={TT_ORDERS_LIST_L5.skeletonHeroBlock} aria-hidden>
      <div className={TT_ORDERS_LIST_L5.heroFrame}>
        <div className={`${TT_ORDERS_LIST_L5.heroInner} space-y-4`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-3 w-28 ${shimmer}`} />
              <div className={`h-10 w-56 max-w-[70%] ${shimmer}`} />
              <div className={`h-4 w-full max-w-xl ${shimmer}`} />
              <div className={`h-3.5 w-full max-w-md ${shimmer}`} />
            </div>
            <div className={`hidden h-12 w-full max-w-[12rem] shrink-0 rounded-[var(--radius-md)] sm:block ${shimmer}`} />
          </div>
        </div>
      </div>
      <div className="px-1">
        <div className={TT_ORDERS_LIST_L5.bridgeLine} />
      </div>
    </div>
  );
}
