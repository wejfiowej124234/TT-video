import { getAddress, isAddress } from "viem";

/** B 轨准入费结算币（与 Escrow / 身份质押 USDC 叙事一致；**≠** 可赎回身份质押）。 */
export const ONBOARDING_B_TRACK_CURRENCY = "USDC" as const;

/** 官方收款地址（`OnboardingFeeReceiver` 合约或国库 EOA）；与 API `ONBOARDING_FEE_RECEIVER_ADDRESS` 对拍。 */
export function getOnboardingFeeReceiverAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_ONBOARDING_FEE_RECEIVER_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return getAddress(raw);
}

/** USDC ERC-20 合约地址（链上 transfer 用）。 */
export function getOnboardingUsdcTokenAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return getAddress(raw);
}

export function onboardingFeeUsdcPaymentConfigured(): boolean {
  return getOnboardingFeeReceiverAddress() != null && getOnboardingUsdcTokenAddress() != null;
}

/** `amount_minor`（2 位小数标价，如 29900 = 299.00 USDC）→ 链上 atomic（默认 6 decimals）。 */
export function onboardingFeeMinorToUsdcAtomic(amountMinor: number, decimals = 6): bigint {
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) return 0n;
  const scale = 10 ** Math.max(0, decimals - 2);
  return BigInt(Math.round(amountMinor)) * BigInt(scale);
}
