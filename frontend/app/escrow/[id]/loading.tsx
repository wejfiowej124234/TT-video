import EscrowDetailSkeleton from "@/components/escrow/EscrowDetail/EscrowDetailSkeleton";

/** 托管详情动态段：与 page 同容器 + EscrowDetailSkeleton，布局与 53 §4.6.8 一致、降低 CLS */
export default function EscrowDetailRouteLoading() {
  return (
    <div className="min-h-screen bg-bg-main text-ink-800">
      <div className="container py-12">
        <EscrowDetailSkeleton />
      </div>
    </div>
  );
}
