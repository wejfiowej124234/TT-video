/**
 * Batch-12 HU-440 · 工作台空态三态字典（SSOT）。
 * 加载中 / 暂无统计 / —（未部署）· 禁止 KPI 各写各的语气。
 */

export type AdminHomeEmptyStateKind = "loading" | "empty" | "not_deployed";

/** Staging / contract needle · keep literal (names minify). */
export const TT_ADMIN_HOME_EMPTY_STATE_DICT_MARK = "tt_admin_home_empty_state_dict_hu440";

/** Batch-14 HU-577 · same three-state dict; alias mark for empty-state SSOT align. */
export const TT_ADMIN_EMPTY_STATE_DICT_HU577_MARK = "tt_admin_empty_state_dict_hu577";

/** Canonical locale keys · zh/en must stay aligned (加载中 / 暂无统计 / —). */
export const ADMIN_HOME_EMPTY_STATE_LOADING_KEY = "admin_home_empty_state_loading";
export const ADMIN_HOME_EMPTY_STATE_EMPTY_KEY = "admin_home_empty_state_empty";
export const ADMIN_HOME_EMPTY_STATE_DASH_KEY = "admin_home_empty_state_dash";

export function adminHomeEmptyStateLabelKey(kind: AdminHomeEmptyStateKind): string {
  if (kind === "loading") return ADMIN_HOME_EMPTY_STATE_LOADING_KEY;
  if (kind === "empty") return ADMIN_HOME_EMPTY_STATE_EMPTY_KEY;
  return ADMIN_HOME_EMPTY_STATE_DASH_KEY;
}

export function adminHomeEmptyStateDisplay(
  t: (key: string, vars?: Record<string, string | number>) => string,
  kind: AdminHomeEmptyStateKind,
): string {
  return t(adminHomeEmptyStateLabelKey(kind));
}
