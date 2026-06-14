"use client";

import Link from "next/link";
import { useCallback } from "react";
import EscrowDetailEscrowOverviewPanel from "@/components/escrow/EscrowDetail/EscrowDetailEscrowOverviewPanel";
import EscrowTxModal from "@/components/escrow/EscrowDetail/EscrowTxModal";
import EscrowDetailLoadErrorView from "@/components/escrow/EscrowDetail/EscrowDetailLoadErrorView";
import EscrowDetailSkeleton from "@/components/escrow/EscrowDetail/EscrowDetailSkeleton";
import CreateOnChainEscrowBlock from "@/components/escrow/EscrowDetail/CreateOnChainEscrowBlock";
import SetEscrowAddressBlock from "@/components/escrow/EscrowDetail/SetEscrowAddressBlock";
import EscrowOnChainActions from "@/components/escrow/EscrowDetail/EscrowOnChainActions";
import DisputeResolutionFundBlock from "@/components/escrow/EscrowDetail/DisputeResolutionFundBlock";
import ReorgBanner from "@/components/escrow/EscrowDetail/ReorgBanner";
import EscrowRiskNotice from "@/components/escrow/EscrowDetail/EscrowRiskNotice";
import { useTranslation } from "@/components/LocaleProvider";
import { useEscrowDetail } from "@/components/escrow/EscrowDetail/useEscrowDetail";
import { getEscrowFactoryAddress } from "@/lib/escrowFactoryEnv";
import { readOrderMockPayEnabledFromMeta } from "@/lib/readOrderMockPayFromMeta";
import { readProtocolPauseFromMeta } from "@/lib/readProtocolPauseFromMeta";
import { useMeta } from "@/components/MetaProvider";
import {
  escrowProtocolHeadingClass,
  escrowProtocolLinkClass,
  escrowProtocolMetaClass,
  TT_ESCROW_PROTOCOL_PANEL,
  TT_ESCROW_PROTOCOL_ZONE,
} from "@/lib/escrowProtocolUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
export function EscrowChainPageMain({ escrowId }: { escrowId: string }) {
  const { t } = useTranslation();
  const data = useEscrowDetail(escrowId, t);
  const { meta } = useMeta();
  const protocolPaused = readProtocolPauseFromMeta(meta);
  const chainOffRestConfirmCompletionEnabled = readOrderMockPayEnabledFromMeta(meta);

  const handleReorgRefresh = useCallback(() => {
    data.setDismissReorgBanner(false);
    void data.refreshOrder({ force: true });
  }, [data]);

  const handleTxConfirm = useCallback(() => {
    if (protocolPaused) return;
    if (data.confirmAction === "deposit") {
      if (data.needsDepositApproval) return;
      data.deposit();
    } else if (data.confirmAction === "release") data.release();
    else if (data.confirmAction === "refund") data.refund();
  }, [data, protocolPaused]);

  const handleConfirmDispute = useCallback(
    (reasonHash: `0x${string}`) => {
      if (protocolPaused) return;
      data.openDispute(reasonHash);
    },
    [data, protocolPaused],
  );

  if (!data.order && !data.error) return <EscrowDetailSkeleton />;
  if (data.error || !data.order) {
    return (
      <EscrowDetailLoadErrorView
        message={data.error ?? t("escrow_loadFailed")}
        onRetry={() => void data.refreshOrder({ force: true })}
        cancelPolicyHeadingId="escrow-cancel-policy"
        t={t}
        orderGetRateLimited={data.orderGetRateLimited}
      />
    );
  }

  const order = data.order;
  const itinerary = data.itinerary;
  const panelClass = TT_ESCROW_PROTOCOL_PANEL;

  return (
    <main
      className="space-y-6"
      role="main"
      aria-label={t("escrow_chain_page_aria")}
      data-tt-escrow-chain-page="1"
    >
      <p className="text-meta print:hidden">
        <Link
          href={`/escrow/${encodeURIComponent(escrowId)}`}
          className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolLinkClass}`}
        >
          {t("escrow_chain_back")}
        </Link>
      </p>

      <div data-zone="order-chain-record" className={`${TT_ESCROW_PROTOCOL_ZONE} space-y-5`}>
        <header className="space-y-1">
          <h1 className={escrowProtocolHeadingClass}>{t("escrow_chain_title")}</h1>
          <p className={escrowProtocolMetaClass}>{t("escrow_chain_subtitle")}</p>
        </header>

        <EscrowDetailEscrowOverviewPanel
          order={order}
          data={{
            amount: data.amount,
            currency: data.currency,
            hasEscrow: data.hasEscrow,
            chainMismatch: data.chainMismatch,
            chainContractReadDegraded: data.chainContractReadDegraded,
            lastChainContractReadOkAt: data.lastChainContractReadOkAt,
            chainSync: data.chainSync,
            snapshotHash: data.snapshotHash,
          }}
          panelClass={panelClass}
          t={t}
        />

        {!data.hasEscrow && !data.isDraft ? (
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
              panelClassName={`${panelClass} p-6 space-y-3`}
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
        ) : null}

        {data.hasEscrow ? (
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
        ) : null}

        {!data.isDraft ? (
          <DisputeResolutionFundBlock
            orderId={String(order.id)}
            orderAmountStr={String(data.amount)}
            currency={String(data.currency ?? "")}
            orderState={data.state}
            variantDid
          />
        ) : null}

        {data.showReorgBanner ? (
          <ReorgBanner onRefresh={handleReorgRefresh} onDismiss={() => data.setDismissReorgBanner(true)} variantDid />
        ) : null}

        <EscrowRiskNotice disputeDeadlineAt={data.disputeDeadlineAt} disputeWindowExpired={data.disputeWindowExpired} />
      </div>

      <EscrowTxModal
        confirmAction={data.confirmAction}
        onClose={() => data.setConfirmAction(null)}
        onConfirm={handleTxConfirm}
        onConfirmDispute={handleConfirmDispute}
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
    </main>
  );
}
