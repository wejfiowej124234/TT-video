/**
 * ①→② PHASE2-START-CHECKLIST-SPRINT · 机读契约
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PHASE1_ALL_EVIDENCE_STATE_MACHINE_FROZEN,
  PHASE1_AUTHORITATIVE_EVIDENCE_ANCHORS,
  PHASE2_G0_G4_ADMISSION_VERDICT,
  PHASE2_START_CHECKLIST_DIMENSIONS,
  PHASE2_START_CHECKLIST_GATE_IDS,
  PHASE2_START_CHECKLIST_SPRINT_AUTHORITATIVE_LOG,
  PHASE2_START_CHECKLIST_SPRINT_EVIDENCE_OK,
  PHASE2_START_CHECKLIST_SPRINT_FROZEN,
} from "./phase2StartChecklistSprintModel";

const root = resolve(__dirname, "../..");

describe("phase2StartChecklistSprint contract (①→②)", () => {
  it("phase1 state machine freeze marker is true", () => {
    expect(PHASE1_ALL_EVIDENCE_STATE_MACHINE_FROZEN).toBe(true);
  });

  it("G-0～G-4 gate ids and dimensions defined", () => {
    expect(PHASE2_START_CHECKLIST_GATE_IDS).toEqual(["G-0", "G-1", "G-2", "G-3", "G-4"]);
    expect(PHASE2_START_CHECKLIST_DIMENSIONS.length).toBeGreaterThanOrEqual(7);
  });

  it("phase1 authoritative evidence anchors exist on disk", () => {
    for (const rel of PHASE1_AUTHORITATIVE_EVIDENCE_ANCHORS) {
      const abs = resolve(root, "..", rel.replace(/^frontend\//, "frontend/"));
      expect(readFileSync(abs, "utf8").length).toBeGreaterThan(10);
    }
  });

  it("evidence script inventories G-0～G-4", () => {
    const script = readFileSync(
      resolve(root, "../scripts/dev/record-phase2-start-checklist-sprint-evidence.sh"),
      "utf8",
    );
    expect(script).toContain("TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK");
    expect(script).toContain("TT_PHASE2_G0_G4_ADMISSION: CLEAR");
    expect(script).toContain("check-phase2-onboarding-staging-ready.sh");
    expect(script).toContain("G-0");
    expect(script).toContain("G-4");
  });

  it("freeze docs reference START-CHECKLIST and phase discipline", () => {
    const freeze = readFileSync(
      resolve(
        root,
        "evidence/GO_phase2_start_checklist_sprint/PHASE2-START-CHECKLIST-SPRINT-FREEZE.md",
      ),
      "utf8",
    );
    const p1 = readFileSync(
      resolve(
        root,
        "evidence/GO_phase2_start_checklist_sprint/PHASE1-ALL-EVIDENCE-STATE-MACHINE-FREEZE.md",
      ),
      "utf8",
    );
    expect(freeze).toContain("PHASE2-START-CHECKLIST");
    expect(freeze).toContain("G-0");
    expect(freeze).toContain(PHASE2_START_CHECKLIST_SPRINT_AUTHORITATIVE_LOG);
    expect(p1).toContain("状态机");
    expect(p1).toContain("REAL-USER-ACCEPTANCE-SPRINT");
  });

  it("model pins authoritative admission log", () => {
    expect(PHASE2_START_CHECKLIST_SPRINT_FROZEN).toBe(true);
    expect(PHASE2_G0_G4_ADMISSION_VERDICT).toBe("CLEAR");
    expect(PHASE2_START_CHECKLIST_SPRINT_AUTHORITATIVE_LOG).toBe(
      "PHASE2-START-CHECKLIST-SPRINT-20260610T000230Z.log",
    );
    expect(PHASE2_START_CHECKLIST_SPRINT_EVIDENCE_OK).toContain(
      "TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK",
    );
  });
});
