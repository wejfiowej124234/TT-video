/**
 * B-066：争议裁决后资金拆分示意，与 `GET /api/v1/disputes/:id` 的 `refund_ratio` / `slash_guide` 对齐（链下裁决 SSOT）。
 */

const POST_DISPUTE_RESOLUTION_STATES = new Set(["refunded", "partially_refunded", "slashed"]);

export function orderStateTriggersDisputeFundSplit(state: string | undefined): boolean {
  if (!state) return false;
  return POST_DISPUTE_RESOLUTION_STATES.has(String(state).trim().toLowerCase());
}

/**
 * `refund_ratio`：退给旅行者比例 [0,1]；`slash_guide`：向导侧罚没时向导应收为 0，剩余（除旅行者已退）记为平台/池示意。
 */
export function computeDisputeResolutionFundSplit(
  orderAmount: number,
  refundRatio: number,
  slashGuide: boolean,
): { tourist: number; guide: number; platformPool: number } {
  if (!Number.isFinite(orderAmount) || orderAmount < 0) {
    return { tourist: 0, guide: 0, platformPool: 0 };
  }
  const r = Math.min(1, Math.max(0, Number.isFinite(refundRatio) ? refundRatio : 0));
  const tourist = Math.round(orderAmount * r * 1e6) / 1e6;
  const afterTourist = Math.round((orderAmount - tourist) * 1e6) / 1e6;
  if (slashGuide) {
    return { tourist, guide: 0, platformPool: Math.max(0, afterTourist) };
  }
  return { tourist, guide: Math.max(0, afterTourist), platformPool: 0 };
}

export function formatSplitAmount(n: number, currency: string): string {
  if (!Number.isFinite(n)) return "—";
  const cur = currency.trim();
  const s = n.toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 0 });
  return cur ? `${s} ${cur}` : s;
}
