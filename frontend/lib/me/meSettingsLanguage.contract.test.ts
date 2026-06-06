import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings language page (L5 · LocaleProvider)", () => {
  it("picker uses setLocale and LOCALES", () => {
    const picker = readFileSync(join(ROOT, "components/me/MeSettingsLanguagePicker.tsx"), "utf8");
    expect(picker).toContain("setLocale");
    expect(picker).toContain("LOCALES");
    expect(picker).toContain("data-tt-me-settings-language-picker");
  });

  it("language route uses settings flow shell and hub back link", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/language/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsL5FlowPage");
    expect(page).toContain("MeSettingsHubBackLink");
    expect(page).toContain('route="settings-language"');
  });
});
