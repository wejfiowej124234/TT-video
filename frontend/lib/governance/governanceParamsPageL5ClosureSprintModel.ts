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
  "governance_params_lead_short",
  "governance_params_overview_quick_read_title",
  "governance_params_overview_quick_read_lead",
  "governance_params_overview_fund_rails_aria",
  "governance_params_overview_fund_rail_funding_title",
  "governance_params_overview_fund_rail_funding_body",
  "governance_params_overview_fund_rail_revenue_title",
  "governance_params_overview_fund_rail_revenue_body",
  "governance_params_overview_steps_aria",
  "governance_params_overview_steps_kicker",
  "governance_params_overview_steps_title",
  "governance_params_glance_step1_body",
  "governance_params_status_mirror_badge",
  "governance_params_web3_runtime_kicker",
  "governance_params_web3_runtime_body",
  "governance_params_web3_runtime_nav_aria",
  "governance_params_web3_runtime_vacancy_link",
  "governance_params_web3_runtime_hub_link",
  "governance_params_web3_runtime_fee_routes_link",
  "governance_params_allocation_panel_revenue_title",
  "governance_params_allocation_panel_revenue_lead",
  "governance_params_allocation_panel_token_title",
  "governance_params_allocation_panel_token_lead",
  "governance_params_treasury_block_kicker",
  "governance_params_treasury_section_short_title",
  "governance_params_treasury_lead_short",
  "governance_params_treasury_flow_body_short",
  "governance_params_treasury_priorities_kicker",
  "governance_params_treasury_priorities_heading_short",
  "governance_params_treasury_priorities_lead",
  "governance_params_treasury_scope_note_short",
  "governance_params_treasury_policy_kicker",
  "governance_params_treasury_policy_title_short",
  "governance_params_treasury_policy_lead_short",
  "governance_params_treasury_policy_cap_body_short",
  "governance_params_treasury_policy_options_heading_short",
  "governance_params_treasury_policy_options_lead",
  "governance_params_treasury_policy_public_rounds_heading_short",
  "governance_params_treasury_policy_public_rounds_lead_short",
  "governance_params_treasury_policy_seat_exit_note_short",
  "governance_params_treasury_policy_scope_note_short",
  "governance_params_tokenomics_freeze_kicker",
  "governance_params_tokenomics_freeze_title_short",
  "governance_params_tokenomics_freeze_lead_short",
  "governance_params_tokenomics_freeze_scope_note_short",
  "governance_params_ttg_supply_kicker",
  "governance_params_ttg_supply_section_title_short",
  "governance_params_ttg_supply_lead_short",
  "governance_params_ttg_global_usage_kicker",
  "governance_params_ttg_global_usage_section_title_short",
  "governance_params_ttg_global_usage_lead_short",
  "governance_params_ttg_global_usage_notice_short",
  "governance_params_phase1_countries_short",
  "governance_params_phase1_lead_short",
  "governance_params_phase1_jurisdiction_summary",
  "governance_params_phase1_fundraise_planning_toggle",
  "governance_params_phase1_fundraise_planning_lead",
  "governance_params_phase1_fundraise_planning_footnote",
  "governance_params_valuation_anchor_note_short",
  "governance_params_technical_appendix_lead_short",
  "governance_params_doc_notice_short",
  "governance_params_fee_split_lead_short",
  "governance_params_fee_split_technical_note",
  "governance_params_diff_section_short",
  "governance_params_diff_section_lead_short",
  "governance_params_diff_pending_mirror_note",

  "governance_params_overview_foundation_title",

  "governance_params_overview_foundation_lead",

  "governance_params_dual_track_summary",

  "governance_params_dual_track_disclaimer",

  "governance_params_page_notice",

  "governance_params_data_scope_title",

  "governance_params_glance_step1_label",
  "governance_params_glance_step1_kicker",
  "governance_params_glance_step2_label",
  "governance_params_glance_step2_kicker",
  "governance_params_glance_step2_value",
  "governance_params_glance_step3_label",
  "governance_params_glance_step3_kicker",
  "governance_params_glance_step3_value",

  "governance_params_dimension_b_formula",

  "governance_params_profit_flow_aria",

  "governance_params_profit_flow_step0_label",

  "governance_params_profit_flow_step0_title",

  "governance_params_profit_flow_step0_body",

  "governance_params_profit_flow_step1_label",

  "governance_params_profit_flow_step1_title",

  "governance_params_profit_flow_step2_label",

  "governance_params_profit_flow_step2_title",

  "governance_params_allocation_detail_title",

  "governance_params_allocation_detail_lead",

  "governance_params_treasury_section_title",

  "governance_params_treasury_lead",
  "governance_params_treasury_example_heading",
  "governance_params_treasury_example_net",
  "governance_params_treasury_example_steward",
  "governance_params_treasury_example_treasury",
  "governance_params_treasury_flow_kicker",
  "governance_params_treasury_flow_title",
  "governance_params_treasury_flow_body",
  "governance_params_treasury_priorities_heading",
  "governance_params_treasury_priority_label",
  "governance_params_treasury_priority_ops",
  "governance_params_treasury_priority_ops_hint",
  "governance_params_treasury_priority_security",
  "governance_params_treasury_priority_security_hint",
  "governance_params_treasury_priority_ecosystem",
  "governance_params_treasury_priority_ecosystem_hint",
  "governance_params_treasury_priority_remainder",
  "governance_params_treasury_priority_remainder_hint",
  "governance_params_treasury_scope_note",
  "governance_params_treasury_policy_lead",
  "governance_params_treasury_policy_cap_heading",
  "governance_params_treasury_policy_cap_body",
  "governance_params_treasury_policy_options_heading",
  "governance_params_treasury_policy_option_buyback",
  "governance_params_treasury_policy_option_buyback_hint",
  "governance_params_treasury_policy_option_burn",
  "governance_params_treasury_policy_option_burn_hint",
  "governance_params_treasury_policy_option_holder_rewards",
  "governance_params_treasury_policy_option_holder_rewards_hint",
  "governance_params_treasury_policy_option_ecosystem",
  "governance_params_treasury_policy_option_ecosystem_hint",
  "governance_params_treasury_policy_option_country_pool",
  "governance_params_treasury_policy_option_country_pool_hint",
  "governance_params_treasury_policy_public_rounds_heading",
  "governance_params_treasury_policy_public_rounds_lead",
  "governance_params_treasury_policy_public_rounds_caption",
  "governance_params_treasury_policy_col_round",
  "governance_params_treasury_policy_col_ttg",
  "governance_params_treasury_policy_col_of_supply",
  "governance_params_treasury_policy_col_of_public",
  "governance_params_treasury_policy_round_round_1_early",
  "governance_params_treasury_policy_round_round_2",
  "governance_params_treasury_policy_round_round_3",
  "governance_params_treasury_policy_public_total_row",
  "governance_params_treasury_policy_seat_exit_note",
  "governance_params_treasury_policy_scope_note",
  "governance_params_tokenomics_freeze_section_title",
  "governance_params_tokenomics_freeze_lead",
  "governance_params_tokenomics_freeze_id_note",
  "governance_params_tokenomics_freeze_table_caption",
  "governance_params_tokenomics_freeze_col_rule",
  "governance_params_tokenomics_freeze_col_title",
  "governance_params_tokenomics_freeze_col_value",
  "governance_params_tokenomics_freeze_GOV_01_title",
  "governance_params_tokenomics_freeze_GOV_01_value",
  "governance_params_tokenomics_freeze_GOV_02_title",
  "governance_params_tokenomics_freeze_GOV_02_value",
  "governance_params_tokenomics_freeze_GOV_03_title",
  "governance_params_tokenomics_freeze_GOV_03_value",
  "governance_params_tokenomics_freeze_GOV_04_title",
  "governance_params_tokenomics_freeze_GOV_04_value",
  "governance_params_tokenomics_freeze_scope_note",
  "governance_params_ttg_holder_disclaimer",
  "governance_params_ttg_supply_section_title",
  "governance_params_ttg_supply_lead",
  "governance_params_ttg_supply_col_category",
  "governance_params_ttg_supply_col_share",
  "governance_params_ttg_supply_community_incentive",
  "governance_params_ttg_supply_public",
  "governance_params_ttg_supply_team",
  "governance_params_ttg_supply_treasury_dao",
  // Legacy removed-bucket labels retained for i18n key stability (not rendered in supply table)
  "governance_params_ttg_supply_country_pool",
  "governance_params_ttg_supply_ecosystem",
  "governance_params_ttg_supply_advisors",
  "governance_params_ttg_supply_total_row",
  "governance_params_ttg_supply_table_caption",
  "governance_params_ttg_supply_notice",

  "governance_params_ttg_global_usage_section_title",

  "governance_params_ttg_global_usage_scope",
  "governance_params_ttg_global_usage_layer_note",
  "governance_params_ttg_global_usage_details_toggle",

  "governance_params_ttg_global_usage_operations",

  "governance_params_ttg_global_usage_operations_hint",

  "governance_params_ttg_global_usage_airdrop",

  "governance_params_ttg_global_usage_airdrop_hint",

  "governance_params_ttg_global_usage_reserve",

  "governance_params_ttg_global_usage_reserve_hint",

  "governance_params_ttg_global_usage_notice",

  "governance_params_ttg_global_usage_table_caption",
  "governance_params_ttg_global_usage_col_purpose",
  "governance_params_ttg_global_usage_col_share",
  "governance_params_ttg_global_usage_col_note",
  "governance_params_ttg_global_usage_total_row",
  "governance_params_ttg_global_usage_total_hint",

  "governance_params_steward_context_title",

  "governance_params_steward_context_lead",

  "governance_params_steward_context_jump_overview",

  "governance_params_steward_context_jump_global_pool",

  "governance_params_steward_context_jump_countries",

  "governance_params_doc_notice",

  "governance_params_section_nav_aria",

  "governance_params_section_nav_overview",

  "governance_params_section_nav_allocation",

  "governance_params_section_nav_countries",

  "governance_params_technical_appendix_toggle",

  "governance_params_technical_appendix_lead",

  "governance_params_fee_routing_not_product_model",

  "governance_params_fee_routing_technical_kicker",

  "governance_params_fee_routing_technical_title",

  "governance_params_fee_routing_technical_lead",

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

  "governance_params_phase1_countries",

  "governance_params_phase1_lead",
  "governance_params_mirror_fallback_note",
  "governance_params_mirror_source_tag",
  "governance_params_phase1_web3_callout",
  "governance_params_phase1_table_bridge",
  "governance_params_phase1_legend_title",

  "governance_params_phase1_legend_compact",

  "governance_params_col_country",

  "governance_params_col_tier",

  "governance_params_layer1_country",

  "governance_params_layer1_global",

  "governance_params_phase1_fundraise_total_row_label",

  "governance_params_phase1_fundraise_total_row_hint",

  "governance_params_valuation_anchor_note",

  "governance_params_phase1_independent_toggle",

  "governance_params_phase1_independent_fundraise",

  "governance_params_phase1_independent_stake",

  "governance_params_phase1_independent_formula_deprecated_note",

  "governance_params_col_steward_stake_bps_short",

  "governance_params_col_steward_stake_bps_hint",

  "governance_params_col_steward_stake_ttg_short",

  "governance_params_col_steward_stake_ttg_hint",

  "governance_params_phase1_protocol_table_title",

  "governance_params_phase1_fundraise_table_title",

  "governance_params_col_target_wan",

  "governance_params_col_notes",

  "governance_params_retry_load",

  "governance_params_retry_pending",

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

  "governance_params_body_incomplete",

  "governance_params_data_scope_bullet_api",

  "governance_params_data_scope_bullet_not_sigma",

  "governance_params_data_scope_bullet_not_pool",

  "governance_params_diff_source_hint",

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

  { id: "GP-L5-P1-09", severity: "P1", title: "Treasury 治理/发行区块 + 清除 pro-rata 僵尸组件", status: "closed" },

  { id: "GP-L5-P2-01", severity: "P2", title: "② 待生效包链上/治理流程真值", status: "deferred", phase: "②" },

  { id: "GP-L5-P2-02", severity: "P2", title: "③ 生产 SSOT / 法务签字", status: "deferred", phase: "③" },

] as const;



export const GOVERNANCE_PARAMS_L5_OPEN_P0 = GOVERNANCE_PARAMS_L5_CLOSURE_FINDINGS.filter(

  (f) => f.severity === "P0" && f.status === "open",

);

export const GOVERNANCE_PARAMS_L5_OPEN_P1 = GOVERNANCE_PARAMS_L5_CLOSURE_FINDINGS.filter(

  (f) => f.severity === "P1" && f.status === "open",

);


