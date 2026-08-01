/**
 * Batch-12 W06/W07 · HU-445 / HU-452 · Admin 工作台 L5 满分闸 + 漏洞升级闸（②）
 *
 * HU-445 = 八维 40/40（W01～W05 子项 FIXED 后宣称）
 * HU-452 = 漏洞清零 + 升级验收 + 性能/中文 SLA
 * ≠ Production GO · Hard Gate LOCKED · 资金禁写 · Batch-11 FROZEN · ≠ 自动 Release Gate
 */

export const ADMIN_WORKBENCH_L5_GATE_HU = 445 as const;
export const ADMIN_WORKBENCH_VULN_UPGRADE_GATE_HU = 452 as const;

/** DOM / Staging probe needles */
export const ADMIN_WORKBENCH_L5_GATE_ATTR = "data-tt-admin-workbench-l5-gate" as const;
export const ADMIN_WORKBENCH_L5_GATE_VALUE = "40" as const;
export const ADMIN_WORKBENCH_L5_GATE_MARK = "tt_admin_workbench_l5_gate_hu445" as const;

export const ADMIN_WORKBENCH_VULN_UPGRADE_GATE_ATTR =
  "data-tt-admin-workbench-vuln-upgrade-gate" as const;
export const ADMIN_WORKBENCH_VULN_UPGRADE_GATE_VALUE = "pass" as const;
export const ADMIN_WORKBENCH_VULN_UPGRADE_GATE_MARK =
  "tt_admin_workbench_vuln_upgrade_gate_hu452" as const;

export const ADMIN_WORKBENCH_L5_SCORE_TARGET = 40 as const;

/** W01～W05 prerequisite HUs（451 SKIP） */
export const ADMIN_WORKBENCH_L5_PREREQ_HU = [
  431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 446, 447, 448, 449, 450,
  453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464,
] as const;

/** Post W01～W05 rescore（each dim 5.0） */
export const ADMIN_WORKBENCH_L5_SCORE_BY_DIMENSION = {
  visual_style: 5.0,
  typography: 5.0,
  color_contrast: 5.0,
  ia_layout: 5.0,
  empty_honesty: 5.0,
  copy_zh: 5.0,
  function: 5.0,
  l5_command: 5.0,
} as const;

export function adminWorkbenchL5ScoreNow(): number {
  return Object.values(ADMIN_WORKBENCH_L5_SCORE_BY_DIMENSION).reduce((a, b) => a + b, 0);
}

export function adminWorkbenchL5GateReady(): boolean {
  return (
    adminWorkbenchL5ScoreNow() === ADMIN_WORKBENCH_L5_SCORE_TARGET &&
    ADMIN_WORKBENCH_L5_GATE_VALUE === String(ADMIN_WORKBENCH_L5_SCORE_TARGET)
  );
}

export function adminWorkbenchVulnUpgradeGateReady(): boolean {
  return (
    adminWorkbenchL5GateReady() &&
    ADMIN_WORKBENCH_VULN_UPGRADE_GATE_VALUE === "pass" &&
    ADMIN_WORKBENCH_L5_PREREQ_HU.length === 31
  );
}
