/** ① 本地/产品示意：月度奖金池治理币数量（链上查询属 ②③） */
export const DID_RANK_PRIZE_POOL_MONTHLY_AMOUNT = 100_000;

export function formatDidRankPrizePoolAmount(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)));
}

/** `NEXT_PUBLIC_DID_RANK_PRIZE_POOL_AMOUNT` 可覆盖；无则示意默认 */
export function resolveDidRankPrizePoolAmount(): { amount: number; illustrative: boolean } {
  const raw = (process.env.NEXT_PUBLIC_DID_RANK_PRIZE_POOL_AMOUNT ?? "").trim().replace(/,/g, "");
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return { amount: Math.round(n), illustrative: false };
  }
  return { amount: DID_RANK_PRIZE_POOL_MONTHLY_AMOUNT, illustrative: true };
}
