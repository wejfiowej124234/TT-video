import { describe, expect, it } from "vitest";

import { ADMIN_PLATFORM_HUB_HEADER_LINKS } from "./adminPlatformHubHeaderNav";
import { ADMIN_SHELL_MORE_NAV_LINKS } from "./adminShellMoreNavLinks";

describe("adminPlatformHubHeaderNav (①)", () => {
  it("aligns platform hubs with more-nav observability/audit/config/compliance", () => {
    const hubHrefs = ["/admin/observability", "/admin/audit", "/admin/config", "/admin/compliance"];
    for (const href of hubHrefs) {
      expect(ADMIN_SHELL_MORE_NAV_LINKS.some((l) => l.href === href)).toBe(true);
      expect(ADMIN_PLATFORM_HUB_HEADER_LINKS.some((l) => l.href === href)).toBe(true);
    }
    expect(ADMIN_PLATFORM_HUB_HEADER_LINKS.some((l) => l.href === "/admin/inbox")).toBe(true);
    expect(ADMIN_PLATFORM_HUB_HEADER_LINKS.some((l) => l.href === "/admin")).toBe(true);
  });
});
