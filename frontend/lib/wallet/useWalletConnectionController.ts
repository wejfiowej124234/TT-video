"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import { getExpectedChainId, getTargetChain } from "@/lib/chainEnv";
import { useViewOnlyAddress } from "@/lib/ViewOnlyAddressContext";
import { getGovernanceExplorerAddressUrl } from "@/lib/governance/governanceBlockExplorer";
import {
  catalogueConnectors,
  connectorBrandKey,
  truncateAddress,
} from "@/lib/wallet/walletConnectorCatalog";
import { classifyConnectError } from "@/lib/wallet/connection/classifyConnectError";
import { deriveWalletPhase } from "@/lib/wallet/connection/deriveWalletPhase";
import { assertWalletCanWrite } from "@/lib/wallet/connection/writeGuard";
import { walletConnectUxMode } from "@/lib/wallet/connection/device";
import {
  consumeWalletInstallPending,
  peekWalletInstallPending,
  shouldReloadAfterInstallReturn,
} from "@/lib/wallet/connection/installRedetect";
import { buildRecommendedBrandRows } from "@/lib/wallet/connection/recommendedBrands";
import {
  TT_WALLET_ACCOUNT_MENU_OPEN_EVENT,
  TT_WALLET_SHEET_OPEN_EVENT,
  type WalletConnectErrorKind,
  type WalletUiPhase,
} from "@/lib/wallet/connection/types";

export type { WalletUiPhase, WalletConnectErrorKind };

/**
 * TravelTrust L5 Wallet Connection Center — React controller (Web).
 * Pure phase / guard / classifier live in `lib/wallet/connection/*` for App reuse.
 */
export function useWalletConnectionController() {
  const { address, isConnected, chainId, connector, status } = useAccount();
  const { connectAsync, connectors, isPending, error: connectHookError } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchPending, error: switchError } = useSwitchChain();
  const { viewOnlyAddress, setViewOnlyAddress } = useViewOnlyAddress();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [errorKind, setErrorKind] = useState<WalletConnectErrorKind>(null);
  const [switchRejected, setSwitchRejected] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [accountChangedPulse, setAccountChangedPulse] = useState(false);
  const prevAddressRef = useRef<string | undefined>(undefined);

  const expectedChainId = getExpectedChainId();
  const targetChain = getTargetChain();
  const wrongNetwork =
    isConnected && typeof chainId === "number" && chainId > 0 && chainId !== expectedChainId;

  const catalog = useMemo(() => catalogueConnectors(connectors), [connectors]);
  const recommendedBrands = useMemo(
    () => buildRecommendedBrandRows(connectors),
    [connectors]
  );
  const wcUxMode = useMemo(() => walletConnectUxMode(), []);

  useEffect(() => {
    if (isConnected && viewOnlyAddress) setViewOnlyAddress(null);
  }, [isConnected, viewOnlyAddress, setViewOnlyAddress]);

  useEffect(() => {
    if (connectHookError) setErrorKind(classifyConnectError(connectHookError));
  }, [connectHookError]);

  /** Multi-account: pulse UI when connected address changes. */
  useEffect(() => {
    const next = address?.toLowerCase();
    const prev = prevAddressRef.current?.toLowerCase();
    if (isConnected && next && prev && next !== prev) {
      setAccountChangedPulse(true);
      const t = window.setTimeout(() => setAccountChangedPulse(false), 2800);
      prevAddressRef.current = address;
      return () => window.clearTimeout(t);
    }
    prevAddressRef.current = address;
    return undefined;
  }, [address, isConnected]);

  /** Connector disconnect / reconnect failures → clear app wallet chrome. */
  useEffect(() => {
    if (!connector) return;
    const onDisconnect = () => {
      setAccountMenuOpen(false);
      setErrorKind("expired");
      setViewOnlyAddress(null);
    };
    const maybeEmitter = connector as {
      emitter?: { on?: (e: string, fn: () => void) => void; off?: (e: string, fn: () => void) => void };
    };
    const emitter = maybeEmitter.emitter;
    if (!emitter?.on || !emitter?.off) return;
    emitter.on("disconnect", onDisconnect);
    return () => emitter.off?.("disconnect", onDisconnect);
  }, [connector, setViewOnlyAddress]);

  /** Hero / App bridge: open sheet or account menu. */
  useEffect(() => {
    const onSheet = () => {
      setErrorKind(null);
      setSwitchRejected(false);
      setAccountMenuOpen(false);
      setSheetOpen(true);
    };
    const onAccount = () => {
      setSheetOpen(false);
      setAccountMenuOpen(true);
    };
    window.addEventListener(TT_WALLET_SHEET_OPEN_EVENT, onSheet);
    window.addEventListener(TT_WALLET_ACCOUNT_MENU_OPEN_EVENT, onAccount);
    return () => {
      window.removeEventListener(TT_WALLET_SHEET_OPEN_EVENT, onSheet);
      window.removeEventListener(TT_WALLET_ACCOUNT_MENU_OPEN_EVENT, onAccount);
    };
  }, []);

  /**
   * Install → return tab: one controlled reload so EIP-6963 / injected providers re-inject.
   * Soft poll cannot see a brand-new extension without navigation.
   */
  useEffect(() => {
    const onVis = () => {
      if (
        !shouldReloadAfterInstallReturn({
          visibilityState: document.visibilityState,
          hadPendingInstall: peekWalletInstallPending() != null,
        })
      ) {
        return;
      }
      consumeWalletInstallPending();
      window.location.reload();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);

  const phase: WalletUiPhase = useMemo(
    () =>
      deriveWalletPhase({
        viewOnlyAddress,
        isConnected,
        isPending,
        accountStatus: status,
        errorKind,
        wrongNetwork,
        sheetOpen,
        accountChangedPulse,
      }),
    [
      viewOnlyAddress,
      isConnected,
      isPending,
      status,
      errorKind,
      wrongNetwork,
      sheetOpen,
      accountChangedPulse,
    ]
  );

  const writeGuard = useMemo(
    () =>
      assertWalletCanWrite({
        isConnected,
        viewOnlyAddress,
        wrongNetwork,
        isPending,
        hasSessionError: errorKind === "expired" || errorKind === "locked",
      }),
    [isConnected, viewOnlyAddress, wrongNetwork, isPending, errorKind]
  );

  const openSheet = useCallback(() => {
    setErrorKind(null);
    setSwitchRejected(false);
    setAccountMenuOpen(false);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const openAccountMenu = useCallback(() => {
    setSheetOpen(false);
    setAccountMenuOpen(true);
  }, []);

  const closeAccountMenu = useCallback(() => setAccountMenuOpen(false), []);

  const connectWith = useCallback(
    async (c: Connector) => {
      setErrorKind(null);
      try {
        await connectAsync({ connector: c });
        setSheetOpen(false);
        setViewOnlyAddress(null);
      } catch (err) {
        setErrorKind(classifyConnectError(err));
      }
    },
    [connectAsync, setViewOnlyAddress]
  );

  const disconnectWallet = useCallback(async () => {
    setErrorKind(null);
    setAccountMenuOpen(false);
    setSheetOpen(false);
    try {
      await disconnectAsync();
    } catch {
      /* ignore */
    }
    setViewOnlyAddress(null);
  }, [disconnectAsync, setViewOnlyAddress]);

  const switchToTargetChain = useCallback(async () => {
    setSwitchRejected(false);
    try {
      await switchChainAsync({ chainId: expectedChainId });
    } catch (err) {
      const kind = classifyConnectError(err);
      if (kind === "rejected") setSwitchRejected(true);
      else setErrorKind(kind);
    }
  }, [switchChainAsync, expectedChainId]);

  const copyAddress = useCallback(async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 1600);
    } catch {
      /* ignore */
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorKind(null);
    setSwitchRejected(false);
  }, []);

  const displayAddress = isConnected && address ? address : viewOnlyAddress;
  const shortAddress = displayAddress ? truncateAddress(displayAddress) : null;
  const explorerUrl =
    displayAddress != null
      ? getGovernanceExplorerAddressUrl(chainId ?? expectedChainId, displayAddress)
      : undefined;

  const walletConnectConfigured = catalog.walletConnect.length > 0;

  return {
    phase,
    sheetOpen,
    accountMenuOpen,
    openSheet,
    closeSheet,
    openAccountMenu,
    closeAccountMenu,
    connectWith,
    disconnectWallet,
    switchToTargetChain,
    copyAddress,
    clearError,
    copyDone,
    errorKind,
    switchRejected,
    isPending,
    isSwitchPending,
    switchError,
    address: displayAddress,
    shortAddress,
    isConnected,
    wrongNetwork,
    viewOnlyAddress,
    setViewOnlyAddress,
    chainId: chainId ?? expectedChainId,
    expectedChainId,
    chainName: targetChain.name,
    connectorName: connector?.name ?? null,
    activeBrandKey: isConnected && connector ? connectorBrandKey(connector) : null,
    explorerUrl,
    catalog,
    recommendedBrands,
    walletConnectConfigured,
    wcUxMode,
    writeGuard,
    accountChangedPulse,
    truncateAddress,
  };
}

export type WalletConnectionController = ReturnType<typeof useWalletConnectionController>;
