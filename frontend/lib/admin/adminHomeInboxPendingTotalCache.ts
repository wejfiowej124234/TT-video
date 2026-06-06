/** ① 工作台收件箱合计 · session 缓存（硬刷新时避免非聚焦 → 聚焦布局闪动）。 */

const STORAGE_KEY = "tt-admin-home-inbox-pending-total-v1";

export function readAdminHomeInboxPendingTotalCache(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  } catch {
    return null;
  }
}

export function writeAdminHomeInboxPendingTotalCache(total: number): void {
  if (typeof window === "undefined") return;
  try {
    if (!Number.isFinite(total) || total < 0) return;
    sessionStorage.setItem(STORAGE_KEY, String(Math.floor(total)));
  } catch {
    // quota / private mode — ignore
  }
}
