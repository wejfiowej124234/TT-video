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

/** Step3 P0 debug · 最近一次 submit 原始 Error.message（① local E2E 诊断） */
export const GUIDE_REGISTER_LAST_SUBMIT_ERR_KEY = "traveltrust_guide_register_step3_last_err_v1";

export function readGuideRegisterLastSubmitError(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GUIDE_REGISTER_LAST_SUBMIT_ERR_KEY);
    return raw?.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function writeGuideRegisterLastSubmitError(message: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GUIDE_REGISTER_LAST_SUBMIT_ERR_KEY, message);
  } catch {
    /* ignore */
  }
}

export function clearGuideRegisterLastSubmitError(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GUIDE_REGISTER_LAST_SUBMIT_ERR_KEY);
  } catch {
    /* ignore */
  }
}
