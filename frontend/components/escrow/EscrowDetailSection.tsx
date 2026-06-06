"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import EscrowDetailSkeleton from "@/components/escrow/EscrowDetail/EscrowDetailSkeleton";
import { TT_ESCROW_PROTOCOL_PAGE_SHELL } from "@/lib/escrowProtocolUi";

/** dynamic / Suspense 回退：与 `app/escrow/[id]/loading.tsx` 同 Experience 暖色骨架，避免协议青屏闪回 */
function EscrowDetailRouteLoading() {
  return (
    <div className={TT_ESCROW_PROTOCOL_PAGE_SHELL}>
      <div className="container py-8 md:py-12 max-w-5xl">
        <EscrowDetailSkeleton />
      </div>
    </div>
  );
}

const EscrowDetail = dynamic(
  () => import("@/components/escrow/EscrowDetail").then((m) => m.default),
  {
    ssr: false,
    loading: () => <EscrowDetailRouteLoading />,
  },
);

/** `/escrow/[id]`：Next 15 要求 `dynamic(..., { ssr: false })` 在 Client 边界内；与 `EscrowRateRouteSuspense` 同属订单主链入口（07 §5.1） */
export function EscrowDetailSection({ escrowId }: { escrowId: string }) {
  return (
    <Suspense fallback={<EscrowDetailRouteLoading />}>
      <EscrowDetail escrowId={escrowId} />
    </Suspense>
  );
}
