import {
  TT_WALLET_ACCOUNT_MENU_OPEN_EVENT,
  TT_WALLET_SHEET_OPEN_EVENT,
} from "@/lib/wallet/connection/types";

/** Cross-surface entry (Hero, App bridge, deep links) → open L5 Wallet Sheet. */
export function requestOpenWalletSheet(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TT_WALLET_SHEET_OPEN_EVENT));
}

export function requestOpenWalletAccountMenu(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TT_WALLET_ACCOUNT_MENU_OPEN_EVENT));
}
