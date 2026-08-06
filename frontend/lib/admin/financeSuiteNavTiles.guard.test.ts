import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_FINANCE_PEER_NAV_LINKS } from "@/lib/admin/adminShellFinanceNavLinks";
import { financeSuiteNavTiles } from "@/lib/admin/financeOpsL5";

describe("financeSuiteNavTiles guard (E-CONSOLE-FINANCE)", () => {
  it("PEER SSOT is a non-empty array (no hub self)", () => {
    expect(Array.isArray(ADMIN_SHELL_FINANCE_PEER_NAV_LINKS)).toBe(true);
    expect(ADMIN_SHELL_FINANCE_PEER_NAV_LINKS.length).toBeGreaterThan(0);
    expect(ADMIN_SHELL_FINANCE_PEER_NAV_LINKS.every((l) => !l.activeExact)).toBe(true);
  });

  it("default tiles never throw and never spread a non-iterable", () => {
    const tiles = financeSuiteNavTiles();
    expect(Array.isArray(tiles)).toBe(true);
    expect(tiles.length).toBeGreaterThan(0);
  });

  it("nullish input fail-closed to peer list", () => {
    // @ts-expect-error intentional runtime guard
    const tiles = financeSuiteNavTiles(null);
    expect(Array.isArray(tiles)).toBe(true);
    expect(tiles.length).toBe(ADMIN_SHELL_FINANCE_PEER_NAV_LINKS.length);
  });
});
