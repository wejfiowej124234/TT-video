import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("GovernanceProposalExecStatusBadge narrative SSOT (A-08)", () => {
  const src = readFileSync(join(__dir, "GovernanceProposalExecStatusBadge.tsx"), "utf8");

  it("uses GovExecReadOnlyI18n for source labels and readonly caption", () => {
    expect(src).toContain("GovExecReadOnlyI18n");
    expect(src).toContain("GovExecReadOnlyI18n.readonlyCaption");
    expect(src).toContain("GovExecReadOnlyI18n.sharedListQueuedHint");
  });
});
