import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("header user menu admin nav", () => {
  const model = readFileSync(join(__dir, "headerUserMenuNavModel.ts"), "utf8");
  const links = readFileSync(join(__dir, "HeaderUserMenuNavLinks.tsx"), "utf8");

  it("exposes admin workspace item behind role gate", () => {
    expect(model).toContain("headerAdminWorkspaceNavItem");
    expect(model).toContain('href: "/admin"');
    expect(model).toContain("showAdminWorkspace");
    expect(links).toContain("isAdminActorRole");
    expect(links).toContain("showAdminWorkspace");
    expect(model).toContain("header_admin_workspace");
  });
});
