/**
 * Phase ② · Testnet Execution Sprint — 机读标记
 * SSOT: frontend/evidence/GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md
 */
export const PHASE2_TESTNET_EXECUTION_SPRINT_FROZEN = true;

export const PHASE2_TESTNET_EXECUTION_SPRINT_AUTHORITATIVE_LOG =
  "PHASE2-TESTNET-EXECUTION-SPRINT-20260610T001415Z.log";

export const PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE_OK =
  "TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK 20260610T001415Z";

export const PHASE2_TESTNET_EXECUTION_STEP_IDS = [
  "S01-register",
  "S02-guide-onboard",
  "S03-book",
  "S04-accept",
  "S05-bilateral",
  "S06-final-plan",
  "S07-payment-sandbox",
  "S08-chain-testnet",
  "S09-complete",
  "S10-review",
] as const;

/** ② 订单支付：staging mock-pay 沙箱 · 非 ③ Production PSP · 非 WEB3-P2-003 真 USDC */
export const PHASE2_TESTNET_EXECUTION_PAYMENT_MODE = "chain_off_mock_pay_sandbox" as const;
