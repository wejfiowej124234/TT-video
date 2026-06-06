"use client";

import { getEscrowFactoryAddress } from "@/lib/escrowFactoryEnv";
import CreateOnChainEscrowBlock from "./CreateOnChainEscrowBlock";
import EscrowTxModal from "./EscrowTxModal";
import SetEscrowAddressBlock from "./SetEscrowAddressBlock";
import type { ItineraryBlock, OrderRow } from "./types";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";

export function EscrowDetailProtocolTailTxModalAndEscrowCreation({
  order,
  itinerary,
  data,
  panelClass,
  protocolPaused,
  onTxConfirm,
  onConfirmDispute,
}: {
  order: OrderRow;
  itinerary: ItineraryBlock | null;
  data: UseEscrowDetailResult;
  panelClass: string;
  protocolPaused: boolean;
  onTxConfirm: () => void;
  onConfirmDispute: (reasonHash: `0x${string}`) => void;
}) {
  return (
    <>
      <EscrowTxModal
        confirmAction={data.confirmAction}
        onClose={() => data.setConfirmAction(null)}
        onConfirm={onTxConfirm}
        onConfirmDispute={onConfirmDispute}
        protocolPaused={protocolPaused}
        order={order}
        amount={data.amount}
        currency={data.currency}
        snapshotHash={data.snapshotHash}
        chainId={data.chainId}
        expectedChainId={data.expectedChainId}
        settlementTokenAddress={data.settlementTokenAddress}
        settlementTokenSymbol={data.settlementTokenSymbol}
        depositAmountOnChain={data.depositAmount}
        pending={data.txModalPending}
        success={data.txModalSuccess}
        failed={data.txModalFailed}
        txError={data.txErrorMessage.trim() ? data.txErrorMessage : null}
        onDismissTxError={data.resetChainWriteError}
        variantDid
      />

      {!data.hasEscrow && !data.isDraft && (
        getEscrowFactoryAddress() ? (
          <CreateOnChainEscrowBlock
            order={order}
            itinerary={itinerary}
            snapshotHash={data.snapshotHash}
            meUserId={data.meData?.user?.id}
            meDefaultWallet={data.meData?.user?.default_wallet_address ?? undefined}
            connectedAddress={data.connectedAddress}
            isConnected={data.isConnected}
            chainId={data.chainId}
            expectedChainId={data.expectedChainId}
            chainMismatch={data.chainMismatch}
            refreshOrder={data.refreshOrder}
            panelClassName={panelClass + " p-6 space-y-3"}
            variantDid
            protocolPaused={protocolPaused}
          />
        ) : (
          <SetEscrowAddressBlock
            orderId={String(order.id)}
            onSuccess={data.refreshOrder}
            variantDid
            protocolPaused={protocolPaused}
          />
        )
      )}
    </>
  );
}
