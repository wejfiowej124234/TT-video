import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings verify-email extension (①)", () => {
  it("verify-email from=settings uses settings L5 shell and resend panel", () => {
    const page = readFileSync(join(ROOT, "app/auth/verify-email/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsL5FlowPage");
    expect(page).toContain('data-tt-me-settings-route": "verify-email"');
    expect(page).toContain("MeSettingsResendVerifyEmailPanel");
    expect(page).not.toContain("window.confirm");
  });

  it("resend API client targets /auth/resend-verification-email", () => {
    const api = readFileSync(join(ROOT, "lib/me/meSettingsVerifyEmailApi.ts"), "utf8");
    expect(api).toContain("postResendVerificationEmail");
    const http = readFileSync(join(ROOT, "lib/apiClient/auth/http.ts"), "utf8");
    expect(http).toContain("resendVerificationEmail");
  });

  it("trust page shows resend panel when email unverified", () => {
    const trust = readFileSync(join(ROOT, "app/me/settings/trust/page.tsx"), "utf8");
    expect(trust).toContain("MeSettingsResendVerifyEmailPanel");
    expect(trust).toContain("!emailOk");
  });
});
