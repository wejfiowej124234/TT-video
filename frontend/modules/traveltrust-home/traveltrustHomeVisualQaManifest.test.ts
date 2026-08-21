import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST } from "@/lib/traveltrust/home/visualQaChecklist";
import { TRAVELTRUST_HOME_VISUAL_QA_CODE_EVIDENCE } from "@/lib/traveltrust/home/visualQaEvidence";
import { TRAVELTRUST_HOME_VISUAL_QA_MANIFEST } from "@/lib/traveltrust/home/visualQaManifest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("traveltrust-home visual QA manifest (P1)", () => {
  it("aligns checklist, code evidence, and e2e manifest ids", () => {
    const checklistIds = TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST.map((i) => i.id);
    const manifestIds = TRAVELTRUST_HOME_VISUAL_QA_MANIFEST.map((i) => i.id);
    const evidenceIds = Object.keys(TRAVELTRUST_HOME_VISUAL_QA_CODE_EVIDENCE);
    expect(manifestIds).toEqual(checklistIds);
    expect(evidenceIds.sort()).toEqual(checklistIds.slice().sort());
  });

  it("registers e2e probe spec and evidence output dir", () => {
    expect(
      readFileSync(join(root, "e2e/traveltrust-home-modular-visual-qa.probe.spec.ts"), "utf8"),
    ).toContain("TRAVELTRUST_HOME_VISUAL_QA_MANIFEST");
    expect(
      readFileSync(join(root, "evidence/traveltrust-home-visual-qa/README.md"), "utf8"),
    ).toContain("e2e:traveltrust-home-modular-qa");
  });

  it("every manifest entry includes code channel", () => {
    for (const entry of TRAVELTRUST_HOME_VISUAL_QA_MANIFEST) {
      expect(entry.channels).toContain("code");
    }
  });
});
