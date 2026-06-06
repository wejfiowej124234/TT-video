import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TT_AUTH_LOGIN_L5, TT_AUTH_LOGIN_TITLE_GRADIENT } from "@/lib/auth/loginL5";

const LOGIN_DIR = join(process.cwd(), "app", "auth", "login");

function readLoginSources(): string {
  const loginDir = ["page.tsx", "LoginRouteLoading.tsx", "loading.tsx"].map((f) =>
    readFileSync(join(LOGIN_DIR, f), "utf8"),
  );
  const shared = [
    "AuthL5PageBackdrop.tsx",
    "AuthL5CrossNavFooter.tsx",
    "AuthL5Card.tsx",
    "AuthL5Checkbox.tsx",
  ].map((f) => readFileSync(join(process.cwd(), "components", "auth", f), "utf8"));
  return [...loginDir, ...shared].join("\n");
}

describe("/auth/login L5 (contract)", () => {
  const src = readLoginSources();

  it("exports TT_AUTH_LOGIN_L5 with warm glass card + gradient CTA", () => {
    expect(TT_AUTH_LOGIN_L5.card).toContain("border-ref-sun");
    expect(TT_AUTH_LOGIN_L5.card).toContain("auth-l5-glass-surface");
    expect(readFileSync(join(process.cwd(), "app", "globals.css"), "utf8")).toContain(".auth-l5-field-control");
    expect(TT_AUTH_LOGIN_L5.card).toContain("backdrop-blur");
    expect(TT_AUTH_LOGIN_L5.primaryCta).toMatch(/ref-sun|gradient/);
    expect(TT_AUTH_LOGIN_TITLE_GRADIENT).toContain("gradient-to-b");
    expect(TT_AUTH_LOGIN_L5.title).toContain(TT_AUTH_LOGIN_TITLE_GRADIENT);
    expect(TT_AUTH_LOGIN_L5.cardHalo).toContain("auth-login-l5-card-halo");
  });

  it("uses auth-login-l5 CSS backdrop (no register photo, no cyan silhouette)", () => {
    expect(src).toContain("AuthL5PageBackdrop");
    expect(src).toContain("bg-auth-login-l5-atmosphere");
    expect(src).not.toContain("MarketDarkRouteSceneDecor");
    expect(src).not.toContain("REGISTER_BG_SRC");
    expect(src).not.toContain("bg-ref-silhouette-vignette");
  });

  it("marks route as L5 visual without internal API paths", () => {
    expect(src).toContain('data-tt-auth-visual="l5"');
    expect(readFileSync(join(LOGIN_DIR, "page.tsx"), "utf8")).toContain(
      'data-tt-auth-login-ui-frozen="1"',
    );
    expect(src).toContain("TT_AUTH_LOGIN_L5");
    expect(src).not.toMatch(/\/api\/v1\/internal\//);
  });

  it("keeps auth form anchors and a11y hooks", () => {
    expect(src).toContain('data-tt-auth-login-submit="1"');
    expect(src).toContain("aria-invalid");
    expect(src).toContain('role="alert"');
    expect(src).toContain("min-h-[44px]");
    expect(src).toContain("passwordVisible");
    expect(src).toContain("AuthL5CrossNavFooter");
    expect(src).toContain("primaryCtaSpinner");
    expect(src).toContain("LoginPasswordVisibilityToggle");
    expect(src).toContain("AuthL5Checkbox");
    expect(src).toContain("AuthL5Card");
    expect(src).toContain("TT_AUTH_L5_FORM");
    expect(src).toContain("AUTH_LOGIN_REMEMBER_EMAIL_KEY");
    expect(src).not.toContain('type="checkbox"');
    expect(src).toContain('data-tt-auth-surface="login_site_cross_nav"');
    expect(src).toContain("pageColumn");
    expect(src).toContain("formSection");
    expect(readFileSync(join(LOGIN_DIR, "page.tsx"), "utf8")).not.toContain("auth_login_web3Travel");
  });

  it("uses warm field focus glow (not console ring-offset)", () => {
    expect(TT_AUTH_LOGIN_L5.fieldFocus).toContain("ref-sun");
    expect(TT_AUTH_LOGIN_L5.fieldFocus).not.toContain("ring-offset-bg-console");
    expect(TT_AUTH_LOGIN_L5.card).not.toContain("ring-inset");
  });

  it("does not use marketDark cyan chrome in login route sources", () => {
    expect(src).not.toMatch(/ref-cyan|border-cyan-|bg-cyan-/);
  });
});
