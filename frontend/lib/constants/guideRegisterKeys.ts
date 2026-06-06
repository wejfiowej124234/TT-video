/** 向导申请页 session 键（① 本地） */
export const GUIDE_REGISTER_WALLET_VERIFIED_KEY = "traveltrust_guide_register_wallet_verified_v1";

export function readGuideWalletVerifiedAddress(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GUIDE_REGISTER_WALLET_VERIFIED_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { address?: string };
    return typeof data.address === "string" && data.address.trim() ? data.address.trim() : null;
  } catch {
    return null;
  }
}

export function writeGuideWalletVerifiedAddress(address: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    GUIDE_REGISTER_WALLET_VERIFIED_KEY,
    JSON.stringify({ address: address.trim(), at: Date.now() }),
  );
}

export function clearGuideWalletVerifiedAddress(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GUIDE_REGISTER_WALLET_VERIFIED_KEY);
}
