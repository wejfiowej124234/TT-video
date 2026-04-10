import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance proposals list (Task A-1 · chain exec status)", () => {
  const src = readFileSync(join(__dir, "page.tsx"), "utf8");

  it("loads per-proposal status via getGovernanceProposalStatus (no list item.status fallback)", () => {
    expect(src).toContain("getGovernanceProposalStatus");
    expect(src).toContain("GovernanceProposalExecStatusBadge");
    expect(src).toContain("row.data_source");
    expect(src).toContain("row.note");
    expect(src).not.toMatch(/p\.status/);
    expect(src).not.toMatch(/["']active["']\s*\)\s*\?\s*t\(/);
  });

  it("does not hardcode fake governor state labels as user-visible defaults", () => {
    expect(src).not.toMatch(/\|\|\s*["']pending["']/);
    expect(src).not.toMatch(/\|\|\s*["']active["']/);
    expect(src).not.toMatch(/\|\|\s*["']queued["']/);
  });

  it("bridges list to detail with shared narrative keys and link semantics (A-09)", () => {
    expect(src).toContain("GOV_EXEC_LIST_BRIDGE_DOM_ID");
    expect(src).toContain("GovExecReadOnlyI18n.listEntryBridge");
    expect(src).toContain("GovExecReadOnlyI18n.proposalLinkContinueTitle");
    expect(src).toContain("aria-describedby");
  });
});
