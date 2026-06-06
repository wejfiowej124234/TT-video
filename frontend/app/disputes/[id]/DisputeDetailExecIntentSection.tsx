"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import IntentSignFacts from "@/components/escrow/EscrowDetail/IntentSignFacts";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import type { DisputeDetail } from "./disputeDetailPageTypes";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";
import { DISPUTE_DETAIL_SECTION_CLASS } from "./disputeDetailChrome";

type Props = Pick<
  DisputeDetailPageModel,
  | "t"
  | "id"
  | "orderEscrowAddr"
  | "orderEscrowEnvelopeMismatch"
  | "meRoleFetch"
  | "onMeRoleRetry"
  | "expectedChainId"
  | "execIntentError"
  | "execIntentOk"
  | "execIntentSubmitting"
  | "handleExecuteResolutionIntent"
  | "walletConnected"
  | "chainMismatch"
  | "isSigning"
> & { dispute: DisputeDetail };

export function DisputeDetailExecIntentSection({
  t,
  id,
  dispute,
  orderEscrowAddr,
  orderEscrowEnvelopeMismatch,
  meRoleFetch,
  onMeRoleRetry,
  expectedChainId,
  execIntentError,
  execIntentOk,
  execIntentSubmitting,
  handleExecuteResolutionIntent,
  walletConnected,
  chainMismatch,
  isSigning,
}: Props) {
  return (
    <section className={DISPUTE_DETAIL_SECTION_CLASS}>
      <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_execSection")}</h2>
      <p className={TT_DISPUTES_L5.sectionBody}>{t("dispute_execNote")}</p>
      {dispute.order_id && orderEscrowEnvelopeMismatch ? (
        <div className="mt-3">
          <ApiErrorAlert message={t("dispute_orderFetchMismatch")} />
        </div>
      ) : null}
      {dispute.order_id && orderEscrowAddr === undefined && !orderEscrowEnvelopeMismatch ? (
        <p className={`${TT_DISPUTES_L5.sectionMeta} mt-3`}>{t("common_loading")}</p>
      ) : null}
      {orderEscrowAddr === null && !orderEscrowEnvelopeMismatch ? (
        <p className={`${TT_DISPUTES_L5.sectionBody} mt-3`}>{t("dispute_executeIntentNoEscrow")}</p>
      ) : null}
      {orderEscrowAddr && !dispute.resolution_tx_hash ? (
        <>
          {meRoleFetch.phase === "loading" ? (
            <p className={`${TT_DISPUTES_L5.sectionMeta} mt-3`}>{t("common_loading")}</p>
          ) : meRoleFetch.phase === "failed" ? (
            <div className="mt-3 space-y-2">
              <ApiErrorAlert message={t("dispute_meRoleLoadFailed")} />
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onMeRoleRetry();
                }}
              >
                <button type="submit" className={TT_DISPUTES_L5.btnSecondary}>
                  {t("common_retry")}
                </button>
              </form>
            </div>
          ) : meRoleFetch.role !== null && meRoleFetch.role !== "arbitrator" ? (
            <p className={`${TT_DISPUTES_L5.sectionBody} mt-3`} role="status">
              {t("dispute_executeIntentArbitratorOnly")}
            </p>
          ) : (
            <div className={`${TT_DISPUTES_L5.divider} mt-4 space-y-2`}>
              <h3 className="text-small font-semibold text-slate-100">{t("dispute_executeIntentTitle")}</h3>
              {dispute.order_id ? (
                <IntentSignFacts
                  orderId={dispute.order_id}
                  expectedChainId={expectedChainId}
                  escrowAddress={orderEscrowAddr}
                  action="execute_resolution"
                  disputeId={id}
                />
              ) : null}
              <p className={TT_DISPUTES_L5.sectionMeta}>{t("dispute_executeIntentHint")}</p>
              <p className={TT_DISPUTES_L5.sectionMeta}>{t("dispute_executeIntentNoTxHint")}</p>
              {execIntentError ? (
                <p className="text-small text-danger" role="alert">
                  {execIntentError}
                </p>
              ) : null}
              {execIntentOk ? (
                <p className="text-small text-success" role="status">
                  {t("escrow_intentAccepted")}
                </p>
              ) : null}
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  handleExecuteResolutionIntent();
                }}
              >
                <button
                  type="submit"
                  disabled={execIntentSubmitting || isSigning || !walletConnected || chainMismatch}
                  aria-busy={execIntentSubmitting || isSigning ? true : undefined}
                  className={TT_DISPUTES_L5.btnPrimary}
                >
                  {execIntentSubmitting || isSigning ? t("common_submitting") : t("dispute_executeIntentTitle")}
                </button>
              </form>
              {!walletConnected ? <p className={TT_DISPUTES_L5.sectionMeta}>{t("escrow_intentConnectWallet")}</p> : null}
              {walletConnected && chainMismatch ? (
                <p className="text-meta text-warning">{t("escrow_intentWrongChain")}</p>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
