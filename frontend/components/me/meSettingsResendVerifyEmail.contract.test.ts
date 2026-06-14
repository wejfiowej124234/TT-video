import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd());

describe("MeSettingsResendVerifyEmailPanel · ① contract", () => {
  it("gates dev token copy behind development env check", () => {
    const src = readFileSync(join(root, "components/me/MeSettingsResendVerifyEmailPanel.tsx"), "utf8");
    expect(src).toContain("showVerifyEmailDevHints");
    expect(src).toContain("me_settings_verify_resend_hint_dev");
    expect(src).not.toMatch(/me_settings_verify_resend_hint[\s\S]{0,120}本地开发/);
  });
});
