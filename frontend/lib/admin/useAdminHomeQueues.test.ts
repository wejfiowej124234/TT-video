import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin home queues wiring", () => {
  it("shell uses shared provider and hooks support context fallback", () => {
    const shell = readFileSync(
      join(__dir, "..", "..", "components", "admin", "AdminCapabilitiesShell.tsx"),
      "utf8",
    );
    expect(shell).toContain("AdminHomeQueuesProvider");

    const inbox = readFileSync(join(__dir, "useAdminHomeInbox.ts"), "utf8");
    expect(inbox).toContain("AdminHomeInboxContext");
    expect(inbox).toContain("AdminHomeInboxProvider");
    expect(inbox).toContain("fetchEnabled: !ctx");

    const kpi = readFileSync(join(__dir, "useAdminHomeKpi.ts"), "utf8");
    expect(kpi).toContain("AdminHomeKpiContext");
    expect(kpi).toContain("AdminHomeKpiProvider");
    expect(kpi).toContain("fetchEnabled: !ctx");
  });
});
