/**
 * Phase ② · WEB3-P2-003 + B-407 Sprint · 机读契约
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PHASE2_WEB3_P2_003_B407_CHAIN_SCOPE,
  PHASE2_WEB3_P2_003_B407_FORBIDDEN,
  PHASE2_WEB3_P2_003_B407_PAYMENT_MODE,
  PHASE2_WEB3_P2_003_B407_SPRINT_AUTHORITATIVE_LOG,
  PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE_OK,
  PHASE2_WEB3_P2_003_B407_SPRINT_FROZEN,
  PHASE2_WEB3_P2_003_B407_SPRINT_STEP_IDS,
  PHASE2_WEB3_P2_003_B407_STAGING_API_BASE,
} from "./phase2Web3P2003B407SprintModel";

const root = resolve(__dirname, "../..");

describe("phase2Web3P2003B407Sprint contract (②)", () => {
  it("defines 7 fund-closure steps", () => {
    expect(PHASE2_WEB3_P2_003_B407_SPRINT_STEP_IDS).toHaveLength(7);
    expect(PHASE2_WEB3_P2_003_B407_SPRINT_STEP_IDS[0]).toBe("S01-pregate");
    expect(PHASE2_WEB3_P2_003_B407_SPRINT_STEP_IDS[4]).toBe("S05-real-deposit");
  });

  it("targets staging API and real token deposit mode", () => {
    expect(PHASE2_WEB3_P2_003_B407_STAGING_API_BASE).toContain("tt-api-staging");
    expect(PHASE2_WEB3_P2_003_B407_PAYMENT_MODE).toBe("sepolia_real_token_deposit");
    expect(PHASE2_WEB3_P2_003_B407_CHAIN_SCOPE).toContain("create_escrow");
  });

  it("smoke script uses createEscrow + deposit not mock-pay", () => {
    const smoke = readFileSync(
      resolve(root, "../scripts/dev/smoke-phase2-web3-p2-003-b407-sprint.sh"),
      "utf8",
    );
    const lib = readFileSync(
      resolve(root, "../scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh"),
      "utf8",
    );
    expect(smoke).toContain("CreateEscrowB407");
    expect(smoke).toContain("set-escrow-address");
    expect(smoke).toContain("chain-sync-status");
    expect(lib).toContain("deposit(uint256)");
    expect(smoke).not.toContain("mock-pay → escrowed");
  });

  it("record script chains PRA after fund closure", () => {
    const rec = readFileSync(
      resolve(root, "../scripts/dev/record-phase2-web3-p2-003-b407-sprint-evidence.sh"),
      "utf8",
    );
    expect(rec).toContain("check-phase2-web3-p2-003-b407-preflight.sh");
    expect(rec).toContain("pra-unified-release-evidence-pack.sh");
    expect(rec).toContain("TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: OK");
    expect(rec).toContain("CLOSING-GAP-CHECKLIST");
  });

  it("freeze doc states phase discipline and honest boundary", () => {
    const freeze = readFileSync(
      resolve(
        root,
        "evidence/GO_phase2_web3_p2_003_b407_sprint/PHASE2-WEB3-P2-003-B407-SPRINT-FREEZE.md",
      ),
      "utf8",
    );
    expect(freeze).toContain("WEB3-P2-003");
    expect(freeze).toContain("B-407");
    expect(freeze).toContain("mock-pay");
    expect(freeze).toContain("Production GO");
  });

  it("model is frozen and pins evidence markers", () => {
    expect(PHASE2_WEB3_P2_003_B407_SPRINT_FROZEN).toBe(true);
    expect(PHASE2_WEB3_P2_003_B407_SPRINT_AUTHORITATIVE_LOG).toContain(
      "PHASE2-WEB3-P2-003-B407-SPRINT",
    );
    expect(PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE_OK).toContain(
      "TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: OK",
    );
    expect(PHASE2_WEB3_P2_003_B407_FORBIDDEN[0]).toContain("mock-pay");
  });
});
