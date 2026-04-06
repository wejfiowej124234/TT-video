"use client";

import { useState, useEffect, useId, useMemo } from "react";
import { isAddress } from "viem";
import { useAccount, useSimulateContract } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import TxMachineStatus from "../TxMachineStatus";
import escrowAbiJson from "@/dapp/abis/Escrow.json";
import { escrowDisputeSummaryToReasonHash } from "@/lib/escrowDisputeReason";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import type { ConfirmAction } from "./types";
import type { OrderRow } from "./types";
import { escrowChainTxErrorUserMessage } from "@/lib/mapEscrowChainTxError";
import {
  marketCyanPillControlFocusClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";
import EscrowChainMismatchActions from "./EscrowChainMismatchActions";

const ESCROW_ABI = escrowAbiJson as readonly unknown[];

export interface EscrowTxModalProps {
  confirmAction: ConfirmAction;
  onClose: () => void;
  onConfirm: () => void;
  /** 链上 openDispute(bytes32)：由摘要派生 reasonHash 后签名 */
  onConfirmDispute?: (reasonHash: `0x${string}`) => void;
  order: OrderRow;
  amount: string;
  currency: string;
  snapshotHash: string | null;
  chainId: number;
  /** 协议目标链（与 35 §3.1 错链提示一致） */
  expectedChainId: number;
  /** Escrow.token()；错链或未加载时可能为空 */
  settlementTokenAddress?: `0x${string}`;
  settlementTokenSymbol?: string;
  /** deposit(uint256) 传入的原始整数（与订单展示金额同源换算） */
  depositAmountOnChain?: bigint;
  pending: boolean;
  success: boolean;
  failed: boolean;
  txError: string | null;
  /** 清除 wagmi 写错误以便重试（B-030） */
  onDismissTxError?: () => void;
  /** 从订单协议区打开时与 30-DID 深色弹层一致 */
  variantDid?: boolean;
  /** B-067：暂停时禁止确认签名（防弹层已开时绕门闸） */
  protocolPaused?: boolean;
}

export default function EscrowTxModal({
  confirmAction,
  onClose,
  onConfirm,
  onConfirmDispute,
  order,
  amount,
  currency,
  snapshotHash,
  chainId,
  expectedChainId,
  settlementTokenAddress,
  settlementTokenSymbol,
  depositAmountOnChain,
  pending,
  success,
  failed,
  txError,
  onDismissTxError,
  variantDid,
  protocolPaused = false,
}: EscrowTxModalProps) {
  const { t } = useTranslation();
  const action = confirmAction;
  const { isConnected } = useAccount();
  const [disputeSummary, setDisputeSummary] = useState("");
  const [disputeFieldError, setDisputeFieldError] = useState<string | null>(null);
  const trapRef = useFocusTrap(!!confirmAction, onClose);
  const modalTitleId = useId();
  const modalDescId = useId();
  const modalDetailsId = useId();
  const modalNoteId = useId();
  const disputeSummaryFieldId = useId();
  const disputeHintId = useId();
  const disputeErrId = useId();

  const wrongChain = chainId !== expectedChainId;
  const escrowHex =
    order.escrow_address && isAddress(order.escrow_address)
      ? (order.escrow_address as `0x${string}`)
      : undefined;
  const simBase = Boolean(action && escrowHex && !wrongChain && isConnected);

  const disputeParsed = useMemo(
    () => escrowDisputeSummaryToReasonHash(disputeSummary),
    [disputeSummary]
  );

  const depositSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "deposit",
    args:
      depositAmountOnChain !== undefined && depositAmountOnChain > BigInt(0)
        ? [depositAmountOnChain]
        : undefined,
    query: {
      enabled:
        simBase &&
        action === "deposit" &&
        depositAmountOnChain !== undefined &&
        depositAmountOnChain > BigInt(0),
    },
  });

  const releaseSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "release",
    query: { enabled: simBase && action === "release" },
  });

  const refundSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "refund",
    query: { enabled: simBase && action === "refund" },
  });

  const disputeSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "openDispute",
    args: disputeParsed.ok ? [disputeParsed.hash] : undefined,
    query: {
      enabled: simBase && action === "dispute" && disputeParsed.ok,
    },
  });

  useEffect(() => {
    if (confirmAction === "dispute") return;
    setDisputeSummary("");
    setDisputeFieldError(null);
  }, [confirmAction]);

  useEffect(() => {
    if (txError && typeof window !== "undefined") {
      console.error("Escrow tx modal error (detail in console only):", txError);
    }
  }, [txError]);

  const activeSim =
    action === "deposit"
      ? depositSim
      : action === "release"
        ? releaseSim
        : action === "refund"
          ? refundSim
          : action === "dispute"
            ? disputeSim
            : null;

  const gasUnits = (activeSim?.data as { request?: { gas?: bigint } } | undefined)?.request?.gas;

  const gasPending = Boolean(activeSim?.isFetching || activeSim?.isPending);
  const gasFailed = Boolean(simBase && action && activeSim?.isError);

  if (!action) return null;

  const functionLabel =
    action === "deposit" ? "deposit(uint256)" :
    action === "release" ? "release()" :
    action === "refund" ? "refund()" : "openDispute(bytes32)";
  const hasEscrowAddr = Boolean(order.escrow_address);
  const isDid = !!variantDid;
  const modalCtaFocusClass = isDid
    ? marketCyanPillControlFocusClasses
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const panelClass = isDid
    ? "w-full max-w-md rounded-[var(--radius-xl)] border border-cyan-500/30 bg-slate-900/95 backdrop-blur-md p-6 shadow-scifi-modal-inner space-y-4"
    : "w-full max-w-md rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-strong space-y-4";
  const titleClass = isDid ? "text-body-l font-semibold text-cyan-200" : "text-body-l font-semibold text-ink-900";
  const descClass = isDid ? "text-small text-slate-300 leading-relaxed" : "text-small text-ink-600";
  const ulClass = isDid
    ? "text-small space-y-1 font-mono bg-slate-800/70 border border-slate-600/40 p-3 rounded-[var(--radius-sm)] text-slate-200"
    : "text-small space-y-1 font-mono bg-bg-soft p-3 rounded-[var(--radius-sm)]";
  const labelSpanClass = isDid ? "text-slate-300" : "text-ink-500";
  const sansMutedClass = isDid ? "font-sans text-slate-300" : "font-sans text-ink-600";
  const disputeLabelClass = isDid ? "block text-small font-medium text-slate-300" : "block text-small font-medium text-ink-700";
  const disputeHintClass = isDid ? "text-meta text-slate-300" : "text-meta text-ink-500";
  const cancelBtnClass = isDid
    ? `btn-console inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-slate-500/60 px-4 py-2 text-slate-200 hover:bg-slate-800/60 ${modalCtaFocusClass}`
    : `btn-console inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-700 ${modalCtaFocusClass}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={modalTitleId}
      aria-describedby={`${modalDescId} ${modalDetailsId} ${modalNoteId}`}
    >
      <div ref={trapRef} className={panelClass}>
        <h3 id={modalTitleId} className={titleClass}>
          {t("escrow_signConfirmTitle")}
        </h3>
        <p id={modalDescId} className={descClass}>
          {t("escrow_signConfirmDesc")}
        </p>
        {protocolPaused ? (
          <p className={isDid ? "text-small text-amber-200/95" : "text-small text-warning"} role="status">
            {t("escrow_protocolPause_body")}
          </p>
        ) : null}
        <ul id={modalDetailsId} className={ulClass}>
          <li><span className={labelSpanClass}>{t("escrow_chainId")}</span>{chainId}</li>
          {wrongChain && (
            <li className="text-warning font-sans" role="alert">
              {t("escrow_wrongChainDesc")
                .replace("{expectedChainId}", String(expectedChainId))
                .replace("{chainId}", String(chainId))}
            </li>
          )}
          <li><span className={labelSpanClass}>{t("escrow_contract")}</span>{order.escrow_address}</li>
          <li><span className={labelSpanClass}>{t("escrow_function")}</span>{functionLabel}</li>
          <li><span className={labelSpanClass}>{t("escrow_amount")}</span>{amount} {currency}</li>
          <li>
            <span className={labelSpanClass}>{t("escrow_token")}</span>
            {settlementTokenAddress ? (
              <span title={settlementTokenAddress}>
                {settlementTokenSymbol ? `${settlementTokenSymbol} · ` : ""}
                {shortEvmAddress(settlementTokenAddress)}
              </span>
            ) : hasEscrowAddr ? (
              <span className={sansMutedClass}>{t("escrow_settlementTokenPending")}</span>
            ) : (
              <span className={sansMutedClass}>{t("escrow_tokenWhitelist")}</span>
            )}
          </li>
          {action === "deposit" && depositAmountOnChain !== undefined && (
            <li>
              <span className={labelSpanClass}>{t("escrow_depositAmountOnChain")}</span>
              {depositAmountOnChain.toString()}
            </li>
          )}
          {snapshotHash && (
            <li><span className={labelSpanClass}>{t("escrow_snapshotHashLabel")}</span><span className="break-all">{snapshotHash}</span></li>
          )}
          <li><span className={labelSpanClass}>{t("escrow_platformFeeBps")}</span>{t("escrow_platformFeeFromContract")}</li>
          <li>
            <span className={labelSpanClass}>{t("escrow_gas")}</span>
            {gasUnits != null ? (
              <span title={t("escrow_gasWalletFinalNote")}>
                {t("escrow_gasLineEstimated").replace("{{units}}", gasUnits.toString())}
              </span>
            ) : gasPending ? (
              <span className={sansMutedClass}>{t("escrow_gasEstimating")}</span>
            ) : gasFailed ? (
              <span className={sansMutedClass}>{t("escrow_gasEstimateUnavailable")}</span>
            ) : (
              <span>{t("escrow_gasFromWallet")}</span>
            )}
          </li>
          <li><span className={labelSpanClass}>{t("escrow_finalityN")}</span>{t("escrow_finalityBlocks")}</li>
        </ul>
        {wrongChain && (
          <EscrowChainMismatchActions
            isConnected={isConnected}
            expectedChainId={expectedChainId}
            chainId={chainId}
            variantDid={variantDid}
          />
        )}
        <TxMachineStatus
          pending={pending}
          success={success}
          failed={failed}
          variantDid={variantDid}
          signing={!!action && !pending && !success && !failed}
        />
        {action === "dispute" && !success && !failed && (
          <div className="space-y-2">
            <label htmlFor={disputeSummaryFieldId} className={disputeLabelClass}>
              {t("escrow_disputeReasonLabel")}
            </label>
            <textarea
              id={disputeSummaryFieldId}
              rows={4}
              value={disputeSummary}
              onChange={(e) => {
                setDisputeSummary(e.target.value);
                setDisputeFieldError(null);
              }}
              className={
                isDid
                  ? "w-full rounded-[var(--radius-sm)] border border-slate-500/50 bg-white px-3 py-2 text-small text-ink-900 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  : "w-full rounded-[var(--radius-sm)] border border-ink-300 bg-bg-main px-3 py-2 text-small text-ink-900 focus:outline-none focus-visible:border-travel-500 " +
                    `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
              }
              placeholder={t("escrow_disputeReasonPlaceholder")}
              aria-invalid={!!disputeFieldError}
              aria-describedby={disputeFieldError ? disputeErrId : disputeHintId}
            />
            <p id={disputeHintId} className={disputeHintClass}>
              {t("escrow_disputeReasonHashHint")}
            </p>
            {disputeFieldError && (
              <p id={disputeErrId} className="text-meta text-danger" role="alert">
                {disputeFieldError}
              </p>
            )}
          </div>
        )}
        {txError && (
          <div className="space-y-2" role="alert">
            <p className="text-meta text-danger">
              {escrowChainTxErrorUserMessage(txError, t)}
            </p>
            {failed && onDismissTxError && (
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  onDismissTxError();
                }}
              >
                <button
                  type="submit"
                  className={
                    isDid
                      ? `text-small text-cyan-300 underline-offset-2 hover:underline ${modalCtaFocusClass}`
                      : `text-small text-travel-600 underline-offset-2 hover:underline ${modalCtaFocusClass}`
                  }
                >
                  {t("common_closeAlert")}
                </button>
              </form>
            )}
          </div>
        )}
        <p id={modalNoteId} className={isDid ? "text-meta text-warning/95" : "text-meta text-warning"} role="note">
          {t("escrow_doNotResubmit")}
        </p>
        <div className="flex gap-3 justify-end">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button type="submit" className={cancelBtnClass}>
              {success || failed ? t("escrow_close") : t("common_cancel")}
            </button>
          </form>
          {!success && !failed && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                if (protocolPaused) return;
                if (action === "dispute") {
                  const parsed = escrowDisputeSummaryToReasonHash(disputeSummary);
                  if (!parsed.ok) {
                    setDisputeFieldError(
                      parsed.error === "empty"
                        ? t("escrow_disputeReasonRequired")
                        : t("escrow_disputeReasonTooShort")
                    );
                    return;
                  }
                  onConfirmDispute?.(parsed.hash);
                  return;
                }
                onConfirm();
              }}
            >
              <button
                type="submit"
                disabled={
                  protocolPaused ||
                  pending ||
                  wrongChain ||
                  (action === "dispute" && !onConfirmDispute)
                }
                aria-busy={pending ? true : undefined}
                className={`btn-console inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small disabled:opacity-50 ${modalCtaFocusClass}`}
              >
                {pending ? t("escrow_confirming") : t("escrow_confirmAndSign")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
