import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LANG = readFileSync(join(process.cwd(), "components/header/HeaderLanguageSwitcher.tsx"), "utf8");
const WALLET = readFileSync(join(process.cwd(), "components/trust/WalletStatusMini.tsx"), "utf8");
const USER = readFileSync(join(process.cwd(), "components/header/HeaderUserMenu.tsx"), "utf8");
const TOKENS = readFileSync(join(process.cwd(), "lib/header/headerUtilityMenuL5.ts"), "utf8");

describe("header utility menu L5 (①)", () => {
  it("shared tokens declare glass shell and active rail", () => {
    expect(TOKENS).toContain("auth-l5-glass-surface");
    expect(TOKENS).toContain("header-utility-dropdown-panel");
    expect(TOKENS).toContain("itemWithIcon");
    expect(TOKENS).toContain("headerUtilityMenuL5ShellClass");
  });

  it("language and wallet authL5 menus use shared chrome", () => {
    expect(LANG).toContain("HeaderUtilityMenuL5Chrome");
    expect(LANG).toContain("headerUtilityMenuL5ShellClass");
    expect(WALLET).toContain("HeaderUtilityMenuL5Chrome");
    expect(WALLET).toContain("data-tt-header-wallet-menu-l5");
  });

  it("utility dropdowns stay absolute under trigger (no relative override)", () => {
    expect(LANG).not.toContain("`relative ${menuClass}`");
    expect(WALLET).not.toContain("`relative ${menuClass}`");
    expect(WALLET).toContain("className={menuClass}");
    expect(LANG).toContain("headerUtilityMenuL5ShellClass");
    expect(TOKENS).toContain("right-0 top-full");
    expect(TOKENS).toContain("DROPDOWN_POS");
  });

  it("user menu uses shared chrome and profile avatar strip", () => {
    expect(USER).toContain("HeaderUtilityMenuL5Chrome");
    expect(readFileSync(join(process.cwd(), "components/header/HeaderUserMenuNavLinks.tsx"), "utf8")).toContain(
      "profileAvatar",
    );
  });
});
