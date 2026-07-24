import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const LOGIN_DIR = join(ROOT, "app", "auth", "login");
const FREEZE_DOC = join(ROOT, "evidence", "GO_local_auth_l5", "AUTH-LOGIN-UI-FREEZE.md");

/** 与 AUTH-LOGIN-UI-FREEZE.md §文件边界 同步 */
const AUTH_LOGIN_UI_FROZEN_FILES = [
  "README.md",
  "error.tsx",
  "layout.tsx",
  "loading.tsx",
  "LoginPageBackdrop.tsx",
  "LoginPasswordVisibilityToggle.tsx",
  "LoginRouteLoading.tsx",
  "page.tsx",
] as const;

const FORBIDDEN_LOGIN_UI_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\btype="checkbox"/, reason: "native checkbox (use AuthL5Checkbox)" },
  { pattern: /\bbg-bg-main\b/, reason: "console light page shell" },
  { pattern: /AuthShellCrossNav/, reason: "legacy auth cross nav" },
  { pattern: /MarketDarkRouteSceneDecor/, reason: "market photo backdrop" },
  { pattern: /REGISTER_BG_SRC/, reason: "register photo asset" },
  { pattern: /bg-ref-silhouette-vignette/, reason: "cyan silhouette vignette" },
  { pattern: /auth_login_web3Travel/, reason: "removed login marketing line" },
  { pattern: /\bref-cyan\b|\bborder-cyan-|\bbg-cyan-/, reason: "market cyan chrome on login" },
  { pattern: /ring-offset-bg-console/, reason: "console focus ring on login route files" },
];

function readLoginRouteSources(): string {
  return AUTH_LOGIN_UI_FROZEN_FILES.filter((f) => f.endsWith(".tsx"))
    .map((f) => readFileSync(join(LOGIN_DIR, f), "utf8"))
    .join("\n");
}

describe("/auth/login UI freeze (① · AUTH-LOGIN-UI-FREEZE)", () => {
  it("freeze SSOT doc exists and declares hard gate", () => {
    const doc = readFileSync(FREEZE_DOC, "utf8");
    expect(doc).toContain("2026-05-26");
    expect(doc).toContain("data-tt-auth-login-ui-frozen");
    expect(doc).toContain("authLoginUiFreeze");
    expect(doc).toContain("禁止");
  });

  it("login route directory matches frozen file allowlist", () => {
    const onDisk = readdirSync(LOGIN_DIR)
      .filter((name) => !name.startsWith("."))
      .sort();
    expect(onDisk).toEqual([...AUTH_LOGIN_UI_FROZEN_FILES].sort());
  });

  it("page declares UI frozen + L5 visual anchors", () => {
    const page = readFileSync(join(LOGIN_DIR, "page.tsx"), "utf8");
    expect(page).toContain('data-tt-auth-login-ui-frozen="1"');
    expect(page).toContain('data-tt-auth-visual="l5"');
    expect(page).toContain('data-tt-auth-route="login"');
    expect(page).toContain("AuthL5Card");
    expect(page).toContain("AuthL5Checkbox");
    expect(page).toContain("AuthL5PageBackdrop");
    expect(page).toContain("AuthL5CrossNavFooter");
    expect(page).toContain("resolvePostAuthReturnPath");
    // HU-026 · Batch-5: engineering remediation board must not render on login (Auth L5).
    expect(page).not.toContain("AuthLoginGovernanceRemediationProgress");
  });

  it("login route tsx sources forbid UI regressions", () => {
    const src = readLoginRouteSources();
    for (const { pattern, reason } of FORBIDDEN_LOGIN_UI_PATTERNS) {
      expect(src, reason).not.toMatch(pattern);
    }
  });
});
