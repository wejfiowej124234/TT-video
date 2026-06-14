/**
 * Guide Workbench L5 Full Closure · `/guide` 向导工作台全页收口 SSOT（① · UI 冻结）
 * 通过标准：接单 → 挂牌 → 信任 →（有史才）统计；与市场 / settings / Hub 分工清晰
 */
export const GUIDE_WORKBENCH_L5_CLOSURE_SPRINT_ID = "guide-workbench-l5-full-closure-20260612" as const;

/** 全页探针 · Operator Grade 后冻结 */
export const GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE = "guide-workbench-full-v1" as const;

export const GUIDE_WORKBENCH_PAGE_L5_UI_FROZEN = true as const;

export const GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER = "guide-workbench-l5-20260612" as const;

/** 收件箱子域仍 ACTIVE（2026-06-09）；全页冻结为其超集 */
export const GUIDE_WORKBENCH_INBOX_L5_FROZEN = true as const;

/** @deprecated 收件箱探针；全页以 PAGE probe 为准 */
export const GUIDE_WORKBENCH_L5_CLOSURE_PROBE = GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE;

/** @deprecated 收件箱 marker；全页以 PAGE marker 为准 */
export const GUIDE_WORKBENCH_L5_FROZEN_MARKER = GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER;

export const GUIDE_WORKBENCH_L5_LOCALE_KEYS: readonly string[] = [
  "guide_workbench_eyebrow",
  "guide_workbench_inbox_title",
  "guide_workbench_inbox_empty",
  "guide_workbench_profile_summary_title",
  "guide_workbench_profile_public_title_hint",
  "guide_workbench_market_exposure_title",
  "guide_workbench_market_exposure_subtitle",
  "guide_workbench_market_exposure_subtitle_blocked",
  "guide_workbench_market_exposure_locked_placeholder",
  "guide_staking_status_snapshot_line",
  "guide_staking_status_ops_hint",
  "guide_workbench_inbox_empty_trust_link",
  "guide_workbench_inbox_empty_trust_cta",
  "guide_workbench_trust_admission_cta",
  "guide_workbench_inbox_empty_blocked_body",
  "guide_workbench_stats_teaser_title",
  "guide_workbench_stats_teaser_body",
  "guide_workbench_availability_title",
  "guide_workbench_availability_subtitle",
  "guide_workbench_availability_occupied_month",
  "guide_workbench_availability_view_public",
  "guide_workbench_availability_load_fail",
  "guide_workbench_profile_summary_market_browse",
  "guide_workbench_profile_public_detail_unavailable_hint",
  "me_guide_profile_back_workbench",
] as const;

export const GUIDE_WORKBENCH_L5_BANNED_COPY =
  /托管|运营审核|运营|API\s*同源|\bAPI\b|服务端|UUID|order_id|Runbook|cold start|Campaign|developers?/i;

export type GuideWorkbenchL5ClosureFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  title: string;
  status: "closed" | "open" | "deferred";
  phase?: "②" | "③";
};

export const GUIDE_WORKBENCH_L5_CLOSURE_FINDINGS: readonly GuideWorkbenchL5ClosureFinding[] = [
  { id: "GW-L5-P0-01", severity: "P0", title: "整页未 UI 冻结（仅收件箱）", status: "closed" },
  { id: "GW-L5-P1-01", severity: "P1", title: "public_title 工作台无轻提示", status: "closed" },
  { id: "GW-L5-P1-02", severity: "P1", title: "新向导信任快照 + 空收件箱重复焦虑", status: "closed" },
  { id: "GW-L5-P1-03", severity: "P1", title: "折叠统计无「接单后展开」锚点", status: "closed" },
  { id: "GW-L5-P1-04", severity: "P1", title: "工作台无档期/可预约入口", status: "closed" },
  { id: "GW-L5-P1-06", severity: "P1", title: "settings 预览与工作台重复 · 准入双 checklist", status: "closed" },
  { id: "GW-L5-P0-02", severity: "P0", title: "向导收件箱/订单列表未按 guide_id 分离旅客单", status: "closed" },
  { id: "GW-L5-P1-07", severity: "P1", title: "data_origin / PDF 提示 / 工作台顶链回设置", status: "closed" },
  { id: "GW-L5-P1-05", severity: "P1", title: "整页 E2E 覆盖偏窄", status: "closed" },
  { id: "GW-L5-P2-01", severity: "P2", title: "② 真环境接单延迟 / 跨设备同步 SLA", status: "deferred", phase: "②" },
  { id: "GW-L5-P2-02", severity: "P2", title: "生产级经营报表 / 对账", status: "deferred", phase: "③" },
  { id: "GW-L5-P2-03", severity: "P2", title: "作品集深度经营分析", status: "deferred", phase: "②" },
] as const;

export const GUIDE_WORKBENCH_L5_OPEN_P0 = GUIDE_WORKBENCH_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);
export const GUIDE_WORKBENCH_L5_OPEN_P1 = GUIDE_WORKBENCH_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);
