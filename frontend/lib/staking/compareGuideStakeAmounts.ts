/** ① 本地：API `guide.stake_amount` 与链上 `stakeOf` 展示对拍（容差 0.01 USDC） */
export function guideStakeAmountsMismatch(
  apiAmount: string | null | undefined,
  chainAmount: string | null | undefined,
): boolean {
  if (apiAmount == null || chainAmount == null) return false;
  const a = apiAmount.trim();
  const c = chainAmount.trim();
  if (a === "" || c === "") return false;
  const apiN = Number.parseFloat(a);
  const chainN = Number.parseFloat(c);
  if (!Number.isFinite(apiN) || !Number.isFinite(chainN)) return false;
  return Math.abs(apiN - chainN) > 0.01;
}
