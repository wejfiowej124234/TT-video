"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { TT_MARKETING_FOCUS_RING_CONSOLE } from "@/lib/marketingUi";
import { getAddress, isAddress } from "viem";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useEscrowFactoryCreate } from "@/dapp/hooks/useEscrowFactoryCreate";
import { getGuide, getIdempotencyKey, postOrderSetEscrowAddress } from "@/lib/apiClient";
import { buildEscrowCreateParams } from "@/lib/buildEscrowCreateParams";
import { getArbitratorAddress } from "@/lib/arbitratorEnv";
import { getDisputeWindowSeconds } from "@/lib/disputeWindowEnv";
import { escrowAddressFromFactoryReceipt } from "@/lib/parseEscrowCreatedLog";
import { getSettlementTokenAddress } from "@/lib/settlementTokenEnv";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  marketCyanPillControlFocusClasses,
} from "@/lib/travelLinkFocus";
import {
  buildErrKey,
  FACTORY_WRITE_ERROR_OPTS,
  type CreateOnChainEscrowBlockProps,
} from "./createOnChainEscrowBlockModel";

export function useCreateOnChainEscrowBlock({
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
  panelClassName = "rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-900/70 backdrop-blur-md p-6 space-y-3",
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

  const { factory, createEscrow, receipt, isPending, isSuccess, error, reset } = useEscrowFactoryCreate();

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
  const guideAddr = guideWallet && isAddress(guideWallet) ? getAddress(guideWallet) : null;

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
        mapWalletWriteError(wrapped, t, FACTORY_WRITE_ERROR_OPTS) ?? t("escrow_factoryCreateTxFailed"),
      );
    }
  }, [protocolPaused, chainMismatch, built, createEscrow, travelerAddr, guideAddr, token, arbitrator, t]);

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
    : `${TT_MARKETING_FOCUS_RING_CONSOLE}`;

  return {
    t,
    panelClassName,
    variantDid,
    protocolPaused,
    isTourist,
    disabledReason,
    walletDisconnectedTap,
    setWalletDisconnectedTap,
    factoryCtaDisabled,
    isPending,
    isConnected,
    factoryModalCtaFocusClass,
    openModal,
    modalOpen,
    trapRef,
    factoryModalTitleId,
    factoryModalDescId,
    factoryModalDetailsId,
    factoryModalNoteId,
    chainId,
    factory,
    order,
    travelerAddr,
    guideAddr,
    snapshotHash,
    showSuccess,
    showFailed,
    factoryModalErrorMessage,
    builtOk: Boolean(built?.ok),
    chainMismatch,
    handleFactoryModalErrorRetry,
    closeModal,
    onConfirmSign,
  };
}
