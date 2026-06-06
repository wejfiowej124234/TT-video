"use client";

import Link from "next/link";
import EscrowOnChainActions from "./EscrowOnChainActions";
import ReviewBlock from "./ReviewBlock";
import type { OrderRow } from "./types";
import { orderStateToStep } from "../OrderFlowSteps";
import {
  escrowProtocolInlineLinkClass,
  escrowProtocolMetaClass,
  escrowProtocolSubheadingClass,
} from "@/lib/escrowProtocolUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";

export function EscrowDetailProtocolTailRatingReviewChain({
  order,
  data,
  panelClass,
  protocolPaused,
  stashEscrowDetailPayOrRatePrefetch,
  t,
}: {
  order: OrderRow;
  data: UseEscrowDetailResult;
  panelClass: string;
  protocolPaused: boolean;
  stashEscrowDetailPayOrRatePrefetch: () => void;
  t: (key: string) => string;
}) {
  return (
    <>
      {data.state === "completed" && (
        <>
          {orderStateToStep(order) >= 6 && orderStateToStep(order) < 8 && (
            <div className={`${panelClass} p-4`}>
              <h3 className={`text-small font-semibold mb-1 ${escrowProtocolSubheadingClass}`}>{t("order_ratingEntry")}</h3>
              <p className={`text-small mb-3 leading-relaxed ${escrowProtocolMetaClass}`}>{t("order_ratingEntryDesc")}</p>
              <Link
                href={`/escrow/${encodeURIComponent(String(order.id))}/rate`}
                onClick={stashEscrowDetailPayOrRatePrefetch}
                className={`${touchTargetLink44Classes} inline-flex items-center gap-2 ${escrowProtocolInlineLinkClass}`}
                aria-label={t("order_ratingEntryCta")}
              >
                {t("order_ratingEntryCta")}
              </Link>
            </div>
          )}
          <ReviewBlock orderId={String(order.id)} variantDid />
        </>
      )}

      {data.hasEscrow && orderStateToStep(order) === 8 && (
        <p className="text-small text-slate-300 leading-relaxed" role="status">
          {t("escrow_releaseAfterRatingHint")}
        </p>
      )}
      {data.hasEscrow && (
        <EscrowOnChainActions
          isConnected={data.isConnected}
          chainMismatch={data.chainMismatch}
          expectedChainId={data.expectedChainId}
          chainId={data.chainId}
          confirmAction={data.confirmAction}
          pending={data.txSectionPending}
          success={data.txSectionSuccess}
          failed={data.txSectionFailed}
          depositAmount={data.depositAmount}
          depositPending={data.depositPending}
          releasePending={data.releasePending}
          refundPending={data.refundPending}
          disputePending={data.disputePending}
          disputeDisabled={data.disputeWindowExpired}
          canOpenDisputeOnChain={data.canOpenDisputeOnChain}
          disputeOnChainUnavailableReasonKey={data.disputeOnChainUnavailableReasonKey}
          canDepositOnChain={data.canDepositOnChain}
          canReleaseOnChain={data.canReleaseOnChain}
          canRefundOnChain={data.canRefundOnChain}
          needsDepositApproval={data.needsDepositApproval}
          onApproveForDeposit={data.approveForDeposit}
          approveDepositPending={data.approveDepositPending}
          onSetConfirmAction={(a) => {
            if (protocolPaused) return;
            data.setConfirmAction(a);
          }}
          onDeposit={data.deposit}
          onRelease={data.release}
          onRefund={data.refund}
          txErrorMessage={data.txErrorMessage}
          onDismissTxError={data.resetChainWriteError}
          variantDid
          protocolPaused={protocolPaused}
        />
      )}
    </>
  );
}
