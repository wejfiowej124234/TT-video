import EscrowDetailSkeleton from "@/components/escrow/EscrowDetail/EscrowDetailSkeleton";
import { TT_ESCROW_PROTOCOL_PAGE_SHELL } from "@/lib/escrowProtocolUi";

/** 托管详情动态段：与 page / EscrowDetailSection 同暖色壳 + EscrowDetailSkeleton，降低 CLS */
export default function EscrowDetailRouteLoading() {
  return (
    <div className={TT_ESCROW_PROTOCOL_PAGE_SHELL}>
      <div className="container py-8 md:py-12 max-w-5xl">
        <EscrowDetailSkeleton />
      </div>
    </div>
  );
}
