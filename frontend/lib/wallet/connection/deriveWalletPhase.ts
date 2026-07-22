import type { WalletConnectErrorKind, WalletUiPhase } from "@/lib/wallet/connection/types";

export type DeriveWalletPhaseInput = {
  viewOnlyAddress: string | null;
  isConnected: boolean;
  isPending: boolean;
  accountStatus: string;
  errorKind: WalletConnectErrorKind;
  wrongNetwork: boolean;
  sheetOpen: boolean;
  accountChangedPulse: boolean;
};

/**
 * Deterministic UI phase machine for L5 Wallet Connection Center.
 * Error phases win over sheetOpen so users always see connect failures.
 */
export function deriveWalletPhase(input: DeriveWalletPhaseInput): WalletUiPhase {
  const {
    viewOnlyAddress,
    isConnected,
    isPending,
    accountStatus,
    errorKind,
    wrongNetwork,
    sheetOpen,
    accountChangedPulse,
  } = input;

  if (viewOnlyAddress && !isConnected) return "viewOnly";
  if (isPending || accountStatus === "connecting" || accountStatus === "reconnecting") {
    return "connecting";
  }
  if (errorKind === "rejected") return "rejected";
  if (errorKind === "locked") return "locked";
  if (errorKind === "expired") return "expired";
  if (errorKind === "unavailable") return "unavailable";
  if (isConnected && accountChangedPulse) return "accountChanged";
  if (isConnected && wrongNetwork) return "wrongNetwork";
  if (isConnected) return "connected";
  if (sheetOpen) return "sheetOpen";
  return "disconnected";
}
