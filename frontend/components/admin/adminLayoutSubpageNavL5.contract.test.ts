import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin layout subpage nav L5", () => {
  const nav = readFileSync(join(__dir, "AdminLayoutSubpageNav.tsx"), "utf8");
  const shell = readFileSync(join(__dir, "AdminCapabilitiesShell.tsx"), "utf8");

  it("injects workspace back when subpage lacks one", () => {
    expect(shell).toContain("AdminLayoutSubpageNav");
    expect(nav).toContain("data-tt-admin-layout-breadcrumb");
    expect(nav).toContain("AdminSubpageBreadcrumb");
    expect(nav).toContain("TT_ADMIN_LAYOUT_GUTTER");
    expect(nav).toContain("data-tt-admin-queue-list");
    expect(nav).toContain('main nav a[href="/admin"]');
  });
});
