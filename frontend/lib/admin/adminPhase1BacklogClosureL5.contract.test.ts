import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** ① 收口闸：backlog 仅余 Phase ②/③ 六项 ❌，其余不得回退为 🟡/❌。 */
describe("admin phase1 backlog closure L5 (①)", () => {
  const backlog = readFileSync(
    join(
      __dir,
      "..",
      "..",
      "evidence",
      "GO_local_admin_workspace_closure",
      "ADMIN-L5-FULL-AUDIT-BACKLOG.md",
    ),
    "utf8",
  );

  const PHASE23_ONLY_IDS = [
    "ADM-UX-IA-06",
    "ADM-UX-ONB-04",
    "ADM-UX-RBAC-05",
    "ADM-UX-RBAC-06",
    "ADM-UX-FIN-02",
    "ADM-UX-CI-02",
  ] as const;

  it("documents exactly six Phase ②/③ open items", () => {
    const openRows = backlog.split("\n").filter((line) => /\|\s*❌\s*\|/.test(line));
    expect(openRows).toHaveLength(PHASE23_ONLY_IDS.length);
    for (const id of PHASE23_ONLY_IDS) {
      expect(backlog, `missing open row for ${id}`).toContain(id);
    }
  });

  it("conclusion states Phase ① machine-read closure", () => {
    expect(backlog).toMatch(/① Admin 工作台 L5 ① 阶段满分/);
    expect(backlog).toContain("TT-ADMIN-PHASE1-FULL-CLOSURE.md");
    expect(backlog).toMatch(/run-admin-l5-green\.sh/);
  });
});
