/**
 * ① Real User Exception Matrix Sprint — 机读标记
 * SSOT: frontend/evidence/GO_local_real_user_acceptance/REAL-USER-EXCEPTION-MATRIX-FREEZE.md
 */
export const REAL_USER_EXCEPTION_MATRIX_SPRINT_FROZEN = true;

/** 权威 ① 异常流矩阵证据日志（勿换名；复跑产生新时间戳日志，冻结引用本文件） */
export const REAL_USER_EXCEPTION_MATRIX_SPRINT_AUTHORITATIVE_LOG =
  "REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log";

export const REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE_OK =
  "TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK 20260609T235032Z";

/** 与主链 sprint 同源禁止项 */
export const REAL_USER_EXCEPTION_MATRIX_FORBIDDEN = [
  "seed-test-accounts",
  "seedTrustGateE2eFixtures",
  "trustGateE2eFixtures",
  "tourist@test.com",
  "guide@test.com",
  "PUBLIC_CATALOG_HANGZHOU",
  "TRUST_GATE_E2E_PASSWORD",
  "releaseSeedGuideSlot",
] as const;

export const REAL_USER_EXCEPTION_MATRIX_CASE_IDS = [
  "reject_not_assigned_guide",
  "cancel_before_accept",
  "cancel_idempotent",
  "accept_window_expired",
  "payment_window_expired",
  "duplicate_mock_pay",
  "duplicate_review",
  "completion_idempotent",
  "guide_has_active_order",
  "schedule_conflict",
  "version_conflict",
  "unauth_401",
  "non_participant_forbidden",
] as const;
