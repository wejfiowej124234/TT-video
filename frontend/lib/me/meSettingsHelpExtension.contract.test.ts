import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";
const ROOT = process.cwd();

describe("me settings help extension (①)", () => {
  it("parses settings query for help and disputes", () => {
    expect(isMeSettingsExtensionFromQuery("settings")).toBe(true);
    expect(isMeSettingsExtensionFromQuery("settings-data")).toBe(true);
    expect(isMeSettingsExtensionFromQuery(null)).toBe(false);
  });

  it("help page wires L5 document shell and marker", () => {
    const page = readFileSync(join(ROOT, "app/help/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsExtensionDocumentShell");
    expect(page).toContain("data-tt-help-from-settings");
    expect(page).toContain("isMeSettingsExtensionFromQuery");
    expect(page).toContain("me_settings_help_from_settings_notice");
  });

  it("hub nav links help and disputes with from=settings", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSettingsNavExtensionHref("/help")');
    expect(nav).toContain('meSettingsNavExtensionHref("/disputes")');
  });

  it("hub nav links trust center with from=settings", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSettingsNavExtensionHref("/trust")');
    expect(nav).not.toContain("kyc_status");
  });
  it("disputes L5 shell marks from=settings in URL", () => {
    const shell = readFileSync(join(ROOT, "components/disputes/DisputesL5PageShell.tsx"), "utf8");
    expect(shell).toContain("data-tt-disputes-from-settings");
    expect(shell).toContain("isMeSettingsExtensionFromQuery");
  });
});
