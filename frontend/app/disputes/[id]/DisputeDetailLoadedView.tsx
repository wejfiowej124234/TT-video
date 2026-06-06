"use client";

import { DisputesL5FooterLinks } from "@/components/disputes/DisputesL5FooterLinks";
import { DisputesL5PageShell } from "@/components/disputes/DisputesL5PageShell";
import { DisputeDetailArbitratorSections } from "./DisputeDetailArbitratorSections";
import { DisputeDetailEvidenceSection } from "./DisputeDetailEvidenceSection";
import { DisputeDetailExecIntentSection } from "./DisputeDetailExecIntentSection";
import { DisputeDetailPageHeader } from "./DisputeDetailPageHeader";
import { DisputeDetailResultSection } from "./DisputeDetailResultSection";
import { DisputeDetailStatementsSection } from "./DisputeDetailStatementsSection";
import { DisputeDetailTimelineSection } from "./DisputeDetailTimelineSection";
import { DisputeDetailTraceableSection } from "./DisputeDetailTraceableSection";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";

export function DisputeDetailLoadedView(m: DisputeDetailPageModel) {
  const { dispute, t } = m;
  if (!dispute) return null;
  const isResolved = dispute.status === "resolved";

  return (
    <DisputesL5PageShell
      t={t}
      ariaLabel={`${t("dispute_detailTitle")}${dispute.id?.slice(0, 8)}`}
      variant="detail"
    >
      <div className="space-y-6" data-tt-dispute-detail-page="1">
        <DisputeDetailPageHeader t={t} dispute={dispute} />
        <DisputeDetailTimelineSection t={t} dispute={dispute} isResolved={isResolved} />
        <DisputeDetailStatementsSection t={t} dispute={dispute} />
        <DisputeDetailEvidenceSection
          t={t}
          dispute={dispute}
          isResolved={isResolved}
          orderEvidence={m.orderEvidence}
          orderEvidenceListFetch={m.orderEvidenceListFetch}
          orderEvidenceListError={m.orderEvidenceListError}
          onOrderEvidenceRetry={m.onOrderEvidenceRetry}
          evidenceHash={m.evidenceHash}
          setEvidenceHash={m.setEvidenceHash}
          evidenceSubmitting={m.evidenceSubmitting}
          evidenceError={m.evidenceError}
          handleEvidenceSubmit={m.handleEvidenceSubmit}
          disputeEvidenceHashInputId={m.disputeEvidenceHashInputId}
        />
        {isResolved ? <DisputeDetailResultSection t={t} dispute={dispute} /> : null}
        {isResolved ? (
          <DisputeDetailExecIntentSection
            t={t}
            id={m.id}
            dispute={dispute}
            orderEscrowAddr={m.orderEscrowAddr}
            orderEscrowEnvelopeMismatch={m.orderEscrowEnvelopeMismatch}
            meRoleFetch={m.meRoleFetch}
            onMeRoleRetry={m.onMeRoleRetry}
            expectedChainId={m.expectedChainId}
            execIntentError={m.execIntentError}
            execIntentOk={m.execIntentOk}
            execIntentSubmitting={m.execIntentSubmitting}
            handleExecuteResolutionIntent={m.handleExecuteResolutionIntent}
            walletConnected={m.walletConnected}
            chainMismatch={m.chainMismatch}
            isSigning={m.isSigning}
          />
        ) : null}
        {isResolved ? (
          <DisputeDetailTraceableSection
            t={t}
            dispute={dispute}
            disputeTraceableHeadingId={m.disputeTraceableHeadingId}
            explorerTxUrl={m.explorerTxUrl}
            txHashCopied={m.txHashCopied}
            copyTxBusy={m.copyTxBusy}
            copyTxHash={m.copyTxHash}
          />
        ) : null}
        {!isResolved ? (
          <DisputeDetailArbitratorSections
            t={t}
            meRoleFetch={m.meRoleFetch}
            onMeRoleRetry={m.onMeRoleRetry}
            refundRatio={m.refundRatio}
            setRefundRatio={m.setRefundRatio}
            slashGuide={m.slashGuide}
            setSlashGuide={m.setSlashGuide}
            resolveError={m.resolveError}
            resolveSubmitting={m.resolveSubmitting}
            handleResolve={m.handleResolve}
            disputeRefundRatioInputId={m.disputeRefundRatioInputId}
          />
        ) : null}
        <DisputesL5FooterLinks t={t} showList />
      </div>
    </DisputesL5PageShell>
  );
}
