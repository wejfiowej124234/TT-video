import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REGISTER_DIR = join(ROOT, "app", "auth", "register");
const FREEZE_DOC = join(ROOT, "evidence", "GO_local_auth_l5", "AUTH-REGISTER-UI-FREEZE.md");
const EXPERIMENTS = readFileSync(join(ROOT, "config", "trustGrowthExperiments.ts"), "utf8");

/** 与 AUTH-REGISTER-UI-FREEZE.md §文件边界 同步（含机读契约） */
const AUTH_REGISTER_UI_FROZEN_FILES = [
  "constants.ts",
  "error.tsx",
  "layout.tsx",
  "loading.tsx",
  "page.tsx",
  "README.md",
  "registerBackgrounds.ts",
  "RegisterGuideForm.tsx",
  "RegisterGuideFormAccountSection.tsx",
  "RegisterGuideFormDidProfileSection.tsx",
  "registerGuideFormTypes.ts",
  "RegisterPageBackdrop.tsx",
  "RegisterPageMain.tsx",
  "registerPage.contract.test.ts",
  "registerPageModel.test.ts",
  "registerPageModel.ts",
  "RegisterTouristForm.tsx",
  "RegisterVerificationCodeField.tsx",
  "useRegisterPage.ts",
  "utils.ts",
] as const;

const FORBIDDEN_REGISTER_UI_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\btype="checkbox"/, reason: "native checkbox on register shell" },
  { pattern: /\bbg-bg-main\b/, reason: "console light page shell" },
  { pattern: /<RegisterPageBackdrop/, reason: "legacy register photo backdrop component" },
  { pattern: /REGISTER_BG_SRC/, reason: "register stock photo map in shell" },
  { pattern: /MarketDarkRouteSceneDecor/, reason: "market photo decor" },
  { pattern: /\bref-cyan\b|\bborder-cyan-|\bbg-cyan-/, reason: "market cyan chrome" },
  { pattern: /titleCompact/, reason: "register main title must use titleLogin" },
];

function readRegisterShellSources(): string {
  return ["RegisterTouristForm.tsx", "RegisterGuideForm.tsx", "page.tsx", "RegisterPageMain.tsx"]
    .map((f) => readFileSync(join(REGISTER_DIR, f), "utf8"))
    .join("\n");
}

describe("/auth/register UI freeze (① · AUTH-REGISTER-UI-FREEZE)", () => {
  it("freeze SSOT doc exists and declares sealed register UI", () => {
    const doc = readFileSync(FREEZE_DOC, "utf8");
    expect(doc).toContain("2026-05-26");
    expect(doc).toContain("收口");
    expect(doc).toContain("锁死");
    expect(doc).toContain("data-tt-auth-register-ui-frozen");
    expect(doc).toContain("titleLogin");
    expect(doc).toContain("preferCollapsedSummary");
    expect(doc).toContain("authRegisterUiFreeze");
    expect(readFileSync(join(ROOT, "components", "auth", "AuthRouteLoading.tsx"), "utf8")).toContain(
      "data-tt-auth-register-ui-frozen",
    );
  });

  it("loading and error segments stay on L5 register shell", () => {
    const loading = readFileSync(join(REGISTER_DIR, "loading.tsx"), "utf8");
    const error = readFileSync(join(REGISTER_DIR, "error.tsx"), "utf8");
    expect(loading).toContain('variant="register"');
    expect(loading).toContain("AuthRouteLoading");
    expect(error).toContain("AuthRouteErrorShell");
    expect(error).toContain("auth-register");
  });

  it("register route directory matches frozen file allowlist", () => {
    const onDisk = readdirSync(REGISTER_DIR)
      .filter((name) => !name.startsWith("."))
      .sort();
    expect(onDisk).toEqual([...AUTH_REGISTER_UI_FROZEN_FILES].sort());
  });

  it("page uses RegisterPageMain and shells declare frozen + L5 anchors", () => {
    const shell = readRegisterShellSources();
    expect(shell).toContain("RegisterPageMain");
    expect(shell).toContain('data-tt-auth-register-ui-frozen="1"');
    expect(shell).toContain('data-tt-auth-visual="l5"');
    expect(shell).toContain("titleLogin");
    expect(shell).toContain('preferCollapsedSummary');
    expect(shell).toContain("loginHref={loginHref}");
    expect(shell).toContain("AuthL5Card");
    expect(shell).toContain("AuthL5CrossNavFooter");
  });

  it("register trust experiment defaults to collapsed summary (v2)", () => {
    expect(EXPERIMENTS).toContain("version: 2");
    expect(EXPERIMENTS).toMatch(/register:[\s\S]*defaultExpanded: false/);
  });

  it("register shell tsx forbids UI regressions", () => {
    const src = readRegisterShellSources();
    for (const { pattern, reason } of FORBIDDEN_REGISTER_UI_PATTERNS) {
      expect(src, reason).not.toMatch(pattern);
    }
  });
});
