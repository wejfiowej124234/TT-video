"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { getAddress, isAddress } from "viem";

import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import TxMachineStatus from "@/components/escrow/TxMachineStatus";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useEscrowFactoryCreate } from "@/dapp/hooks/useEscrowFactoryCreate";
import { getGuide, getIdempotencyKey, postOrderSetEscrowAddress } from "@/lib/apiClient";
import { buildEscrowCreateParams, type BuildEscrowParamsErrorCode } from "@/lib/buildEscrowCreateParams";
import { getArbitratorAddress } from "@/lib/arbitratorEnv";
import { getDisputeWindowSeconds } from "@/lib/disputeWindowEnv";
import { escrowAddressFromFactoryReceipt } from "@/lib/parseEscrowCreatedLog";
import { getSettlementTokenAddress } from "@/lib/settlementTokenEnv";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  marketCyanPillControlFocusClasses,
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

import FeeRouterWiringNotice from "../FeeRouterWiringNotice";
import type { ItineraryBlock, OrderRow } from "./types";

function buildErrKey(code: BuildEscrowParamsErrorCode): string {
  switch (code) {
    case "invalid_order_id":
      return "escrow_factoryBuildErr_orderId";
    case "missing_snapshot":
      return "escrow_factoryBuildErr_snapshot";
    case "invalid_snapshot":
      return "escrow_factoryBuildErr_snapshotHex";
    case "missing_order_amount":
      return "escrow_factoryBuildErr_amount";
    case "missing_traveler":
    case "missing_guide":
      return "escrow_factoryBuildErr_participants";
    case "missing_token":
      return "escrow_factoryBuildErr_token";
    case "missing_arbitrator":
      return "escrow_factoryBuildErr_arbitrator";
    default:
      return "escrow_factoryCreateErrGeneric";
  }
}

const FACTORY_WRITE_ERROR_OPTS = {
  revertPatterns: [] as { re: RegExp; messageKey: string }[],
  rejectKey: "escrow_txErrorUserRejected",
  allowanceKey: "escrow_allowanceHint",
  genericKey: "escrow_factoryCreateTxFailed",
} as const;

export interface CreateOnChainEscrowBlockProps {
  order: OrderRow;
  itinerary: ItineraryBlock | null;
  snapshotHash: string | null;
  meUserId?: string;
  meDefaultWallet?: string | null;
  connectedAddress?: string;
  isConnected: boolean;
  chainId: number;
  expectedChainId: number;
  chainMismatch: boolean;
  refreshOrder: () => void;
  panelClassName?: string;
  /** 与订单协议区 30-DID 一致时，工厂签名弹层使用深色玻璃态 */
  variantDid?: boolean;
  /** B-067 */
  protocolPaused?: boolean;
}

export default function CreateOnChainEscrowBlock({
  order,
  itinerary,
  snapshotHash,
  meUserId,
  meDefaultWallet,
  connectedAddress,
  isConnected,
  chainId,
  expectedChainId,
  chainMismatch,
  refreshOrder,
  panelClassName = "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-6 space-y-3",
  variantDid,
  protocolPaused = false,
}: CreateOnChainEscrowBlockProps) {
  const { t } = useTranslation();
  const factoryModalTitleId = useId();
  const factoryModalDescId = useId();
  const factoryModalDetailsId = useId();
  const factoryModalNoteId = useId();
  const [guideWallet, setGuideWallet] = useState<string | null>(null);
  const [guideLoadErr, setGuideLoadErr] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);
  const [syncOk, setSyncOk] = useState(false);
  const [walletDisconnectedTap, setWalletDisconnectedTap] = useState(false);
  const syncedRef = useRef(false);

  const token = getSettlementTokenAddress();
  const arbitrator = getArbitratorAddress();
  const disputeWindowSeconds = getDisputeWindowSeconds();

  const { factory, createEscrow, hash, receipt, isPending, isSuccess, error, reset } =
    useEscrowFactoryCreate();

  const trapRef = useFocusTrap(modalOpen, () => setModalOpen(false));

  useEffect(() => {
    if (isConnected) setWalletDisconnectedTap(false);
  }, [isConnected]);

  useEffect(() => {
    const gid = order.guide_id;
    if (!gid) {
      setGuideWallet(null);
      return;
    }
    let cancelled = false;
    setGuideLoadErr(false);
    getGuide(String(gid))
      .then((g) => {
        if (cancelled) return;
        const w = (g as { wallet_address?: string | null })?.wallet_address;
        setGuideWallet(typeof w === "string" && isAddress(w) ? getAddress(w) : null);
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CreateOnChainEscrowBlock getGuide:", err);
          }
          setGuideLoadErr(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [order.guide_id]);

  useEffect(() => {
    if (!isSuccess || !receipt || !factory || syncedRef.current) return;
    const escrowAddr = escrowAddressFromFactoryReceipt(receipt, factory);
    if (!escrowAddr) {
      setSyncErr(t("escrow_factoryCreateParseFailed"));
      return;
    }
    syncedRef.current = true;
    void postOrderSetEscrowAddress(String(order.id), escrowAddr, getIdempotencyKey())
      .then(() => {
        setSyncOk(true);
        refreshOrder();
      })
      .catch((err) => {
        syncedRef.current = false;
        if (typeof window !== "undefined") {
          console.error("CreateOnChainEscrowBlock postOrderSetEscrowAddress:", err);
        }
        setSyncErr(mapApiReadError(err, t, "escrow_factoryCreateSyncFailed"));
      });
  }, [isSuccess, receipt, factory, order.id, refreshOrder, t]);

  const isTourist = meUserId != null && String(order.tourist_id ?? "") === String(meUserId);
  const walletMismatch =
    meDefaultWallet &&
    connectedAddress &&
    isAddress(meDefaultWallet) &&
    getAddress(meDefaultWallet) !== getAddress(connectedAddress);

  const travelerAddr =
    connectedAddress && isAddress(connectedAddress) ? getAddress(connectedAddress) : null;
  const guideAddr =
    guideWallet && isAddress(guideWallet) ? getAddress(guideWallet) : null;

  const built =
    snapshotHash && travelerAddr && guideAddr && token && arbitrator
      ? buildEscrowCreateParams({
          order,
          itinerary,
          snapshotHash,
          traveler: travelerAddr,
          guide: guideAddr,
          token,
          arbitrator,
          chainId: BigInt(expectedChainId),
          disputeWindowSeconds,
        })
      : null;

  const configBlocked =
    !token || !arbitrator || !factory || guideLoadErr || !guideAddr || !snapshotHash;

  const disabledReason = !isTourist
    ? t("escrow_factoryCreateOnlyTourist")
    : protocolPaused
      ? t("escrow_protocolPause_title")
      : !isConnected
        ? t("escrow_intentConnectWallet")
        : chainMismatch
          ? t("escrow_wrongChain")
          : walletMismatch
            ? t("escrow_factoryCreateWalletMismatch")
            : configBlocked
              ? t("escrow_factoryCreateNeedConfig")
              : built && !built.ok
                ? t(buildErrKey(built.code))
                : null;

  const factoryCtaDisabled = isPending || protocolPaused || (isConnected ? Boolean(disabledReason) : false);

  const openModal = useCallback(() => {
    if (protocolPaused) return;
    setSubmitErr(null);
    setSyncErr(null);
    setSyncOk(false);
    syncedRef.current = false;
    reset();
    setModalOpen(true);
  }, [protocolPaused, reset]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    if (!isPending && !isSuccess) {
      reset();
      syncedRef.current = false;
    }
  }, [isPending, isSuccess, reset]);

  const onConfirmSign = useCallback(async () => {
    if (protocolPaused) return;
    if (chainMismatch) return;
    if (!built || !built.ok || !travelerAddr || !guideAddr || !token || !arbitrator) return;
    setSubmitErr(null);
    try {
      await createEscrow(built.params);
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("CreateOnChainEscrowBlock createEscrow:", e);
      }
      const wrapped = e instanceof Error ? e : new Error(String(e));
      setSubmitErr(
        mapWalletWriteError(wrapped, t, FACTORY_WRITE_ERROR_OPTS) ?? t("escrow_factoryCreateTxFailed")
      );
    }
  }, [protocolPaused, chainMismatch, built, createEscrow, travelerAddr, guideAddr, token, arbitrator]);

  const handleFactoryModalErrorRetry = useCallback(() => {
    if (syncErr) {
      setSyncErr(null);
      if (!receipt || !factory) return;
      const escrowAddr = escrowAddressFromFactoryReceipt(receipt, factory);
      if (!escrowAddr) {
        setSyncErr(t("escrow_factoryCreateParseFailed"));
        return;
      }
      void postOrderSetEscrowAddress(String(order.id), escrowAddr, getIdempotencyKey())
        .then(() => {
          setSyncOk(true);
          syncedRef.current = true;
          refreshOrder();
        })
        .catch((err) => {
          syncedRef.current = false;
          if (typeof window !== "undefined") {
            console.error("CreateOnChainEscrowBlock postOrderSetEscrowAddress retry:", err);
          }
          setSyncErr(mapApiReadError(err, t, "escrow_factoryCreateSyncFailed"));
        });
      return;
    }
    setSubmitErr(null);
    reset();
  }, [syncErr, receipt, factory, order.id, refreshOrder, t, reset]);

  if (!isTourist) return null;

  const hookErrDisplay = error
    ? mapWalletWriteError(error as Error, t, FACTORY_WRITE_ERROR_OPTS) ?? t("escrow_factoryCreateTxFailed")
    : null;
  const txFailed = !!error || !!submitErr;
  const showFailed = txFailed || !!syncErr;
  const showSuccess = isSuccess && syncOk && !syncErr;
  const factoryModalErrorMessage = syncErr ?? submitErr ?? hookErrDisplay;

  const isDid = !!variantDid;
  const factoryModalCtaFocusClass = isDid
    ? marketCyanPillControlFocusClasses
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const modalPanelClass = isDid
    ? "w-full max-w-md rounded-[var(--radius-xl)] border border-cyan-500/30 bg-slate-900/95 backdrop-blur-md p-6 shadow-scifi-modal-inner space-y-4"
    : "w-full max-w-md rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-strong space-y-4";
  const modalTitleClass = isDid ? "text-body-l font-semibold text-cyan-200" : "text-body-l font-semibold text-ink-900";
  const modalDescClass = isDid ? "text-small text-slate-300 leading-relaxed" : "text-small text-ink-600";
  const modalUlClass = isDid
    ? "text-small space-y-1 font-mono bg-slate-800/70 border border-slate-600/40 p-3 rounded-[var(--radius-sm)] text-slate-200"
    : "text-small space-y-1 font-mono bg-bg-soft p-3 rounded-[var(--radius-sm)]";
  const modalLabelClass = isDid ? "text-slate-300" : "text-ink-500";
  const modalNoteClass = isDid ? "text-meta text-warning/95" : "text-meta text-warning";
  const modalCancelClass = isDid
    ? `btn-console rounded-[var(--radius-sm)] border border-slate-500/60 px-4 py-2 text-slate-200 hover:bg-slate-800/60 ${factoryModalCtaFocusClass}`
    : `btn-console rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-700 ${factoryModalCtaFocusClass}`;

  return (
    <div className={panelClassName}>
      <FeeRouterWiringNotice />
      <h3 className="text-body font-semibold text-cyan-200">{t("escrow_factoryCreateTitle")}</h3>
      <p className="text-small text-slate-300 leading-relaxed">{t("escrow_factoryCreateDesc")}</p>
      {protocolPaused ? (
        <p className="text-small text-amber-200/95 leading-relaxed" role="status">
          {t("escrow_protocolPause_body")}
        </p>
      ) : null}
      {disabledReason && (
        <p className={isDid ? "text-small text-warning/95" : "text-small text-warning"} role="status">
          {disabledReason}
        </p>
      )}
      {walletDisconnectedTap && (
        <p className={isDid ? "text-small text-warning/95" : "text-small text-warning"} role="alert">
          {t("escrow_connectWalletUseHeader")}
        </p>
      )}
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          if (protocolPaused) return;
          if (!isConnected) {
            setWalletDisconnectedTap(true);
            return;
          }
          openModal();
        }}
      >
        <button
          type="submit"
          disabled={factoryCtaDisabled}
          aria-busy={isPending ? true : undefined}
          className={`px-4 py-2 text-small font-medium rounded-[var(--radius-md)] bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${factoryModalCtaFocusClass}`}
        >
          {isPending ? t("escrow_confirming") : t("escrow_factoryCreateCta")}
        </button>
      </form>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby={factoryModalTitleId}
          aria-describedby={`${factoryModalDescId} ${factoryModalDetailsId} ${factoryModalNoteId}`}
        >
          <div ref={trapRef} className={modalPanelClass}>
            <h3 id={factoryModalTitleId} className={modalTitleClass}>
              {t("escrow_factoryCreateModalTitle")}
            </h3>
            <p id={factoryModalDescId} className={modalDescClass}>
              {t("escrow_signConfirmDesc")}
            </p>
            <ul id={factoryModalDetailsId} className={modalUlClass}>
              <li>
                <span className={modalLabelClass}>{t("escrow_chainId")}</span>
                {chainId}
              </li>
              <li>
                <span className={modalLabelClass}>{t("escrow_contract")}</span>
                {factory ?? t("ui_em_dash")}
              </li>
              <li>
                <span className={modalLabelClass}>{t("escrow_function")}</span>
                createEscrow(EscrowParams)
              </li>
              <li>
                <span className={modalLabelClass}>{t("escrow_amount")}</span>
                {order.amount} {order.currency}
              </li>
              <li>
                <span className={modalLabelClass}>{t("escrow_travelerParam")}</span>
                {travelerAddr ?? t("ui_em_dash")}
              </li>
              <li>
                <span className={modalLabelClass}>{t("escrow_guideParam")}</span>
                {guideAddr ?? t("ui_em_dash")}
              </li>
              {snapshotHash && (
                <li>
                  <span className={modalLabelClass}>{t("escrow_snapshotHashLabel")}</span>
                  <span className="break-all">{snapshotHash}</span>
                </li>
              )}
              <li>
                <span className={modalLabelClass}>{t("escrow_gas")}</span>
                {t("escrow_gasFromWallet")}
              </li>
              <li>
                <span className={modalLabelClass}>{t("escrow_finalityN")}</span>
                {t("escrow_finalityBlocks")}
              </li>
            </ul>
            <TxMachineStatus
              pending={isPending}
              success={showSuccess}
              failed={showFailed}
              variantDid={variantDid}
              signing={modalOpen && !isPending && !showSuccess && !showFailed}
            />
            {factoryModalErrorMessage ? (
              <div className="space-y-2">
                <ApiErrorAlert
                  message={factoryModalErrorMessage}
                  tone={isDid ? "dark" : "default"}
                />
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void handleFactoryModalErrorRetry();
                  }}
                >
                  <button
                    type="submit"
                    aria-label={t("common_retry")}
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium disabled:opacity-50 ${factoryModalCtaFocusClass} ${
                      isDid
                        ? "border-slate-500/60 bg-slate-800/70 text-slate-200 hover:bg-slate-800"
                        : "border-ink-300 bg-white text-ink-800 hover:bg-ink-50"
                    }`}
                  >
                    {t("common_retry")}
                  </button>
                </form>
              </div>
            ) : null}
            {showSuccess && (
              <p className="text-meta text-success" role="status">
                {t("escrow_factoryCreateSynced")}
              </p>
            )}
            <p id={factoryModalNoteId} className={modalNoteClass} role="note">
              {t("escrow_doNotResubmit")}
            </p>
            <div className="flex gap-3 justify-end">
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  closeModal();
                }}
              >
                <button type="submit" className={modalCancelClass}>
                  {showSuccess || showFailed ? t("escrow_close") : t("common_cancel")}
                </button>
              </form>
              {!showSuccess && !showFailed && (
                <form
                  className="contents"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void onConfirmSign();
                  }}
                >
                  <button
                    type="submit"
                    disabled={protocolPaused || isPending || !built?.ok || chainMismatch}
                    aria-busy={isPending ? true : undefined}
                    className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small disabled:opacity-50 ${factoryModalCtaFocusClass}`}
                  >
                    {isPending ? t("escrow_confirming") : t("escrow_confirmAndSign")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
