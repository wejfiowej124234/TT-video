import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ADM_U01_SHELL_GROUP_VISIBILITY } from "./admU01ShellGroupVisibility";

const ROOT = join(__dirname, "../../..");
const YAML = join(ROOT, "registry/admin-rbac-staging-probes.v1.yaml");

describe("admU01 shell matrix ↔ registry YAML", () => {
  it("shell_groups visibility matches admU01ShellMatrix.ts", () => {
    const raw = readFileSync(YAML, "utf8");
    for (const [groupId, expectations] of Object.entries(ADM_U01_SHELL_GROUP_VISIBILITY)) {
      for (const [role, visible] of Object.entries(expectations)) {
        const re = new RegExp(
          `- id: ${groupId}[\\s\\S]*?${role}: (${visible ? "true" : "false"})`,
          "m",
        );
        expect(raw, `${groupId}.${role}`).toMatch(re);
      }
    }
  });
});
