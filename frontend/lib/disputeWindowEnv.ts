/** 链上 `disputeWindowSeconds`；默认 7 天，与后端 P3 常见窗口对齐。 */
export function getDisputeWindowSeconds(): number {
  if (typeof process === "undefined") return 604_800;
  const raw = process.env.NEXT_PUBLIC_DISPUTE_WINDOW_SECONDS?.trim();
  if (!raw) return 604_800;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 365 * 86_400) return 604_800;
  return Math.floor(n);
}
