"use client";

import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

type Props = {
  embedded: boolean;
  loadingAriaLabel: string;
};

export function OrderChatContextCardLoadingSkeleton({ embedded, loadingAriaLabel }: Props) {
  const A = TT_COMMUNITY_FEED_ACTION;
  return (
    <div
      className="flex flex-col sm:flex-row gap-3 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label={loadingAriaLabel}
    >
      <div
        className={embedded ? A.orderContextSkeletonMediaEmbedded : A.orderContextSkeletonMedia}
      />
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <div className={`h-4 ${A.orderContextSkeletonBar} w-4/5 max-w-xs`} />
        <div className={`h-3 ${A.orderContextSkeletonBar} w-3/5 max-w-[14rem]`} />
        <div className={`h-3 ${A.orderContextSkeletonBar} w-full max-w-md`} />
      </div>
    </div>
  );
}
