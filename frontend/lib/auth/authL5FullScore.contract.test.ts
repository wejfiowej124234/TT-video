import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const GLOBALS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
const HEADER = readFileSync(join(process.cwd(), "components", "Header.tsx"), "utf8");
const LOGIN_PAGE = readFileSync(join(process.cwd(), "app", "auth", "login", "page.tsx"), "utf8");
const AUTH_L5_CARD = readFileSync(join(process.cwd(), "components", "auth", "AuthL5Card.tsx"), "utf8");
const AUTH_L5_CHECKBOX = readFileSync(join(process.cwd(), "components", "auth", "AuthL5Checkbox.tsx"), "utf8");

describe("auth L5 full-score polish (①)", () => {
  it("globals enforce dark autofill + glass + header warm utility", () => {
    expect(GLOBALS).toContain("color-scheme: dark");
    expect(GLOBALS).toContain(".auth-l5-field-control:-webkit-autofill");
    expect(GLOBALS).toContain("0 0 0 1000px #14100d inset");
    expect(GLOBALS).toContain("backdrop-filter: blur(28px)");
    expect(GLOBALS).toContain(".auth-l5-card-ambient");
    expect(GLOBALS).toContain("header[data-tt-auth-header-l5");
    expect(GLOBALS).toContain(".auth-l5-checkbox-track");
  });

  it("header marks auth L5 chrome for utility pill SSOT", () => {
    expect(HEADER).toContain("data-tt-auth-header-l5");
    expect(HEADER).toContain("isAuthL5DarkHeaderPath");
  });

  it("login uses AuthL5Card checkbox and field SSOT classes", () => {
    expect(LOGIN_PAGE).toContain("AuthL5Card");
    expect(LOGIN_PAGE).toContain("AuthL5Checkbox");
    expect(readFileSync(join(process.cwd(), "lib/auth/authL5Form.ts"), "utf8")).toContain("rememberRowHit");
    expect(LOGIN_PAGE).toContain("authL5FieldClass");
    expect(LOGIN_PAGE).not.toContain('type="checkbox"');
    expect(AUTH_L5_CARD).toContain("auth-l5-glass-vignette");
    expect(AUTH_L5_CARD).toContain("auth-l5-card-ambient");
    expect(AUTH_L5_CHECKBOX).toContain("rememberRowHit");
    expect(AUTH_L5_CHECKBOX).toContain('htmlFor={id}');
  });
});
