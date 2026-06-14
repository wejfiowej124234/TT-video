/** Governance Params L5 Full Closure · `/governance/params` 协议参数公示全页收口 SSOT（① · UI 冻结） */

export const GOVERNANCE_PARAMS_L5_CLOSURE_SPRINT_ID = "governance-params-l5-full-closure-20260612" as const;

export const GOVERNANCE_PARAMS_PAGE_L5_CLOSURE_PROBE = "governance-params-full-v1" as const;

export const GOVERNANCE_PARAMS_PAGE_L5_UI_FROZEN = true as const;

export const GOVERNANCE_PARAMS_PAGE_L5_FROZEN_MARKER = "governance-params-l5-20260612" as const;

/** 客态主文案（禁止 API/GET/protocol-reference 等开发者词） */
export const GOVERNANCE_PARAMS_L5_LOCALE_KEYS: readonly string[] = [
  "governance_params_l5_kicker",
  "governance_params_title",
  "governance_params_lead",
  "governance_params_doc_notice",
  "governance_params_data_scope_title",
  "governance_params_data_scope_bullet_customer",
  "governance_params_data_scope_bullet_not_wallet",
  "governance_params_section_nav_aria",
  "governance_params_section_nav_diff",
  "governance_params_section_nav_fee",
  "governance_params_section_nav_countries",
  "governance_params_diff_section",
  "governance_params_diff_section_lead",
  "governance_params_diff_col_current",
  "governance_params_diff_col_pending",
  "governance_params_diff_all_match",
  "governance_params_diff_some_mismatch",
  "governance_params_match_customer_ok",
  "governance_params_mismatch_cta_proposals",
  "governance_params_fee_split",
  "governance_params_fee_split_lead",
  "governance_params_fee_split_global_lead",
  "governance_params_phase1_countries",
  "governance_params_phase1_lead",
  "governance_params_retry_load",
  "governance_params_retry_pending",
  "governance_params_page_notice",
  "governance_params_participate_title",
  "governance_params_participate_lead",
  "governance_params_participate_proposals",
  "governance_params_participate_proposals_hint",
  "governance_params_participate_delegate",
  "governance_params_participate_delegate_hint",
  "governance_params_participate_hub",
  "governance_params_participate_hub_hint",
  "governance_params_phase1_checksum_lead",
  "governance_params_checksum_toggle",
  "governance_params_footer_title",
  "governance_params_footer_lead",
  "governance_params_technical_toggle",
  "governance_params_load_error",
  "governance_params_pending_load_error",
  "steward_workbench_subpage_back",
] as const;

export const GOVERNANCE_PARAMS_L5_BANNED_COPY =
  /\bGET\b|\/api\/|protocol-reference|X-Implementation|Runbook|UUID|order_id|developers?/i;

export type GovernanceParamsL5ClosureFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  title: string;
  status: "closed" | "open" | "deferred";
  phase?: "②" | "③";
};

export const GOVERNANCE_PARAMS_L5_CLOSURE_FINDINGS: readonly GovernanceParamsL5ClosureFinding[] = [
  { id: "GP-L5-P0-01", severity: "P0", title: "全页 UI 冻结 + data-tt-ui-frozen", status: "closed" },
  { id: "GP-L5-P0-02", severity: "P0", title: "暖色 cinematic 壳（同源首页/提案）", status: "closed" },
  { id: "GP-L5-P0-03", severity: "P0", title: "pending 公开读 + smoke API 探针", status: "closed" },
  { id: "GP-L5-P1-01", severity: "P1", title: "客态文案润色 + 技术说明折叠", status: "closed" },
  { id: "GP-L5-P1-02", severity: "P1", title: "对拍/主读失败重试 + gate→提案 CTA", status: "closed" },
  { id: "GP-L5-P1-03", severity: "P1", title: "费用拆分可视化条 + 分区锚点导航", status: "closed" },
  { id: "GP-L5-P1-04", severity: "P1", title: "EN 国别/备注本地化 + 表 caption", status: "closed" },
  { id: "GP-L5-P1-05", severity: "P1", title: "steward 回程 + 治理参与卡（替代 funnel rail）", status: "closed" },
  { id: "GP-L5-P1-06", severity: "P1", title: "governanceParamsPageL5FullClosure + smoke + Playwright", status: "closed" },
  { id: "GP-L5-P1-07", severity: "P1", title: "params 专用 notice + checksum 折叠 + API note 入技术区", status: "closed" },
  { id: "GP-L5-P1-08", severity: "P1", title: "sticky 锚点 + percent meter a11y + README/审计/AGENTS", status: "closed" },
  { id: "GP-L5-P2-01", severity: "P2", title: "② 待生效包链上/治理流程真值", status: "deferred", phase: "②" },
  { id: "GP-L5-P2-02", severity: "P2", title: "③ 生产 SSOT / 法务签字", status: "deferred", phase: "③" },
] as const;

export const GOVERNANCE_PARAMS_L5_OPEN_P0 = GOVERNANCE_PARAMS_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);
export const GOVERNANCE_PARAMS_L5_OPEN_P1 = GOVERNANCE_PARAMS_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);
