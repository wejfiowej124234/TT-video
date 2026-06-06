"use client";

import { useId, useState, useRef, useEffect, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  orderAccept,
  orderCancel,
  orderConfirmCompletion,
  postOrderDispute,
  getIdempotencyKey,
} from "@/lib/apiClient";
import { useOrderIntentSigner } from "@/dapp/hooks/useOrderIntentSigner";
import { escrowDisputeSummaryToReasonHash } from "@/lib/escrowDisputeReason";
import { sameWallet } from "./utils";
import { mapIntentError } from "@/lib/mapIntentError";
import { mapApiReadError } from "@/lib/mapApiReadError";
import IntentSignFacts from "./IntentSignFacts";
import {
  escrowProtocolCompactInputClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolMetaClass,
  escrowProtocolPillFocusClass,
  escrowProtocolSubheadingClass,
  TT_ESCROW_PROTOCOL_SECTION,
} from "@/lib/escrowProtocolUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

function isEscrowEthAddress(s: string | null | undefined): s is `0x${string}` {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

export interface OrderActionsBlockProps {
  orderId: string;
  state: string;
  hasEscrow: boolean;
  onSuccess: () => void;
  guideWalletAddress?: string | null;
  connectedAddress?: string | null;
  /** 有托管合约时用于 EIP-712 domain.verifyingContract */
  escrowAddress?: string | null;
  /** 与 Wagmi / 后端 CHAIN_ID 一致 */
  expectedChainId: number;
  /** 争议窗口已过期时隐藏「登记争议意向」 */
  disputeWindowExpired?: boolean;
  variantDid?: boolean;
  /** B-067：`GET /meta` `pause.enabled` */
  protocolPaused?: boolean;
  /**
   * P07 / P3：`GET /meta` `orders.order_mock_pay_enabled`（与 `P3_CHAIN_OFF` 同源）为真时，
   * 对有托管地址的订单仍走 REST `confirm-completion`，便于测试网链下闭环；为假时保持「有 escrow 则 EIP-712 intent」。
   */
  chainOffRestConfirmCompletionEnabled?: boolean;
  /** Experience 草稿：非向导身份不展示「接单」 */
  allowAccept?: boolean;
  variantExperience?: boolean;
}

/** P23：订单操作；有 escrow_address 时确认完成默认走 EIP-712 + intents（202）；P3 链下闸开启时可走 REST confirm-completion（见 `chainOffRestConfirmCompletionEnabled`） */
export default function OrderActionsBlock({
  orderId,
  state,
  hasEscrow,
  onSuccess,
  guideWalletAddress,
  connectedAddress,
  escrowAddress,
  expectedChainId,
  disputeWindowExpired = false,
  variantDid,
  protocolPaused = false,
  chainOffRestConfirmCompletionEnabled = false,
  allowAccept = true,
  variantExperience = false,
}: OrderActionsBlockProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  /** 最近一次 `run()` 失败的操作标签，用于接单失败时展示专用重试（B-042） */
  const [errAction, setErrAction] = useState<string | null>(null);
  const [intentOk, setIntentOk] = useState<string | null>(null);
  const [disputeReasonSummary, setDisputeReasonSummary] = useState("");
  const [intentWalletDisconnectedTap, setIntentWalletDisconnectedTap] = useState(false);
  const acceptIdempotencyKeyRef = useRef<string | null>(null);
  const cancelIdempotencyKeyRef = useRef<string | null>(null);
  const confirmCompletionIdempotencyKeyRef = useRef<string | null>(null);
  const orderActionsHeadingId = useId();
  const guideWalletAlertId = useId();
  const acceptOtherPendingId = useId();

  const {
    isConnected,
    chainMismatch,
    isSigning,
    submitConfirmCompletionIntent,
    submitOpenDisputeIntent,
  } = useOrderIntentSigner(expectedChainId);

  useEffect(() => {
    if (isConnected) setIntentWalletDisconnectedTap(false);
  }, [isConnected]);

  const run = (label: string, fn: () => Promise<unknown>, fallbackKey: string) => {
    if (protocolPaused) return;
    setLoading(label);
    setErr(null);
    setErrAction(null);
    setIntentOk(null);
    fn()
      .then(() => {
        setErrAction(null);
        onSuccess();
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("OrderActionsBlock run:", e);
        }
        if (label === "accept") {
          acceptIdempotencyKeyRef.current = null;
        }
        setErrAction(label);
        setErr(mapApiReadError(e, t, fallbackKey));
      })
      .finally(() => setLoading(null));
  };

  const canAccept = state === "created" && allowAccept;
  const canCancel = state === "created" || state === "accepted";
  const canConfirmCompletion =
    state === "accepted" || state === "escrowed" || state === "funded";
  const canChainOffDispute =
    !hasEscrow && (state === "accepted" || state === "escrowed" || state === "funded");
  const validEscrow = hasEscrow && isEscrowEthAddress(escrowAddress);
  const canEscrowDisputeIntent =
    validEscrow &&
    (state === "accepted" || state === "escrowed" || state === "funded") &&
    !disputeWindowExpired;

  const needGuideWallet = canAccept || canConfirmCompletion;
  const guideWalletMismatch =
    needGuideWallet &&
    !!guideWalletAddress &&
    !!connectedAddress &&
    !sameWallet(guideWalletAddress, connectedAddress);

  const showOffchainConfirm =
    canConfirmCompletion &&
    (!hasEscrow || !validEscrow || chainOffRestConfirmCompletionEnabled);
  const showIntentConfirm =
    canConfirmCompletion && validEscrow && !chainOffRestConfirmCompletionEnabled;

  if (
    !canAccept &&
    !canCancel &&
    !showOffchainConfirm &&
    !showIntentConfirm &&
    !canChainOffDispute &&
    !canEscrowDisputeIntent
  ) {
    return null;
  }

  const busy = loading !== null || isSigning;
  const isExperience = !!variantExperience;
  const isDid = !!variantDid && !isExperience;
  const pillFocusClass = isDid
    ? escrowProtocolPillFocusClass
    : isExperience
      ? `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`
      : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const rootClass = isExperience
    ? "rounded-[var(--radius-md)] border border-white/12 bg-black/20 p-4 space-y-3"
    : isDid
      ? TT_ESCROW_PROTOCOL_SECTION
      : "rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-soft space-y-3";
  const hClass = isExperience
    ? "text-body font-semibold text-ref-sun/95"
    : isDid
      ? escrowProtocolSubheadingClass
      : "text-body font-semibold text-ink-800";
  const metaClass = isExperience
    ? "text-meta text-white/70"
    : isDid
      ? escrowProtocolMetaClass
      : "text-meta text-ink-500";
  const labelClass = isExperience
    ? "block text-meta text-white/75"
    : isDid
      ? `block ${escrowProtocolMetaClass}`
      : "block text-meta text-ink-600";

  const acceptBlockedByOtherPending = canAccept && busy && loading !== "accept";
  const acceptButtonTitle =
    canAccept && guideWalletMismatch
      ? t("escrow_guideWalletRequired")
      : acceptBlockedByOtherPending
        ? t("escrow_acceptBlocked_otherActionPending")
        : undefined;
  const acceptButtonDescribedBy =
    canAccept && guideWalletMismatch
      ? guideWalletAlertId
      : acceptBlockedByOtherPending
        ? acceptOtherPendingId
        : undefined;

  return (
    <div className={rootClass}>
      <h3 id={orderActionsHeadingId} className={hClass}>
        {t(isExperience ? "escrow_orderActions_experience" : "escrow_orderActions")}
      </h3>
      {guideWalletMismatch && (
        <p id={guideWalletAlertId} className="text-small text-warning" role="alert">
          {t("escrow_guideWalletRequired")}
        </p>
      )}
      {acceptBlockedByOtherPending && !guideWalletMismatch ? (
        <p id={acceptOtherPendingId} className={metaClass} role="status">
          {t("escrow_acceptBlocked_otherActionPending")}
        </p>
      ) : null}
      {protocolPaused ? (
        <p className={metaClass} role="status">
          {t("escrow_protocolPause_body")}
        </p>
      ) : null}
      {intentWalletDisconnectedTap && (
        <p className="text-small text-warning" role="alert">
          {t("escrow_connectWalletUseHeader")}
        </p>
      )}
      {err ? (
        <div className="space-y-2">
          <ApiErrorAlert message={err} tone={isDid ? "dark" : "default"} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {errAction === "accept" ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  if (busy || guideWalletMismatch) return;
                  const key =
                    acceptIdempotencyKeyRef.current ??
                    (acceptIdempotencyKeyRef.current = getIdempotencyKey());
                  run("accept", () => orderAccept(orderId, key), "order_error_accept_failed");
                }}
              >
                <button
                  type="submit"
                  disabled={protocolPaused || busy || guideWalletMismatch}
                  aria-label={t("common_retry")}
                  className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium disabled:opacity-50 ${pillFocusClass} ${
                    isDid
                      ? "border-slate-500/60 bg-slate-800/70 text-slate-200 hover:bg-slate-800"
                      : "border-ink-300 bg-white text-ink-800 hover:bg-ink-50"
                  }`}
                >
                  {t("common_retry")}
                </button>
              </form>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setErr(null);
                setErrAction(null);
              }}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium ${
                isDid
                  ? `border-white/20 text-slate-200 hover:bg-white/10 ${escrowProtocolPillFocusClass}`
                  : `border-ink-200 text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
              }`}
            >
              {t("common_closeAlert")}
            </button>
          </div>
        </div>
      ) : null}
      {intentOk && <p className="text-small text-success" role="status">{intentOk}</p>}
      <div
        className="flex flex-wrap gap-2"
        role="region"
        aria-labelledby={orderActionsHeadingId}
        aria-busy={busy ? true : undefined}
      >
        {canAccept && (
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              const key =
                acceptIdempotencyKeyRef.current ??
                (acceptIdempotencyKeyRef.current = getIdempotencyKey());
              run("accept", () => orderAccept(orderId, key), "order_error_accept_failed");
            }}
          >
            <button
              type="submit"
              disabled={protocolPaused || busy || guideWalletMismatch}
              aria-busy={loading === "accept" ? true : undefined}
              title={protocolPaused ? t("escrow_protocolPause_title") : acceptButtonTitle}
              aria-describedby={acceptButtonDescribedBy}
              className={`btn-console rounded-[var(--radius-sm)] px-3 py-1.5 text-small disabled:opacity-50 ${pillFocusClass} ${
                isExperience
                  ? "bg-ref-sun !text-ink-950 border border-ref-sun hover:bg-ref-sun/95 hover:!text-ink-950 font-semibold"
                  : "bg-success text-white"
              }`}
            >
              {loading === "accept" ? t("common_submitting") : t("escrow_accept")}
            </button>
          </form>
        )}
        {canCancel && (
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              const key =
                cancelIdempotencyKeyRef.current ??
                (cancelIdempotencyKeyRef.current = getIdempotencyKey());
              run("cancel", () => orderCancel(orderId, key), "order_error_cancel_failed");
            }}
          >
            <button
              type="submit"
              disabled={protocolPaused || busy}
              title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
              aria-busy={loading === "cancel" ? true : undefined}
              className={`btn-console rounded-[var(--radius-sm)] px-3 py-1.5 text-small disabled:opacity-50 ${pillFocusClass} ${
                isExperience
                  ? "border border-amber-400/55 text-amber-200 hover:bg-amber-500/12"
                  : "border border-warning text-warning"
              }`}
            >
              {loading === "cancel" ? t("common_submitting") : t("escrow_cancelOrder")}
            </button>
          </form>
        )}
        {showOffchainConfirm && (
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              const key =
                confirmCompletionIdempotencyKeyRef.current ??
                (confirmCompletionIdempotencyKeyRef.current = getIdempotencyKey());
              run(
                "confirmCompletion",
                () => orderConfirmCompletion(orderId, key),
                "order_error_confirm_completion_failed"
              );
            }}
          >
            <button
              type="submit"
              disabled={protocolPaused || busy || guideWalletMismatch}
              title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
              aria-busy={loading === "confirmCompletion" ? true : undefined}
              className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-3 py-1.5 text-white text-small disabled:opacity-50 ${pillFocusClass}`}
            >
              {loading === "confirmCompletion" ? t("common_submitting") : t("escrow_confirmCompletion")}
            </button>
          </form>
        )}
        {showIntentConfirm && escrowAddress && (
          <div className="w-full flex flex-col gap-1.5">
            <IntentSignFacts
              orderId={orderId}
              expectedChainId={expectedChainId}
              escrowAddress={escrowAddress}
              action="confirm_completion"
              variantDid={variantDid}
            />
            <p className={metaClass}>{t("escrow_confirmCompletionSignHint")}</p>
            <form
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                if (protocolPaused) return;
                if (!isConnected) {
                  setIntentWalletDisconnectedTap(true);
                  return;
                }
                setLoading("confirmIntent");
                setErr(null);
                setErrAction(null);
                setIntentOk(null);
                submitConfirmCompletionIntent(orderId, escrowAddress)
                  .then(() => {
                    setIntentOk(t("escrow_intentAccepted"));
                    onSuccess();
                  })
                  .catch((err) => {
                    if (typeof window !== "undefined") {
                      console.error("OrderActionsBlock confirmCompletionIntent:", err);
                    }
                    setErrAction(null);
                    setErr(mapIntentError(err, t));
                  })
                  .finally(() => setLoading(null));
              }}
            >
              <button
                type="submit"
                disabled={protocolPaused || busy || guideWalletMismatch || chainMismatch}
                title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
                aria-busy={loading === "confirmIntent" || isSigning ? true : undefined}
                className={`btn-console rounded-[var(--radius-sm)] bg-travel-600 px-3 py-1.5 text-white text-small disabled:opacity-50 w-fit ${pillFocusClass}`}
              >
                {loading === "confirmIntent" || isSigning
                  ? t("common_submitting")
                  : t("escrow_confirmCompletionSign")}
              </button>
            </form>
            {!isConnected && (
              <p className={metaClass}>{t("escrow_intentConnectWallet")}</p>
            )}
            {isConnected && chainMismatch && (
              <p className="text-meta text-warning">{t("escrow_intentWrongChain")}</p>
            )}
          </div>
        )}
        {canChainOffDispute && (
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              if (protocolPaused) return;
              setLoading("openDispute");
              setErr(null);
              setErrAction(null);
              postOrderDispute(orderId, undefined, getIdempotencyKey())
                .then(() => onSuccess())
                .catch((err) => {
                  if (typeof window !== "undefined") {
                    console.error("OrderActionsBlock openDispute:", err);
                  }
                  setErrAction(null);
                  setErr(mapApiReadError(err, t, "order_error_dispute_failed"));
                })
                .finally(() => setLoading(null));
            }}
          >
            <button
              type="submit"
              disabled={protocolPaused || busy}
              title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
              aria-busy={loading === "openDispute" ? true : undefined}
              className={`btn-console rounded-[var(--radius-sm)] border border-danger px-3 py-1.5 text-danger text-small disabled:opacity-50 ${pillFocusClass}`}
            >
              {loading === "openDispute" ? t("common_submitting") : t("escrow_openDisputeOffchain")}
            </button>
          </form>
        )}
        {canEscrowDisputeIntent && escrowAddress && (
          <div className="w-full flex flex-col gap-1.5 mt-1">
            <IntentSignFacts
              orderId={orderId}
              expectedChainId={expectedChainId}
              escrowAddress={escrowAddress}
              action="open_dispute"
              disputeSummaryOrHash={disputeReasonSummary.trim() || undefined}
              variantDid={variantDid}
            />
            <p className={`${metaClass} max-w-md`}>{t("escrow_openDisputeIntentHint")}</p>
            <label className={`${labelClass} max-w-md`} htmlFor={`dispute-reason-${orderId}`}>
              {t("escrow_disputeReasonLabel")}
            </label>
            <textarea
              id={`dispute-reason-${orderId}`}
              value={disputeReasonSummary}
              onChange={(e) => setDisputeReasonSummary(e.target.value)}
              rows={2}
              className={`w-full max-w-md ${isDid ? escrowProtocolCompactInputClass : "rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small text-ink-800 placeholder:text-ink-400"}`}
              placeholder={t("escrow_disputeReasonPlaceholder")}
              disabled={protocolPaused || busy}
              aria-busy={busy ? true : undefined}
            />
            <p className={`${metaClass} max-w-md`}>{t("escrow_disputeReasonHashHint")}</p>
            <form
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                if (protocolPaused) return;
                if (!isConnected) {
                  setIntentWalletDisconnectedTap(true);
                  return;
                }
                const trimmed = disputeReasonSummary.trim();
                let reasonHash: `0x${string}` | undefined;
                if (trimmed.length > 0) {
                  const conv = escrowDisputeSummaryToReasonHash(trimmed);
                  if (!conv.ok) {
                    setErrAction(null);
                    setErr(t("escrow_disputeReasonTooShort"));
                    return;
                  }
                  reasonHash = conv.hash;
                }
                setLoading("openDisputeIntent");
                setErr(null);
                setErrAction(null);
                setIntentOk(null);
                submitOpenDisputeIntent(orderId, escrowAddress, reasonHash)
                  .then(() => {
                    setIntentOk(t("escrow_intentAccepted"));
                    onSuccess();
                  })
                  .catch((err) => {
                    if (typeof window !== "undefined") {
                      console.error("OrderActionsBlock openDisputeIntent:", err);
                    }
                    setErrAction(null);
                    setErr(mapIntentError(err, t));
                  })
                  .finally(() => setLoading(null));
              }}
            >
              <button
                type="submit"
                disabled={protocolPaused || busy || chainMismatch}
                title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
                aria-busy={loading === "openDisputeIntent" || isSigning ? true : undefined}
                className={`btn-console rounded-[var(--radius-sm)] border border-danger px-3 py-1.5 text-danger text-small disabled:opacity-50 w-fit ${pillFocusClass}`}
              >
                {loading === "openDisputeIntent" || isSigning
                  ? t("common_submitting")
                  : t("escrow_openDisputeIntentSign")}
              </button>
            </form>
            {!isConnected && (
              <p className={metaClass}>{t("escrow_intentConnectWallet")}</p>
            )}
            {isConnected && chainMismatch && (
              <p className="text-meta text-warning">{t("escrow_intentWrongChain")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
