import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_COMMUNITY_EXTRA_LINKS } from "./adminShellCommunityNav";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin shell community nav SSOT (① · U2)", () => {
  it("defines policy logs + ranking snapshots + comment visibility paths", () => {
    expect(ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.length).toBe(3);
    const hrefs = ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.map((l) => l.href);
    expect(hrefs).toContain("/admin/community/policy-change-logs");
    expect(hrefs).toContain("/admin/community/ranking/snapshots");
    expect(hrefs).toContain("/admin/community/comments/visibility");
  });

  it("AdminShellBar wires ADMIN_SHELL_COMMUNITY_EXTRA_LINKS spread", () => {
    const shell = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
    expect(shell).toContain("ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.map");
    const ssot = readFileSync(join(__dir, "adminShellCommunityNav.ts"), "utf8");
    for (const { labelKey, href } of ADMIN_SHELL_COMMUNITY_EXTRA_LINKS) {
      expect(ssot, labelKey).toContain(labelKey);
      expect(ssot, href).toContain(href);
    }
  });
});
