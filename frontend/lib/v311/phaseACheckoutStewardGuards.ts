/**
 * V3.1.1 Phase A · Frontend Gap FE-01/02/03 · Scope Freeze SSOT helpers
 * Does NOT change five-main route structure/visuals.
 */
export const V311_PLATFORM_ACCESS_FEE_USDC = 300_000;

export type CheckoutLineItems = {
  principalUsdc: number;
  platformServiceFeeUsdc: number;
  estimatedGasEth?: number | null;
};

/** FE-01 · checkout must surface principal + platform service fee (+ optional gas) */
export function checkoutShowsPrincipalFeeGas(items: CheckoutLineItems): boolean {
  return (
    Number.isFinite(items.principalUsdc) &&
    items.principalUsdc > 0 &&
    Number.isFinite(items.platformServiceFeeUsdc) &&
    items.platformServiceFeeUsdc >= 0
  );
}

export type StewardApplyFees = {
  stakeMinimumTtg: number;
  accessFeeUsdc: number;
};

/** FE-02 · steward apply must show stake minimum + access fee */
export function stewardApplyShowsStakeAndAccessFee(fees: StewardApplyFees): boolean {
  return (
    fees.stakeMinimumTtg > 0 &&
    fees.accessFeeUsdc === V311_PLATFORM_ACCESS_FEE_USDC
  );
}

/** FE-03 · Phase-1 forbids multi-country split on one order */
export function forbidMulticountryPhase1Split(destinationCountries: string[]): boolean {
  const uniq = new Set(
    destinationCountries.map((c) => c.trim().toUpperCase()).filter(Boolean)
  );
  return uniq.size <= 1;
}
