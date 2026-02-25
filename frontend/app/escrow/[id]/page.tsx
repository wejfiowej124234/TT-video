import { Suspense } from "react";
import EscrowDetail from "@/components/escrow/EscrowDetail";

export default function EscrowPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-console text-ink-800">
      <div className="container py-12">
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <EscrowDetail escrowId={params.id} />
        </Suspense>
      </div>
    </div>
  );
}
