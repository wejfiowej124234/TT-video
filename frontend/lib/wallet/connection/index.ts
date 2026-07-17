/**
 * TravelTrust L5 Wallet Connection Center — shared package surface (Web + future App).
 *
 * @see frontend/evidence/GO_local_wallet_connection_l5/README.md
 */

export {
  TT_WALLET_CONNECTION_CAPABILITY,
  TT_WALLET_SHEET_OPEN_EVENT,
  TT_WALLET_ACCOUNT_MENU_OPEN_EVENT,
  type WalletUiPhase,
  type WalletConnectErrorKind,
  type WalletWriteDenyReason,
  type WalletWriteGuard,
} from "@/lib/wallet/connection/types";

export { classifyConnectError } from "@/lib/wallet/connection/classifyConnectError";
export { deriveWalletPhase, type DeriveWalletPhaseInput } from "@/lib/wallet/connection/deriveWalletPhase";
export { assertWalletCanWrite, type WriteGuardInput } from "@/lib/wallet/connection/writeGuard";
export { isMobileWalletClient, walletConnectUxMode } from "@/lib/wallet/connection/device";
export {
  createTravelTrustWagmiConnectors,
  readWalletConnectProjectIdFromEnv,
  type TravelTrustWagmiConnectorOptions,
} from "@/lib/wallet/connection/createTravelTrustWagmiConnectors";
export {
  requestOpenWalletSheet,
  requestOpenWalletAccountMenu,
} from "@/lib/wallet/connection/requestWalletUi";
