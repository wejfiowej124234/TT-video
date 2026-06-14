import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("governance params participate panel (① · steward deep link)", () => {
  it("hides participate panel when from=steward_workbench", () => {
    const panel = read("app/governance/params/GovernanceParamsParticipatePanel.tsx");
    expect(panel).toContain("useGovernanceParamsQuery");
    expect(panel).toContain("fromStewardWorkbench");
    expect(panel).toContain('return null');
    expect(panel).toContain('data-tt-governance-params-participate="1"');
  });

  it("query provider reads steward_workbench from search params", () => {
    const provider = read("app/governance/params/GovernanceParamsQueryProvider.tsx");
    expect(provider).toContain('searchParams.get("from") === "steward_workbench"');
  });
});
