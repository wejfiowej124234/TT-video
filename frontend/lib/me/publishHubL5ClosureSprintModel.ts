/** 发布中心 L5 Full Closure · `/me/publish` ① ACTIVE 收口 SSOT */

export const PUBLISH_HUB_L5_CLOSURE_SPRINT_ID = "publish-hub-l5-full-closure-20260612" as const;

export const PUBLISH_HUB_PAGE_L5_CLOSURE_PROBE = "publish-hub-full-v1" as const;

export const PUBLISH_HUB_PAGE_L5_UI_FROZEN = true as const;

export const PUBLISH_HUB_PAGE_L5_FROZEN_MARKER = "publish-hub-l5-20260612" as const;

export const PUBLISH_HUB_L5_LOCALE_KEYS: readonly string[] = [
  "publish_hub_meta_title",
  "publish_hub_meta_description",
  "publish_hub_eyebrow",
  "publish_hub_title",
  "publish_hub_subtitle",
  "publish_hub_loading_aria",
  "publish_hub_error_aria",
  "publish_hub_error_title",
  "publish_hub_error_body",
  "publish_hub_login_required",
  "publish_hub_filter_aria",
  "publish_hub_filter_all",
  "publish_hub_filter_trip",
  "publish_hub_filter_guide",
  "publish_hub_filter_merchant",
  "publish_hub_filter_acquisition",
  "publish_hub_filter_governance",
  "publish_hub_item_cover_alt",
  "publish_hub_cross_nav_aria",
  "header_userMenu_publish_hub",
  "common_retry",
  "common_loading",
  "header_login",
] as const;

export const PUBLISH_HUB_L5_BANNED_COPY = /\bGET\b|\/api\/|UUID|order_id|developers?/i;

export type PublishHubL5ClosureFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  title: string;
  status: "closed" | "open" | "deferred";
  phase?: "②" | "③";
};

/** ① L5 审计发现 · 截图复审 2026-06-12 */
export const PUBLISH_HUB_L5_CLOSURE_FINDINGS: readonly PublishHubL5ClosureFinding[] = [
  { id: "PH-L5-P0-01", severity: "P0", title: "五轨功能 MVP + data-tt-publish-hub-ui-frozen", status: "closed" },
  { id: "PH-L5-P0-02", severity: "P0", title: "统一 PublishHubItemCard 横向卡片", status: "closed" },
  { id: "PH-L5-P0-03", severity: "P0", title: "「全部」智能隐藏空轨（非五轨全堆）", status: "closed" },
  { id: "PH-L5-P1-01", severity: "P1", title: "筛选 tablist 键盘 Arrow + tabIndex", status: "closed" },
  { id: "PH-L5-P1-02", severity: "P1", title: "卡片 CTA min-h 44px + article aria-labelledby", status: "closed" },
  { id: "PH-L5-P1-03", severity: "P1", title: "loading/error 段级态 Auth L5 同族", status: "closed" },
  {
    id: "PH-L5-P1-04",
    severity: "P1",
    title: "社区 post 深链 ?post= 在 /community/me/posts（非发布中心轨）",
    status: "closed",
  },
  { id: "PH-L5-P1-05", severity: "P1", title: "publishHubL5FullClosure + smoke + Playwright", status: "closed" },
  {
    id: "PH-L5-P1-06",
    severity: "P1",
    title: "主理人槽 region_steward 门闸（非 steward 假 id）",
    status: "closed",
  },
  {
    id: "PH-L5-P2-01",
    severity: "P2",
    title: "merchant/acquisition listing cover_url（payload 投影 · ①）",
    status: "closed",
  },
  {
    id: "PH-L5-P2-02",
    severity: "P2",
    title: "GET /me/publish-summary BFF 聚合（①）· traveltrust-api 真源 ②",
    status: "closed",
  },
  {
    id: "PH-L5-P2-03",
    severity: "P2",
    title: "?filter= / ?identity= 深链默认筛选轨",
    status: "closed",
  },
  {
    id: "PH-L5-IA-01",
    severity: "P1",
    title: "L5 边界：发布中心五轨功能 · 社区帖仅头像下拉 /community/me/posts",
    status: "closed",
  },
  {
    id: "PH-L5-IA-02",
    severity: "P1",
    title: "/orders 反向边界：listing/提案 → 发布中心",
    status: "closed",
  },
  {
    id: "PH-L5-IA-03",
    severity: "P2",
    title: "MeQuickLinks 订单文案对齐 header_myOrders",
    status: "closed",
  },
  {
    id: "PH-L5-IA-04",
    severity: "P2",
    title: "商家工作台市场曝光 ↔ 发布中心 merchant 轨互指",
    status: "closed",
  },
  {
    id: "PH-L5-IA-05",
    severity: "P2",
    title: "?identity= / 单槽默认筛选（PH-B-2 ① 子集）",
    status: "closed",
  },
  {
    id: "PH-L5-IA-06",
    severity: "P2",
    title: "SSOT 文档五轨 + 社区边界漂移清零",
    status: "closed",
  },
  {
    id: "PH-L5-IA-FREEZE",
    severity: "P1",
    title: "IA 边界 ACTIVE 100 · 冻结 /me/publish · /orders copy · header · provider 互链",
    status: "closed",
  },
];

export const PUBLISH_HUB_L5_OPEN_P0: readonly string[] = PUBLISH_HUB_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
).map((f) => f.id);

export const PUBLISH_HUB_L5_OPEN_P1: readonly string[] = PUBLISH_HUB_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
).map((f) => f.id);

export const PUBLISH_HUB_PHASE_L5_CLOSURE_DOC =
  "evidence/GO_local_auth_l5/PUBLISH-HUB-PHASE1-CLOSURE.md" as const;

export const PUBLISH_HUB_L5_LOCAL_GATE_JSON =
  "evidence/GO_local_auth_l5/publish-hub-l5-local-gate.v1.json" as const;
