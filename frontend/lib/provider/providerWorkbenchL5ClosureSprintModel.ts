/** Provider Workbench L5 Full Closure · `/provider` 商家工作台全页收口 SSOT（① · UI 冻结） */

export const PROVIDER_WORKBENCH_L5_CLOSURE_SPRINT_ID = "provider-workbench-l5-full-closure-20260612" as const;



export const PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE = "provider-workbench-full-v1" as const;



export const PROVIDER_WORKBENCH_PAGE_L5_UI_FROZEN = true as const;



export const PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER = "provider-workbench-l5-20260612" as const;



export const PROVIDER_WORKBENCH_L5_LOCALE_KEYS: readonly string[] = [

  "provider_workbench_eyebrow",

  "provider_workbench_subtitle",

  "provider_workbench_subtitle_pending",

  "provider_workbench_inbox_title",

  "provider_workbench_inbox_empty",

  "provider_workbench_market_exposure_title",

  "provider_workbench_market_exposure_subtitle",

  "provider_workbench_market_exposure_subtitle_blocked",

  "provider_workbench_market_exposure_locked_placeholder",

  "provider_workbench_showcase_inventory_title",

  "provider_workbench_showcase_archive",

  "provider_workbench_showcase_delete_draft",

  "provider_workbench_market_exposure_trust_link",

  "provider_workbench_profile_summary_empty",

  "provider_workbench_profile_missing_title",

  "provider_workbench_profile_missing_body",

  "provider_workbench_profile_missing_cta_settings",

  "provider_workbench_profile_missing_cta_register",

  "provider_workbench_publish_gate_title",

  "provider_workbench_publish_gate_body",

  "provider_workbench_trust_admission_cta",

  "provider_workbench_onboarding_cta",

  "provider_workbench_manage_showcase_cta",

  "provider_workbench_inbox_empty_blocked_body",

  "provider_workbench_inbox_empty_ready_body",

  "provider_workbench_stats_teaser_title",

  "provider_workbench_stats_teaser_body",

  "provider_workbench_stats_teaser_aria",

  "provider_workbench_billing_period_title",

  "merchant_orders_back_workbench",

  "me_merchant_profile_back_workbench",

] as const;



export const PROVIDER_WORKBENCH_L5_BANNED_COPY =

  /托管|运营审核|运营|API\s*同源|\bAPI\b|服务端|UUID|order_id|Runbook|cold start|Campaign|developers?|showcase_summary_pending/i;



export type ProviderWorkbenchL5ClosureFinding = {

  id: string;

  severity: "P0" | "P1" | "P2";

  title: string;

  status: "closed" | "open" | "deferred";

  phase?: "②" | "③";

};



export const PROVIDER_WORKBENCH_L5_CLOSURE_FINDINGS: readonly ProviderWorkbenchL5ClosureFinding[] = [

  { id: "PW-L5-P0-01", severity: "P0", title: "hat=merchant 走廊 + listings-summary API", status: "closed" },

  { id: "PW-L5-P0-02", severity: "P0", title: "profile 404 友好态 + 烟测种子 merchant@test.com", status: "closed" },

  { id: "PW-L5-P0-03", severity: "P0", title: "运行 API 须重启后烟测全绿", status: "closed" },

  { id: "PW-L5-P0-04", severity: "P0", title: "商家资料 settings href 非 undefined（meIdentitiesCoreCardModel SSOT）", status: "closed" },

  { id: "PW-L5-P1-01", severity: "P1", title: "workspace L5 空态/统计折叠/Trust 链", status: "closed" },

  { id: "PW-L5-P1-02", severity: "P1", title: "FullClosure 契约 + 死代码 ShowcaseSection", status: "closed" },

  { id: "PW-L5-P1-03", severity: "P1", title: "start-api Step 6r + Playwright 全页探针", status: "closed" },

  { id: "PW-L5-P1-04", severity: "P1", title: "publish eligibility 摘要上工作台", status: "closed" },

  { id: "PW-L5-P1-05", severity: "P1", title: "商家订单「查看全部」保留 hat=merchant 走廊", status: "closed" },

  { id: "PW-L5-P1-06", severity: "P1", title: "商家订单筛选空态 CTA 去重", status: "closed" },

  { id: "PW-L5-P1-07", severity: "P1", title: "市场预览去重：工作台只读 · 设置仅 dirty · 去掉 Billing 重复 settings 链", status: "closed" },

  { id: "PW-L5-P1-08", severity: "P1", title: "IA 收口：门闸单卡 · 未解锁折叠预览/计数 · 空橱窗优先 studio · onboarding 回链", status: "closed" },

  { id: "PW-L5-P1-09", severity: "P1", title: "橱窗清单：GET /me/merchant-listings · 下架 archive · 删草稿 · 工作台 inventory 排版", status: "closed" },

  { id: "PW-L5-P2-01", severity: "P2", title: "② 跨设备橱窗 SLA / staging 一键账号", status: "deferred", phase: "②" },

  { id: "PW-L5-P2-03", severity: "P2", title: "merchant_orders_list_desc 英文化残留（merchant_service）", status: "deferred" },

  { id: "PW-L5-P2-02", severity: "P2", title: "③ 生产 PSP / 真链经营报表", status: "deferred", phase: "③" },

] as const;



export const PROVIDER_WORKBENCH_L5_OPEN_P0 = PROVIDER_WORKBENCH_L5_CLOSURE_FINDINGS.filter(

  (f) => f.severity === "P0" && f.status === "open",

);

export const PROVIDER_WORKBENCH_L5_OPEN_P1 = PROVIDER_WORKBENCH_L5_CLOSURE_FINDINGS.filter(

  (f) => f.severity === "P1" && f.status === "open",

);

