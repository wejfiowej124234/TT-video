import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_MORE_NAV_LINKS } from "./adminShellMoreNavLinks";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

describe("adminShellMoreNavLinks (①)", () => {
  it("sidebar more group lists every SSOT hub href", () => {
    const more = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "more");
    const hrefs = more?.links.map((l) => l.href) ?? [];
    expect(ADMIN_SHELL_MORE_NAV_LINKS.length).toBeGreaterThanOrEqual(5);
    for (const link of ADMIN_SHELL_MORE_NAV_LINKS) {
      expect(hrefs).toContain(link.href);
    }
  });
});
