import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const GLOBALS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
const PAGE = readFileSync(join(process.cwd(), "app/me/identities/page.tsx"), "utf8");
const TOKENS = readFileSync(join(process.cwd(), "lib/me/meIdentitiesL5.ts"), "utf8");

describe("meIdentities L5 full-score polish (①)", () => {
  it("globals L5 glass + callout hooks apply under auth visual attr", () => {
    expect(GLOBALS).toContain('[data-tt-auth-visual="l5"]');
    expect(GLOBALS).toContain(".auth-l5-glass-surface");
    expect(GLOBALS).toContain(".auth-l5-callout-surface");
    expect(GLOBALS).toContain(".auth-login-l5-card-halo");
    expect(GLOBALS).toContain("backdrop-filter: blur(28px)");
  });

  it("hub uses titleLogin parity, callout surface, grid halo, and AuthL5CrossNavFooter", () => {
    expect(TOKENS).toContain("titleLogin");
    expect(TOKENS).toContain("auth-l5-callout-surface");
    expect(TOKENS).toContain("gridHalo");
    expect(TOKENS).toContain("applySectionTitle");
    expect(PAGE).toContain("AuthL5CrossNavFooter");
    expect(PAGE).toContain("gridHalo");
    expect(PAGE).toContain("MeIdentitiesTravelerCallout");
    expect(TOKENS).toContain("auth-l5-callout-surface");
    expect(TOKENS).toContain("TT_AUTH_L5_FORM.titleLogin");
  });

  it("identity cards keep min 44px CTA and glass vignette", () => {
    expect(TOKENS).toContain("min-h-[44px]");
    expect(TOKENS).toContain("auth-l5-glass-vignette");
  });
});
