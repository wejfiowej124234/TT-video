/**
 * Batch-12 HU-463 · 页可见时软刷新（60～90s 节流 · 非硬轮询）。
 */

export const TT_ADMIN_HOME_SOFT_REVALIDATE_MARK = "tt_admin_home_soft_revalidate_hu463";

/** Soft revalidate TTL while tab visible (ms). */
export const ADMIN_HOME_SOFT_REVALIDATE_TTL_MS = 75_000;

/**
 * Pure helper · whether a visibility→visible event should soft-reload.
 * @param lastFetchAtMs last successful/attempted load timestamp
 * @param nowMs clock
 * @param ttlMs throttle window
 */
export function adminHomeSoftRevalidateShouldReload(
  lastFetchAtMs: number | null,
  nowMs: number,
  ttlMs: number = ADMIN_HOME_SOFT_REVALIDATE_TTL_MS,
): boolean {
  if (lastFetchAtMs == null) return true;
  return nowMs - lastFetchAtMs >= ttlMs;
}
