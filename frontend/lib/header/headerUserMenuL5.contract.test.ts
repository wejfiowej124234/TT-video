import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MENU = readFileSync(join(process.cwd(), "components/header/HeaderUserMenu.tsx"), "utf8");
const NAV = readFileSync(join(process.cwd(), "components/header/HeaderUserMenuNavLinks.tsx"), "utf8");
const UTILITY = readFileSync(join(process.cwd(), "lib/header/headerUtilityMenuL5.ts"), "utf8");

describe("header user menu Auth L5 (①)", () => {
  it("dropdown uses glass shell tokens and profile strip", () => {
    expect(MENU).toContain("TT_HEADER_USER_MENU_L5");
    expect(MENU).toContain("data-tt-header-user-menu-l5");
    expect(UTILITY).toContain("auth-l5-glass-surface");
    expect(NAV).toContain("profileAvatar");
    expect(UTILITY).toContain("header-utility-dropdown-panel");
    expect(UTILITY).toContain("itemWithIcon");
  });

  it("nav links expose icons and active route", () => {
    expect(NAV).toContain("HeaderUserMenuItemIcon");
    expect(NAV).toContain("aria-current");
    expect(NAV).toContain("headerUserMenuNavSections");
    expect(readFileSync(join(process.cwd(), "components/header/headerUserMenuNavModel.ts"), "utf8")).toContain(
      "/me/identities",
    );
  });

  it("authL5 variant wires L5 logout confirm", () => {
    expect(MENU).toContain('variant === "authL5"');
    expect(MENU).toContain("HeaderUserMenuL5Logout");
    const logout = readFileSync(join(process.cwd(), "components/header/HeaderUserMenuL5Logout.tsx"), "utf8");
    expect(logout).toContain("data-tt-header-logout-l5");
    expect(logout).not.toContain("window.confirm");
  });
});
