import type { WalletWriteGuard } from "@/lib/wallet/connection/types";

export type WriteGuardInput = {
  isConnected: boolean;
  viewOnlyAddress: string | null;
  wrongNetwork: boolean;
  isPending?: boolean;
  hasSessionError?: boolean;
};

/**
 * Chain / write guard — shared by Web contract calls and future App SDK.
 * View-only and wrong-network must never reach wallet writes.
 */
export function assertWalletCanWrite(input: WriteGuardInput): WalletWriteGuard {
  if (input.viewOnlyAddress && !input.isConnected) {
    return { canWrite: false, reason: "view_only" };
  }
  if (!input.isConnected) {
    return { canWrite: false, reason: "not_connected" };
  }
  if (input.isPending) {
    return { canWrite: false, reason: "connecting" };
  }
  if (input.hasSessionError) {
    return { canWrite: false, reason: "session_error" };
  }
  if (input.wrongNetwork) {
    return { canWrite: false, reason: "wrong_network" };
  }
  return { canWrite: true, reason: null };
}
