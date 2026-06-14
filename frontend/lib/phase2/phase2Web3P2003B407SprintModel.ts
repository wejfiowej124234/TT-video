/**
 * Phase ② · WEB3-P2-003 + B-407 Sprint — 机读标记
 * SSOT: frontend/evidence/GO_phase2_web3_p2_003_b407_sprint/PHASE2-WEB3-P2-003-B407-SPRINT-FREEZE.md
 */
export const PHASE2_WEB3_P2_003_B407_SPRINT_FROZEN = true;

/** 权威证据 log（首跑后更新；复跑产生新时间戳 log） */
export const PHASE2_WEB3_P2_003_B407_SPRINT_AUTHORITATIVE_LOG =
  "PHASE2-WEB3-P2-003-B407-SPRINT-20260610T044503Z.log";

export const PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE_OK =
  "TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: OK 20260610T044503Z";

export const PHASE2_WEB3_P2_003_B407_SPRINT_STEP_IDS = [
  "S01-pregate",
  "S02-order-corridor",
  "S03-create-escrow",
  "S04-bind-escrow-api",
  "S05-real-deposit",
  "S06-state-sync",
  "S07-rollback",
] as const;

export const PHASE2_WEB3_P2_003_B407_STAGING_API_BASE =
  "https://tt-api-staging.fly.dev" as const;

/** ② 真链支付：Sepolia MockERC20 fund track · 非 mock-pay · 非 ③ 主网 USDC */
export const PHASE2_WEB3_P2_003_B407_PAYMENT_MODE = "sepolia_real_token_deposit" as const;

/** B-407 createEscrow + bind; release/distribute 另轨 */
export const PHASE2_WEB3_P2_003_B407_CHAIN_SCOPE = "create_escrow_deposit_sync" as const;

export const PHASE2_WEB3_P2_003_B407_FORBIDDEN = [
  "mock-pay as fund closure",
  "③ Production GO from PRA harness",
] as const;
