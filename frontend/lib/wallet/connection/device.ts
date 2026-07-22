/** Detect mobile browser / in-app WebView for WalletConnect deep-link UX. */
export function isMobileWalletClient(userAgent?: string): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "") ??
    "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
}

/** Prefer deep-link first messaging on mobile; QR on desktop. */
export function walletConnectUxMode(userAgent?: string): "deeplink" | "qr" {
  return isMobileWalletClient(userAgent) ? "deeplink" : "qr";
}
