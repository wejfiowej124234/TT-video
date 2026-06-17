/** Steward Workbench L5 Full Closure · `/governance?view=region` 主理人工作台全页收口 SSOT（① · UI 冻结） */

export const STEWARD_WORKBENCH_L5_CLOSURE_SPRINT_ID = "steward-workbench-l5-full-closure-20260612" as const;

export const STEWARD_WORKBENCH_PAGE_L5_CLOSURE_PROBE = "steward-workbench-full-v1" as const;

export const STEWARD_WORKBENCH_PAGE_L5_UI_FROZEN = true as const;

export const STEWARD_WORKBENCH_PAGE_L5_FROZEN_MARKER = "steward-workbench-l5-20260612" as const;

/** protocol-ssot CN · 400 bps of 10M supply · 非 wei */
export const STEWARD_CN_PROTOCOL_MIN_STAKE_TTG = 400_000 as const;

export const STEWARD_WORKBENCH_L5_LOCALE_KEYS: readonly string[] = [
  "steward_workbench_eyebrow",
  "steward_workbench_title",
  "steward_workbench_subtitle",
  "steward_workbench_subtitle_gate",
  "steward_workbench_staking_gate_title_need_onboarding",
  "steward_workbench_staking_gate_body_need_onboarding",
  "steward_workbench_staking_gate_title_need_stake",
  "steward_workbench_staking_gate_body_need_stake",
  "steward_workbench_staking_gate_cta_stake_section",
  "steward_workbench_staking_view_section_cta",
  "steward_workbench_staking_satisfied_summary",
  "steward_workbench_governance_locked_suffix",
  "steward_workbench_todo_title",
  "steward_workbench_todo_subtitle",
  "steward_workbench_todo_create_proposal",
  "steward_workbench_todo_proposals",
  "steward_workbench_todo_delegate",
  "steward_workbench_todo_claim",
  "steward_workbench_todo_counts_note",
  "steward_workbench_todo_counts_loading",
  "steward_workbench_subpage_back",
  "steward_workbench_governance_combined_subtitle",
  "steward_workbench_crossNav_aria",
  "steward_workbench_load_fail",
  "steward_workbench_not_steward",
  "steward_workbench_cta_register",
  "stewardStake_minAmount",
  "stewardStake_walletMismatch",
] as const;

export const STEWARD_WORKBENCH_L5_BANNED_COPY =
  /托管|运营审核|API\s*同源|\bAPI\b|服务端|UUID|order_id|Runbook|cold start|Campaign|developers?/i;

export type StewardWorkbenchL5ClosureFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  title: string;
  status: "closed" | "open" | "deferred";
  phase?: "②" | "③";
};

export const STEWARD_WORKBENCH_L5_CLOSURE_FINDINGS: readonly StewardWorkbenchL5ClosureFinding[] = [
  { id: "SW-L5-P0-01", severity: "P0", title: "全页 UI 冻结 + data-tt-ui-frozen", status: "closed" },
  { id: "SW-L5-P0-02", severity: "P0", title: "专用 smoke-steward-workbench-l5-local.sh", status: "closed" },
  { id: "SW-L5-P0-03", severity: "P0", title: "CN 最低质押与 protocol-ssot 对拍（400,000 TTG · 400 bps）", status: "closed" },
  { id: "SW-L5-P1-01", severity: "P1", title: "IA 对齐 PWB/GWB（门闸→待办→质押→观测→底栏）", status: "closed" },
  { id: "SW-L5-P1-02", severity: "P1", title: "need_stake 单 CTA + 治理观测门闸 + 去重", status: "closed" },
  { id: "SW-L5-P1-03", severity: "P1", title: "stewardWorkbenchWorkspaceL5 + contract 绿集", status: "closed" },
  { id: "SW-L5-P1-04", severity: "P1", title: "settings 无重复质押面板 · legacy stake redirect", status: "closed" },
  { id: "SW-L5-P1-05", severity: "P1", title: "① API 诚实待办计数（proposals/delegate/claim）", status: "closed" },
  { id: "SW-L5-P1-06", severity: "P1", title: "need_stake 紧凑质押区 + settings 顶栏瘦身", status: "closed" },
  { id: "SW-L5-P1-07", severity: "P1", title: "治理子页 from=steward_workbench 回工作台链", status: "closed" },
  { id: "SW-L5-P1-08", severity: "P1", title: "Playwright steward-workbench-full-l5.spec.ts", status: "closed" },
  { id: "SW-L5-P1-09", severity: "P1", title: "工作台直达发起治理提案 CTA（→ /proposals/new?from=steward_workbench）", status: "closed" },
  { id: "SW-L5-P2-01", severity: "P2", title: "② Governor/Claim 链读强一致待办计数", status: "deferred", phase: "②" },
  { id: "SW-L5-P2-02", severity: "P2", title: "② Sepolia stake / Governor / Claim 闭环", status: "deferred", phase: "②" },
  { id: "SW-L5-P2-03", severity: "P2", title: "治理子页亮壳 vs 工作台暗壳统一", status: "deferred", phase: "②" },
  { id: "SW-L5-P2-04", severity: "P2", title: "③ 生产 SSOT / 法务签字", status: "deferred", phase: "③" },
] as const;

export const STEWARD_WORKBENCH_L5_OPEN_P0 = STEWARD_WORKBENCH_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);
export const STEWARD_WORKBENCH_L5_OPEN_P1 = STEWARD_WORKBENCH_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);
