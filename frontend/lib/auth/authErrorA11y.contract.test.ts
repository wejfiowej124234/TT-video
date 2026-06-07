import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("auth error a11y (RP-012 · login/register)", () => {
  it("AuthL5FormError exposes assertive live region", () => {
    const src = read("components/auth/AuthL5FormError.tsx");
    expect(src).toContain('role="alert"');
    expect(src).toContain('aria-live="assertive"');
    expect(src).toContain('aria-atomic="true"');
  });

  it("login page uses AuthL5FormError for submit failures", () => {
    const src = read("app/auth/login/page.tsx");
    expect(src).toContain("AuthL5FormError");
    expect(src).toContain('surface="login_form_error"');
  });

  it("register forms use AuthL5FormError for submit failures", () => {
    const tourist = read("app/auth/register/RegisterTouristForm.tsx");
    const guide = read("app/auth/register/RegisterGuideForm.tsx");
    expect(tourist).toContain("AuthL5FormError");
    expect(guide).toContain("AuthL5FormError");
    expect(tourist).toContain('surface="register_form_error"');
    expect(guide).toContain('surface="register_form_error"');
  });
});
