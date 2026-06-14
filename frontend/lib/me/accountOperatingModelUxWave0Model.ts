/**
 * Account Operating Model · ① Wave 0 企业 UX 优化（满分 SSOT）
 * 互指：`evidence/GO_local_auth_l5/ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md`
 */
import { PUBLISH_HUB_IA_BOUNDARY_PUBLISH_PATH } from "@/lib/me/publishHubIaBoundaryFreezeModel";

export const ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE = 100 as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE0_ACTIVE = true as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE0_FROZEN_AT = "2026-06-13" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE0_MARKER = "account-operating-model-ux-wave0-20260613" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE_DOC =
  "evidence/GO_local_auth_l5/ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md" as const;

/** W0-1 · 边界 copy 模板 · 五轨 + 订单 + 页级 */
export const ACCOUNT_UX_BOUNDARY_COPY_I18N_KEYS: readonly string[] = [
  "publish_hub_subtitle",
  "publish_hub_operating_context",
  "publish_hub_rail_trip_subtitle",
  "publish_hub_rail_merchant_subtitle",
  "publish_hub_rail_acquisition_subtitle",
  "publish_hub_rail_governance_subtitle",
  "publish_hub_rail_guide_subtitle",
  "orders_list_publish_hub_boundary",
  "orders_list_open_publish_hub",
  "me_settings_desc_publish_hub",
] as const;

/** zh 边界句必含语义锚（机读 contract 对拍） */
export const ACCOUNT_UX_BOUNDARY_ZH_ANCHORS: readonly { key: string; mustContain: readonly string[] }[] = [
  { key: "publish_hub_rail_trip_subtitle", mustContain: ["我的订单"] },
  { key: "publish_hub_rail_merchant_subtitle", mustContain: ["listing", "我的订单"] },
  { key: "publish_hub_rail_acquisition_subtitle", mustContain: ["listing", "我的订单"] },
  { key: "publish_hub_rail_governance_subtitle", mustContain: ["治理"] },
  { key: "orders_list_publish_hub_boundary", mustContain: ["发布中心"] },
] as const;

/** W0-2 · 设置 Hub 工作台捷径降级为二级入口 */
export const ME_SETTINGS_WORKBENCH_SHORTCUT_ITEM_IDS = [
  "guide_hub",
  "merchant_hub",
  "steward_hub",
  "acquisition_hub",
] as const;

export const ME_SETTINGS_WORKBENCH_SECONDARY_DESC_KEYS: readonly string[] = [
  "me_settings_desc_guide",
  "me_settings_desc_merchant",
  "me_settings_desc_steward",
  "me_settings_desc_acquisition",
] as const;

export const ME_SETTINGS_TRAVEL_SECTION_HINT_KEY = "me_settings_section_travel_hint" as const;

/** W0-3 · Hub P2-3 blocked_reason 三行 */
export const ME_IDENTITIES_HUB_P2_3_PROBE_ATTRS = [
  "data-tt-me-identities-card-blocked",
  "data-tt-me-identities-blocked-lines",
] as const;

/** W0-4 · 单槽默认筛选提示 */
export const PUBLISH_HUB_SINGLE_IDENTITY_FILTER_HINT_KEY = "publish_hub_single_identity_filter_hint" as const;

export const PUBLISH_HUB_SINGLE_IDENTITY_FILTER_DATA_ATTR = "data-tt-publish-hub-single-identity-filter" as const;

export const ACCOUNT_OPERATING_MODEL_THREE_PORTALS = {
  publish: PUBLISH_HUB_IA_BOUNDARY_PUBLISH_PATH,
  orders: "/orders",
  identities: "/me/identities",
  settings: "/me/settings",
} as const;

export type AccountOperatingModelWave0Finding = {
  id: string;
  title: string;
  status: "closed" | "deferred";
  phase?: "②" | "③";
};

export const ACCOUNT_OPERATING_MODEL_UX_WAVE0_FINDINGS: readonly AccountOperatingModelWave0Finding[] = [
  { id: "W0-1", title: "边界 copy 模板 zh/en 统一 + 机读锚点", status: "closed" },
  { id: "W0-2", title: "设置 Hub 工作台捷径降级 · 多重身份为主 SSOT", status: "closed" },
  { id: "W0-3", title: "Hub 卡 blocked_reason 三行 P2-3", status: "closed" },
  { id: "W0-4", title: "单 operator 槽默认筛选 + 用户可见提示", status: "closed" },
  { id: "W1-1", title: "顶栏 Active Workspace Switcher 全量", status: "deferred", phase: "②" },
  { id: "W1-2", title: "GET /me/publish-summary api 真源 staging 对拍", status: "deferred", phase: "②" },
  { id: "W2-1", title: "设置旅行组移除工作台捷径（仅保留 Hub）", status: "deferred", phase: "②" },
];
