export const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded";

export type UserShape = {
  id?: string;
  email?: string;
  role?: string;
  /** 87 协议侧展示用（与 `role` 双读；`tourist`→`traveler` 等由 API 归一） */
  role_traveltrust?: string;
  /** Phase 5 / 07：KYC 预留（链下审核对接前仅展示状态） */
  kyc_status?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  default_wallet_address?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

/** 格式化 ISO 时间为本地日期 */
export function formatJoinedAt(iso: string | undefined, dash: string): string {
  if (!iso) return dash;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dash;
  }
}
