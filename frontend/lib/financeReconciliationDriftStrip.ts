/**
 * Epic E-06：枢纽页 drift 摘要（不调用 API；仅纯函数）。
 * chain_alignment_status：API 无同义字段时由 drift_detected 推导固定枚举。
 */

export type ChainAlignmentHubStatus = "aligned" | "not_aligned" | "unknown";

export function deriveChainAlignmentStatus(driftDetected: boolean | undefined): ChainAlignmentHubStatus {
  if (driftDetected === true) return "not_aligned";
  if (driftDetected === false) return "aligned";
  return "unknown";
}

/** `delta` 单行摘要：不展开数组项、不做对账运算。 */
export function summarizeDeltaForHub(delta: unknown, dataUnavailableLabel: string): string {
  if (delta === undefined) return dataUnavailableLabel;
  if (Array.isArray(delta)) return `delta.length=${delta.length}`;
  if (delta !== null && typeof delta === "object") {
    const keys = Object.keys(delta as Record<string, unknown>);
    return `delta.object keys=${keys.length}`;
  }
  if (typeof delta === "boolean") return String(delta);
  if (typeof delta === "number" && Number.isFinite(delta)) return String(delta);
  if (typeof delta === "string") {
    const t = delta.trim();
    if (t === "") return dataUnavailableLabel;
    return t.length > 120 ? `${t.slice(0, 120)}…` : t;
  }
  return dataUnavailableLabel;
}
