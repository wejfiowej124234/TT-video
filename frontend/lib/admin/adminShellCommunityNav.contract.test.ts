import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADMIN_SHELL_COMMUNITY_EXTRA_LINKS,
  ADMIN_SHELL_COMMUNITY_NAV_LINKS,
} from "./adminShellCommunityNavLinks";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin shell community nav SSOT (① · Inbox Focus)", () => {
  it("defines policy logs + ranking snapshots + comment visibility paths", () => {
    expect(ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.length).toBe(3);
    const hrefs = ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.map((l) => l.href);
    expect(hrefs).toContain("/admin/community/policy-change-logs");
    expect(hrefs).toContain("/admin/community/ranking/snapshots");
    expect(hrefs).toContain("/admin/community/comments/visibility");
  });

  it("full community nav includes abuse-policy", () => {
    expect(ADMIN_SHELL_COMMUNITY_NAV_LINKS.map((l) => l.href)).toContain(
      "/admin/community/abuse-policy",
    );
  });

  it("community deep SSOT is hub/related · not AdminShellBar deep array", () => {
    const shell = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
    expect(shell).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(shell).not.toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    const related = readFileSync(
      join(fe, "components", "admin", "AdminCommunityRelatedLinks.tsx"),
      "utf8",
    );
    expect(related).toContain("ADMIN_INBOX_QUEUE_HREFS.reports");
    const ssot = readFileSync(join(__dir, "adminShellCommunityNavLinks.ts"), "utf8");
    for (const { labelKey, href } of ADMIN_SHELL_COMMUNITY_EXTRA_LINKS) {
      expect(ssot, labelKey).toContain(labelKey);
      expect(ssot, href).toContain(href);
    }
  });
});
