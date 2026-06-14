/**
 * ① Real User Acceptance Sprint — 机读冻结标记
 * SSOT: frontend/evidence/GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md
 */
export const REAL_USER_ACCEPTANCE_SPRINT_FROZEN = true;

/** 权威 ① 主链证据日志（勿换名；复跑产生新时间戳日志，冻结引用本文件） */
export const REAL_USER_ACCEPTANCE_SPRINT_AUTHORITATIVE_LOG =
  "REAL-USER-ACCEPTANCE-SPRINT-20260609T161419Z.log";

export const REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE_OK =
  "TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: OK 20260609T161419Z";

export const REAL_USER_ACCEPTANCE_FORBIDDEN = [
  "seed-test-accounts",
  "trustGateE2eFixtures",
  "seedTrustGateE2eFixtures",
  "tourist@test.com",
  "guide@test.com",
  "releaseSeedGuideSlot",
  "guideRowIdForSeedGuideAccount",
] as const;
