/**
 * TravelTrust Wallet Connection Center — shared types (Web + future App).
 * Connect / identify / switch-chain / request signatures only.
 * Never: create wallet, custody keys, mnemonics, proxy-sign.
 */

export type WalletUiPhase =
  | "disconnected"
  | "sheetOpen"
  | "connecting"
  | "connected"
  | "wrongNetwork"
  | "viewOnly"
  | "rejected"
  | "locked"
  | "unavailable"
  | "expired"
  | "accountChanged";

export type WalletConnectErrorKind =
  | "rejected"
  | "locked"
  | "unavailable"
  | "expired"
  | "generic"
  | null;

export type WalletWriteDenyReason =
  | "not_connected"
  | "view_only"
  | "wrong_network"
  | "connecting"
  | "session_error";

export type WalletWriteGuard = {
  canWrite: boolean;
  reason: WalletWriteDenyReason | null;
};

/** Public capability statement (product + security). */
export const TT_WALLET_CONNECTION_CAPABILITY = {
  connects: true,
  identifies: true,
  switchesChain: true,
  requestsSignatures: true,
  createsWallet: false,
  custodiesKeys: false,
  storesMnemonics: false,
  importsKeystore: false,
  embeddedWallet: false,
  socialLoginWallet: false,
  proxySigns: false,
} as const;

export const TT_WALLET_SHEET_OPEN_EVENT = "tt:wallet-sheet-open";
export const TT_WALLET_ACCOUNT_MENU_OPEN_EVENT = "tt:wallet-account-menu-open";
