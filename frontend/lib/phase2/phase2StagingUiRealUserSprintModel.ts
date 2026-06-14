/**
 * Phase ② · Staging UI Real User Sprint — 机读标记
 * SSOT: frontend/evidence/GO_phase2_staging_ui_real_user_sprint/PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md
 */
export const PHASE2_STAGING_UI_REAL_USER_SPRINT_FROZEN = true;

/** 权威证据 log（首跑后更新；复跑产生新时间戳 log，冻结引用本常量） */
export const PHASE2_STAGING_UI_REAL_USER_SPRINT_AUTHORITATIVE_LOG =
  "PHASE2-STAGING-UI-REAL-USER-SPRINT-20260610T035106Z.log";

export const PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE_OK =
  "TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: OK 20260610T035106Z";

export const PHASE2_STAGING_UI_REAL_USER_SPRINT_STEP_IDS = [
  "S01-register",
  "S02-guide-onboard",
  "S03-book",
  "S04-accept",
  "S05-bilateral",
  "S06-final-plan",
  "S07-payment-sandbox",
  "S08-complete",
  "S09-review",
] as const;

export const PHASE2_STAGING_UI_REAL_USER_WEB_BASE = "https://tt-web-staging.fly.dev" as const;

export const PHASE2_STAGING_UI_REAL_USER_API_BASE = "https://tt-api-staging.fly.dev" as const;

/** ② 浏览器支付步：staging mock-pay · 非 ③ Production PSP */
export const PHASE2_STAGING_UI_REAL_USER_PAYMENT_MODE = "chain_off_mock_pay_sandbox" as const;

export const PHASE2_STAGING_UI_REAL_USER_FORBIDDEN = [
  "tourist@test.com",
  "guide@test.com",
  "seed-test-accounts",
] as const;
