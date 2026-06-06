import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readAuthRouteShellSources(): string {
  const files = [
    "components/auth/AuthRouteLoading.tsx",
    "components/auth/AuthRouteErrorShell.tsx",
    "app/auth/error.tsx",
    "components/auth/AuthL5PageBackdrop.tsx",
  ];
  return files.map((f) => readFileSync(join(process.cwd(), f), "utf8")).join("\n");
}

describe("auth route shells L5 (loading · error)", () => {
  const src = readAuthRouteShellSources();

  it("uses L5 dark backdrop and glass skeleton (no console flash)", () => {
    expect(src).toContain("AuthL5PageBackdrop");
    expect(src).toContain('data-tt-auth-visual="l5"');
    expect(src).toContain("TT_AUTH_L5_PAGE_SHELL");
    expect(src).toContain("TT_AUTH_L5_FORM.loadingSkeletonCard");
    expect(src).not.toContain("bg-bg-main");
    expect(src).not.toContain("bg-bg-console");
    expect(src).not.toMatch(/bg-travel-500[^/]/);
  });

  it("error shell uses AuthL5Card + warm CTA (not travel-500 pill)", () => {
    expect(src).toContain("AuthL5Card");
    expect(src).toContain("AuthShellCrossNav");
    expect(src).toContain('variant="darkL5"');
    expect(src).toContain("TT_AUTH_L5_FORM.primaryCta");
  });

  it("backdrop omits mesh layer (no scan-line field)", () => {
    const backdrop = readFileSync(join(process.cwd(), "components/auth/AuthL5PageBackdrop.tsx"), "utf8");
    expect(backdrop).not.toContain("bg-auth-login-l5-mesh");
  });
});
