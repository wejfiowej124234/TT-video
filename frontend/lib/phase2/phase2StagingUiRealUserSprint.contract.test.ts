/**
 * Phase ② · Staging UI Real User Sprint · 机读契约
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PHASE2_STAGING_UI_REAL_USER_API_BASE,
  PHASE2_STAGING_UI_REAL_USER_FORBIDDEN,
  PHASE2_STAGING_UI_REAL_USER_PAYMENT_MODE,
  PHASE2_STAGING_UI_REAL_USER_SPRINT_AUTHORITATIVE_LOG,
  PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE_OK,
  PHASE2_STAGING_UI_REAL_USER_SPRINT_FROZEN,
  PHASE2_STAGING_UI_REAL_USER_SPRINT_STEP_IDS,
  PHASE2_STAGING_UI_REAL_USER_WEB_BASE,
} from "./phase2StagingUiRealUserSprintModel";

const root = resolve(__dirname, "../..");

describe("phase2StagingUiRealUserSprint contract (②)", () => {
  it("defines 9 UI execution steps", () => {
    expect(PHASE2_STAGING_UI_REAL_USER_SPRINT_STEP_IDS).toHaveLength(9);
    expect(PHASE2_STAGING_UI_REAL_USER_SPRINT_STEP_IDS[0]).toBe("S01-register");
    expect(PHASE2_STAGING_UI_REAL_USER_SPRINT_STEP_IDS[8]).toBe("S09-review");
  });

  it("targets tt-web-staging and tt-api-staging", () => {
    expect(PHASE2_STAGING_UI_REAL_USER_WEB_BASE).toContain("tt-web-staging");
    expect(PHASE2_STAGING_UI_REAL_USER_API_BASE).toContain("tt-api-staging");
  });

  it("payment mode is staging sandbox not production PSP", () => {
    expect(PHASE2_STAGING_UI_REAL_USER_PAYMENT_MODE).toBe("chain_off_mock_pay_sandbox");
  });

  it("spec forbids seed accounts and uses testnet email cohort", () => {
    const spec = readFileSync(
      resolve(root, "e2e/phase2-staging-ui-real-user-sprint.spec.ts"),
      "utf8",
    );
    const helper = readFileSync(
      resolve(root, "e2e/helpers/phase2StagingUiRealUserCorridor.ts"),
      "utf8",
    );
    for (const token of PHASE2_STAGING_UI_REAL_USER_FORBIDDEN) {
      expect(spec).not.toContain(token);
    }
    expect(helper).toContain("traveltrust.testnet");
    expect(spec).toContain("PHASE2_STAGING_UI_REAL_USER_SPRINT");
  });

  it("evidence script requires staging pregate and playwright", () => {
    const rec = readFileSync(
      resolve(root, "../scripts/dev/record-phase2-staging-ui-real-user-sprint-evidence.sh"),
      "utf8",
    );
    expect(rec).toContain("check-phase2-onboarding-staging-ready.sh");
    expect(rec).toContain("phase2-staging-ui-real-user-sprint.spec.ts");
    expect(rec).toContain("TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: OK");
    expect(rec).toContain("CLOSING-GAP-CHECKLIST");
  });

  it("freeze doc states phase discipline", () => {
    const freeze = readFileSync(
      resolve(
        root,
        "evidence/GO_phase2_staging_ui_real_user_sprint/PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md",
      ),
      "utf8",
    );
    expect(freeze).toContain("PHASE2-TESTNET-EXECUTION-SPRINT");
    expect(freeze).toContain("rollback");
    expect(freeze).toContain("WEB3-P2-003");
    expect(freeze).toContain("Closing Gap");
  });

  it("model is frozen and pins evidence markers", () => {
    expect(PHASE2_STAGING_UI_REAL_USER_SPRINT_FROZEN).toBe(true);
    expect(PHASE2_STAGING_UI_REAL_USER_SPRINT_AUTHORITATIVE_LOG).toContain(
      "PHASE2-STAGING-UI-REAL-USER-SPRINT",
    );
    expect(PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE_OK).toContain(
      "TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: OK",
    );
  });
});
