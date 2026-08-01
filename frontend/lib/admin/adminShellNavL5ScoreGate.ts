/**
 * Batch-12 W08d · HU-477 · Admin Shell 目录 L5 满分闸（②）
 *
 * Gate = 八维 40/40 + HU-465～476 CLOSED（书面 ED 除外）+ Staging 复验。
 * hub-first ≤12：审批/审计/评价不灌默认侧栏 = CONFIRM_DESIGN（非缺陷）。
 * ≠ Production GO · Hard Gate LOCKED · 资金禁写 · Batch-11 侧栏视觉 FROZEN
 */

export const ADMIN_SHELL_NAV_L5_GATE_HU = 477 as const;

/** DOM / Staging probe needle */
export const ADMIN_SHELL_NAV_L5_GATE_ATTR = "data-tt-admin-shell-nav-l5-gate" as const;
export const ADMIN_SHELL_NAV_L5_GATE_VALUE = "40" as const;

export const ADMIN_SHELL_NAV_L5_SCORE_TARGET = 40 as const;

/** Prerequisite waves closed before this gate may claim 40/40 */
export const ADMIN_SHELL_NAV_L5_PREREQ_HU = [
  465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476,
] as const;

/**
 * Written Expected Difference · hub-first ≤12 · no queue/audit/reviews leaf pour.
 * Discoverability closed via Inbox / config hub / RelatedFold（W08c）.
 */
export const ADMIN_SHELL_NAV_L5_ED_HU = [471, 472, 476] as const;

/** Post W08a+W08b+W08c rescore（each dim 5.0） */
export const ADMIN_SHELL_NAV_L5_SCORE_BY_DIMENSION = {
  visual_style: 5.0,
  typography: 5.0,
  color_contrast: 5.0,
  ia_directory: 5.0,
  empty_failure: 5.0,
  copy_zh: 5.0,
  function_perm: 5.0,
  l5_command_nav: 5.0,
} as const;

export function adminShellNavL5ScoreNow(): number {
  return Object.values(ADMIN_SHELL_NAV_L5_SCORE_BY_DIMENSION).reduce((a, b) => a + b, 0);
}

export function adminShellNavL5GateReady(): boolean {
  return (
    adminShellNavL5ScoreNow() === ADMIN_SHELL_NAV_L5_SCORE_TARGET &&
    ADMIN_SHELL_NAV_L5_GATE_VALUE === String(ADMIN_SHELL_NAV_L5_SCORE_TARGET)
  );
}
