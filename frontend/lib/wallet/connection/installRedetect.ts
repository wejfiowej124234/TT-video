/**
 * After user opens an official wallet install page, reclaim focus and re-detect providers.
 * New browser extensions usually inject only on hard navigation — one controlled reload
 * after return is the enterprise-standard path (not continuous polling).
 */

export const TT_WALLET_AWAIT_INSTALL_KEY = "tt_wallet_await_install";

export function markWalletInstallPending(brandKey?: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(TT_WALLET_AWAIT_INSTALL_KEY, brandKey?.trim() || "1");
}

export function peekWalletInstallPending(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TT_WALLET_AWAIT_INSTALL_KEY);
}

export function consumeWalletInstallPending(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const v = sessionStorage.getItem(TT_WALLET_AWAIT_INSTALL_KEY);
  if (!v) return null;
  sessionStorage.removeItem(TT_WALLET_AWAIT_INSTALL_KEY);
  return v;
}

/** True when tab becomes visible again after an install hop. */
export function shouldReloadAfterInstallReturn(input: {
  visibilityState: DocumentVisibilityState;
  hadPendingInstall: boolean;
}): boolean {
  return input.visibilityState === "visible" && input.hadPendingInstall;
}
