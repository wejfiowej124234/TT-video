/** Governance Proposals L5 Closure · `/governance/proposals*` SSOT（① · 行业钱包 L5 · 主理人发议题走廊） */

export const GOVERNANCE_PROPOSALS_L5_CLOSURE_SPRINT_ID = "governance-proposals-l5-wallet-industry-20260613" as const;

export const GOVERNANCE_PROPOSALS_L5_CLOSURE_PROBE = "governance-proposals-full-v1" as const;

export const GOVERNANCE_PROPOSALS_L5_FROZEN_MARKER = "governance-proposals-l5-20260613" as const;

export const GOVERNANCE_PROPOSALS_L5_UI_FROZEN = true as const;

/** 钱包 L5 关键 i18n（contract / 双语对拍） */
export const GOVERNANCE_PROPOSALS_L5_LOCALE_KEYS: readonly string[] = [
  "governance_create_simulate_warn",
  "governance_create_timelock_single_action_warn",
  "governance_tx_view_explorer",
  "governance_switch_network_cta",
  "governance_timelock_operation_id",
  "governance_cancel_section_heading",
  "governance_cancel_cta",
  "governance_voting_power_onchain_snapshot",
] as const;

export type GovernanceProposalsL5ClosureFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  title: string;
  status: "closed" | "open" | "deferred";
  phase?: "②" | "③";
};

export const GOVERNANCE_PROPOSALS_L5_CLOSURE_FINDINGS: readonly GovernanceProposalsL5ClosureFinding[] = [
  { id: "GP-L5-P0-01", severity: "P0", title: "列表/创建/详情 L5 壳 + GOV_PROPOSALS_L5 token", status: "closed" },
  { id: "GP-L5-P0-02", severity: "P0", title: "创建向导 + 钱包 propose（useGovernancePropose）", status: "closed" },
  { id: "GP-L5-P0-03", severity: "P0", title: "Governor 索引时禁止链下假票", status: "closed" },
  { id: "GP-L5-P0-04", severity: "P0", title: "页内 Connect + chainId 硬闸（写链前）", status: "closed" },
  { id: "GP-L5-P0-05", severity: "P0", title: "getPastVotes 门槛对拍（非 MVP total_weight_units）", status: "closed" },
  { id: "GP-L5-P0-06", severity: "P0", title: "全路由 UI 冻结 + data-tt-ui-frozen", status: "closed" },
  { id: "GP-L5-P1-01", severity: "P1", title: "主理人工作台直达发起议题 CTA", status: "closed" },
  { id: "GP-L5-P1-02", severity: "P1", title: "from=steward_workbench 回程链（list/create/detail）", status: "closed" },
  { id: "GP-L5-P1-03", severity: "P1", title: "Playwright governance-proposal-create-l5.spec.ts", status: "closed" },
  { id: "GP-L5-P1-04", severity: "P1", title: "contract 绿集 + governance-matrix-local-gate", status: "closed" },
  { id: "GP-L5-P1-05", severity: "P1", title: "Timelock queue/execute 钱包写 UI（GovernanceProposalExecutionActionsPanel）", status: "closed" },
  { id: "GP-L5-P1-06", severity: "P1", title: "多 action propose UI（Governor 数组）", status: "closed" },
  { id: "GP-L5-P1-07", severity: "P1", title: "simulateContract gas 预检 + steward 钱包 mismatch", status: "closed" },
  { id: "GP-L5-P1-08", severity: "P1", title: "governanceProposalsL5FullClosure + Playwright full + AGENTS", status: "closed" },
  { id: "GP-AUD-P0-01", severity: "P0", title: "模板选择自动生成 target+calldata（非手填 hex）", status: "closed" },
  { id: "GP-AUD-P0-02", severity: "P0", title: "useSwitchChain 一键切链（GovernanceChainMismatchActions）", status: "closed" },
  { id: "GP-AUD-P0-03", severity: "P0", title: "simulate 失败硬阻断 vs RPC 不可用 warn 降级", status: "closed" },
  { id: "GP-AUD-P1-01", severity: "P1", title: "propose/vote/timelock tx 区块浏览器链接", status: "closed" },
  { id: "GP-AUD-P1-02", severity: "P1", title: "Timelock operationId 展示 + getProposalActions 读", status: "closed" },
  { id: "GP-AUD-P1-03", severity: "P1", title: "提案人 cancel 钱包写（GovernanceProposalCancelPanel）", status: "closed" },
  { id: "GP-AUD-P1-04", severity: "P1", title: "详情页链上 Governor 隐藏 MVP total_weight_units", status: "closed" },
  { id: "GP-AUD-P1-05", severity: "P1", title: "GovSingleOpOnly 单 action 警告 + queue 守卫", status: "closed" },
  { id: "GP-AUD-P1-06", severity: "P1", title: "Playwright 5 步向导 + 钱包面板 data-tt", status: "closed" },
  { id: "GP-AUD-P1-07", severity: "P1", title: "移除 ExecutionActionsSkeleton 死代码", status: "closed" },
  { id: "GP-L5-P2-01", severity: "P2", title: "Sepolia propose/vote/Timelock 全链验收", status: "deferred", phase: "②" },
  { id: "GP-L5-P2-02", severity: "P2", title: "③ Production Governor 运维 + 法务签字", status: "deferred", phase: "③" },
] as const;

/** ① 企业级审计 · 治理议题生命周期（OZ/Tally/Safe 对标）· 仅 ① 可闭项 */
export const GOVERNANCE_PROPOSALS_L5_ENTERPRISE_AUDIT_SCORE_PHASE1 = 100 as const;

export const GOVERNANCE_PROPOSALS_L5_OPEN_P0 = GOVERNANCE_PROPOSALS_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);

export const GOVERNANCE_PROPOSALS_L5_OPEN_P1 = GOVERNANCE_PROPOSALS_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);
