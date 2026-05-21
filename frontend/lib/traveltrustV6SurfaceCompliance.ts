/**
 * v6 用户可见文案合规粗检（① · 主视野无 spec 编号）
 * 真源：治理/help 深链；84/01/53 仅允许在折叠 details 或治理子页。
 */

/** zh 主视野键：Hero → 页脚间用户扫读路径 */
export const TRAVELTRUST_V6_SURFACE_KEYS = [
  "traveltrust_hero_title",
  "traveltrust_tagline",
  "traveltrust_hero_kicker",
  "traveltrust_hero_cta_plan",
  "traveltrust_scroll_hint",
  "traveltrust_pulse_v6_cinematic",
  "traveltrust_liquidity_preview_banner",
  "traveltrust_liquidity_disclaimer",
  "traveltrust_settlement_title",
  "traveltrust_settlement_body",
  "traveltrust_settlement_disclaimer",
  "traveltrust_trust_chip_escrow",
  "traveltrust_trust_chip_governance",
  "traveltrust_trust_chip_compliance",
  "traveltrust_trust_chips_disclaimer",
  "traveltrust_trust_fact_escrow_title",
  "traveltrust_trust_fact_governance_title",
  "traveltrust_trust_fact_protocol_title",
  "traveltrust_trust_fact_disclosure_title",
  "traveltrust_trust_facts_disclaimer",
  "traveltrust_faq_q1",
  "traveltrust_faq_a1",
  "traveltrust_faq_q5",
  "traveltrust_faq_a5",
  "traveltrust_footer_t2",
  "traveltrust_footer_compliance",
  "traveltrust_start_title",
  "traveltrust_start_disclaimer",
  "traveltrust_role_enter_plan",
] as const;

/** @deprecated 使用 TRAVELTRUST_V6_SURFACE_KEYS */
export const TRAVELTRUST_V6_ZH_SURFACE_KEYS = TRAVELTRUST_V6_SURFACE_KEYS;

export const TRAVELTRUST_V6_ZH_BANNED_FRAGMENTS = [
  "escrow",
  "ico",
  "faq",
  "v6 ",
  "3d",
  "allowlist",
  "gov",
  "swap gateway",
] as const;

/** 用户可见面禁止出现的对内 spec 编号片段 */
export const TRAVELTRUST_V6_ZH_SPEC_BANNED_FRAGMENTS = ["84", "01/53", "82–84", "82-84", "runbook"] as const;

/** en 主视野禁止混入中文（品牌拉丁名除外） */
export const TRAVELTRUST_V6_EN_CJK_RE = /[\u4e00-\u9fff]/;

export const TRAVELTRUST_V6_EN_BANNED_FRAGMENTS = [
  "定制游",
  "托管",
  "治理",
  "示意",
] as const;
