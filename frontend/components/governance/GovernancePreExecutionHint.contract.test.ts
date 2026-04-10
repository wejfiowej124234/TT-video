import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("GovernancePreExecutionHint (pure prompt, no mock state)", () => {
  const src = readFileSync(join(__dir, "GovernancePreExecutionHint.tsx"), "utf8");

  it("documents chain_read SSOT label without local state or tx fabrication", () => {
    expect(src).toContain("data_source: chain_read");
    expect(src).not.toMatch(/useState|useReducer|Math\.random/);
    expect(src).not.toMatch(/sendTransaction|writeContract|useSendTransaction/);
  });

  it("includes execution-phase copy keys (A-04, read-only)", () => {
    expect(src).toContain("governance_pre_exec_phases_heading");
    expect(src).toContain("governance_pre_exec_phases_detail");
  });
});
