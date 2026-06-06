"use client";

import Link from "next/link";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { escrowProtocolFooterActionClass } from "@/lib/escrowProtocolUi";
import EscrowCancelPolicySection from "./EscrowCancelPolicySection";
import EscrowCopySummaryButton from "./EscrowCopySummaryButton";
import EscrowOrderPrintButton from "./EscrowOrderPrintButton";
import EscrowRiskNotice from "./EscrowRiskNotice";
import ReorgBanner from "./ReorgBanner";
import type { OrderRow } from "./types";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";

export function EscrowDetailProtocolTailFooter({
  order,
  data,
  cancelPolicyHeadingId,
  copySummaryBusy,
  copySummaryDone,
  onCopySummary,
  stashEscrowDetailPayOrRatePrefetch,
  onReorgRefresh,
  t,
}: {
  order: OrderRow;
  data: Pick<UseEscrowDetailResult, "showReorgBanner" | "setDismissReorgBanner" | "disputeDeadlineAt" | "disputeWindowExpired">;
  cancelPolicyHeadingId: string;
  copySummaryBusy: boolean;
  copySummaryDone: boolean;
  onCopySummary: () => void | Promise<void>;
  stashEscrowDetailPayOrRatePrefetch: () => void;
  onReorgRefresh: () => void;
  t: (key: string) => string;
}) {
  return (
    <>
      {data.showReorgBanner && (
        <ReorgBanner onRefresh={onReorgRefresh} onDismiss={() => data.setDismissReorgBanner(true)} variantDid />
      )}

      <EscrowRiskNotice disputeDeadlineAt={data.disputeDeadlineAt} disputeWindowExpired={data.disputeWindowExpired} />

      <EscrowCancelPolicySection headingId={cancelPolicyHeadingId} />

      <div className="text-small text-slate-300 flex flex-wrap items-center gap-4">
        <EscrowOrderPrintButton variant="protocolDid" />
        <EscrowCopySummaryButton variant="protocolDid" onCopy={onCopySummary} busy={copySummaryBusy} done={copySummaryDone} />
        <Link
          href="/orders"
          className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolFooterActionClass}`}
        >
          {t("escrow_backToOrders")}
        </Link>
        <Link
          href={`/pay?orderId=${encodeURIComponent(String(order.id))}`}
          onClick={stashEscrowDetailPayOrRatePrefetch}
          className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolFooterActionClass}`}
        >
          {t("orders_payHub")}
        </Link>
      </div>
      <ProductCrossNav
        ariaLabelKey="escrow_detail_relatedNav_aria"
        showGuides
        className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
        linkClassName={`inline-flex min-h-[44px] items-center justify-center ${escrowProtocolFooterActionClass}`}
        separatorClassName="text-slate-500"
      />
    </>
  );
}
