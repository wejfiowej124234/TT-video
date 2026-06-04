import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS } from "@/lib/admin/adminPhase2RemainingBacklog";
import {
  ADMIN_PHASE2_LOCAL_PREP_COMMANDS,
  adminPhase2LocalPrepCommand,
} from "@/lib/admin/adminPhase2LocalPrepCommands";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("adminPhase2LocalPrepCommands", () => {
  it("defines a command for each remaining backlog id", () => {
    for (const row of ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS) {
      expect(adminPhase2LocalPrepCommand(row.id).length).toBeGreaterThan(8);
    }
  });

  it("FIN-02 command uses node admin-l5-green runner", () => {
    expect(ADMIN_PHASE2_LOCAL_PREP_COMMANDS["ADM-UX-FIN-02"]).toContain(
      "run-admin-l5-green.mjs",
    );
  });

  it("locale cmd keys stay aligned with SSOT (zh)", () => {
    const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
    for (const row of ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS) {
      const cmd = adminPhase2LocalPrepCommand(row.id);
      expect(zh, row.localPrepKey).toContain(cmd.split("  #")[0]!.trim());
    }
  });
});
