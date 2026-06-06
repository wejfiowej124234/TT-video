/**
 * 52/53：仅有行程总价、尚无按日分项时的「均摊至每日」可读估算（与 itin_dayCostEvenSplitHint 同读）。
 */

export function resolveEvenSplitPerDay(
  totalBudget: number | string | null | undefined,
  dayCount: number,
): number | null {
  if (dayCount <= 1) return null;
  const raw =
    typeof totalBudget === "number"
      ? totalBudget
      : totalBudget != null && String(totalBudget).trim() !== ""
        ? Number(totalBudget)
        : NaN;
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return raw / dayCount;
}

export function formatEvenSplitAmount(v: number): string {
  const n = Math.round(v * 100) / 100;
  return n.toFixed(2);
}
