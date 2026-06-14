/**
 * Phase ② · Testnet Execution Sprint · 机读契约
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PHASE2_TESTNET_EXECUTION_PAYMENT_MODE,
  PHASE2_TESTNET_EXECUTION_STEP_IDS,
  PHASE2_TESTNET_EXECUTION_SPRINT_AUTHORITATIVE_LOG,
  PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE_OK,
  PHASE2_TESTNET_EXECUTION_SPRINT_FROZEN,
} from "./phase2TestnetExecutionSprintModel";

const root = resolve(__dirname, "../..");

describe("phase2TestnetExecutionSprint contract (②)", () => {
  it("defines 10 execution steps", () => {
    expect(PHASE2_TESTNET_EXECUTION_STEP_IDS).toHaveLength(10);
    expect(PHASE2_TESTNET_EXECUTION_STEP_IDS[0]).toBe("S01-register");
    expect(PHASE2_TESTNET_EXECUTION_STEP_IDS[9]).toBe("S10-review");
  });

  it("payment mode is staging sandbox not production PSP", () => {
    expect(PHASE2_TESTNET_EXECUTION_PAYMENT_MODE).toBe("chain_off_mock_pay_sandbox");
  });

  it("smoke script covers full chain markers", () => {
    const smoke = readFileSync(
      resolve(root, "../scripts/dev/smoke-phase2-testnet-execution-sprint.sh"),
      "utf8",
    );
    expect(smoke).toContain("TT_PHASE2_TESTNET_EXECUTION_SPRINT: OK");
    expect(smoke).toContain("rollback.md");
    expect(smoke).toContain("confirm-bilateral");
    expect(smoke).toContain("chain-sync-status");
  });

  it("evidence script requires G-0～G-4 pregate", () => {
    const rec = readFileSync(
      resolve(root, "../scripts/dev/record-phase2-testnet-execution-sprint-evidence.sh"),
      "utf8",
    );
    expect(rec).toContain("check-phase2-onboarding-staging-ready.sh");
    expect(rec).toContain("TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK");
  });

  it("freeze doc states phase discipline", () => {
    const freeze = readFileSync(
      resolve(
        root,
        "evidence/GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md",
      ),
      "utf8",
    );
    expect(freeze).toContain("PHASE2-START-CHECKLIST-SPRINT");
    expect(freeze).toContain("rollback");
    expect(freeze).toContain("WEB3-P2-003");
  });

  it("model pins authoritative execution log", () => {
    expect(PHASE2_TESTNET_EXECUTION_SPRINT_FROZEN).toBe(true);
    expect(PHASE2_TESTNET_EXECUTION_SPRINT_AUTHORITATIVE_LOG).toBe(
      "PHASE2-TESTNET-EXECUTION-SPRINT-20260610T001415Z.log",
    );
    expect(PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE_OK).toContain(
      "TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK",
    );
  });
});
