/**
 * ① Real User Acceptance Sprint · 机读契约
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  REAL_USER_ACCEPTANCE_FORBIDDEN,
  REAL_USER_ACCEPTANCE_SPRINT_AUTHORITATIVE_LOG,
  REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE_OK,
  REAL_USER_ACCEPTANCE_SPRINT_FROZEN,
} from "./realUserAcceptanceSprintModel";

const root = resolve(__dirname, "../..");

describe("realUserAcceptanceSprint contract (①)", () => {
  it("freeze marker is true", () => {
    expect(REAL_USER_ACCEPTANCE_SPRINT_FROZEN).toBe(true);
  });

  it("spec and helper forbid seed/trust-gate accounts", () => {
    const spec = readFileSync(resolve(root, "e2e/real-user-acceptance-sprint.spec.ts"), "utf8");
    const helper = readFileSync(resolve(root, "e2e/helpers/realUserAcceptanceCorridor.ts"), "utf8");
    for (const token of REAL_USER_ACCEPTANCE_FORBIDDEN) {
      expect(spec).not.toContain(token);
    }
    expect(helper).toContain("traveltrust.acceptance");
    expect(helper).toContain("assertNotSeedEmail");
    expect(spec).toContain("Real user acceptance sprint");
  });

  it("evidence script exists", () => {
    const script = readFileSync(
      resolve(root, "../scripts/dev/record-real-user-acceptance-sprint-evidence.sh"),
      "utf8",
    );
    expect(script).toContain("TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: OK");
    expect(script).toContain("SEED_TEST_ACCOUNTS=0");
  });

  it("freeze doc pins authoritative evidence log", () => {
    const freeze = readFileSync(
      resolve(root, "evidence/GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain(REAL_USER_ACCEPTANCE_SPRINT_AUTHORITATIVE_LOG);
    expect(freeze).toContain(REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE_OK);
    expect(freeze).toContain("禁止");
    expect(freeze).toContain("异常流矩阵");
    expect(freeze).toContain("PHASE2-START-CHECKLIST");
  });
});
