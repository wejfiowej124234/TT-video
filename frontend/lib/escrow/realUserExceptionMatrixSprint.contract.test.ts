/**
 * ① Real User Exception Matrix Sprint · 机读契约
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  REAL_USER_EXCEPTION_MATRIX_CASE_IDS,
  REAL_USER_EXCEPTION_MATRIX_FORBIDDEN,
  REAL_USER_EXCEPTION_MATRIX_SPRINT_AUTHORITATIVE_LOG,
  REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE_OK,
  REAL_USER_EXCEPTION_MATRIX_SPRINT_FROZEN,
} from "./realUserExceptionMatrixSprintModel";
import { REAL_USER_ACCEPTANCE_FORBIDDEN } from "./realUserAcceptanceSprintModel";

const root = resolve(__dirname, "../..");

describe("realUserExceptionMatrixSprint contract (①)", () => {
  it("spec and helper forbid seed/trust-gate accounts", () => {
    const spec = readFileSync(
      resolve(root, "e2e/real-user-exception-matrix-sprint.spec.ts"),
      "utf8",
    );
    const helper = readFileSync(
      resolve(root, "e2e/helpers/realUserExceptionMatrixCorridor.ts"),
      "utf8",
    );
    for (const token of REAL_USER_EXCEPTION_MATRIX_FORBIDDEN) {
      expect(spec).not.toContain(token);
    }
    for (const token of REAL_USER_ACCEPTANCE_FORBIDDEN) {
      if (token === "trustGateE2eFixtures" || token === "seedTrustGateE2eFixtures") continue;
      expect(spec).not.toContain(token);
    }
    expect(helper).toContain("traveltrust.acceptance");
    expect(helper).toContain("assertNotSeedEmail");
    expect(spec).toContain("Real user exception matrix sprint");
  });

  it("covers required exception matrix case ids", () => {
    const spec = readFileSync(
      resolve(root, "e2e/real-user-exception-matrix-sprint.spec.ts"),
      "utf8",
    );
    expect(spec).toContain("not_assigned_guide");
    expect(spec).toContain("accept_window_expired");
    expect(spec).toContain("payment_window_expired");
    expect(spec).toContain("already_reviewed");
    expect(spec).toContain("guide_has_active_order");
    expect(spec).toContain("schedule_conflict");
    expect(REAL_USER_EXCEPTION_MATRIX_CASE_IDS.length).toBeGreaterThanOrEqual(10);
  });

  it("evidence script exists with matrix + UAT steps", () => {
    const script = readFileSync(
      resolve(root, "../scripts/dev/record-real-user-exception-matrix-sprint-evidence.sh"),
      "utf8",
    );
    expect(script).toContain("TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK");
    expect(script).toContain("SEED_TEST_ACCOUNTS=0");
    expect(script).toContain("real-user-exception-matrix-sprint.spec.ts");
    expect(script).toContain("real-user-acceptance-sprint.spec.ts");
    expect(script).toContain("P3_ACCEPT_TTL_SECS");
  });

  it("freeze doc pins authoritative evidence log", () => {
    const freeze = readFileSync(
      resolve(
        root,
        "evidence/GO_local_real_user_acceptance/REAL-USER-EXCEPTION-MATRIX-FREEZE.md",
      ),
      "utf8",
    );
    expect(freeze).toContain("REAL-USER-ACCEPTANCE-SPRINT-FREEZE");
    expect(freeze).toContain("PHASE2-START-CHECKLIST");
    expect(freeze).toContain("TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE");
    expect(freeze).toContain(REAL_USER_EXCEPTION_MATRIX_SPRINT_AUTHORITATIVE_LOG);
  });

  it("model pins authoritative exception matrix log", () => {
    expect(REAL_USER_EXCEPTION_MATRIX_SPRINT_FROZEN).toBe(true);
    expect(REAL_USER_EXCEPTION_MATRIX_SPRINT_AUTHORITATIVE_LOG).toBe(
      "REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log",
    );
    expect(REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE_OK).toBe(
      "TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK 20260609T235032Z",
    );
  });
});
