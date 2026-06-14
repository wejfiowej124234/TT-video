import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { meSettingsNavExtensionHref } from "@/lib/me/meSettingsExtensionContext";

const ROOT = process.cwd();

describe("me settings trust extension (①)", () => {
  it("trust center href from settings hub", () => {
    expect(meSettingsNavExtensionHref("/trust")).toBe("/trust?from=settings");
  });

  it("trust page wires settings ingress", () => {
    const page = readFileSync(join(ROOT, "app/trust/page.tsx"), "utf8");
    const hub = readFileSync(join(ROOT, "components/trust/TrustTransparencyHub.tsx"), "utf8");
    expect(page).toContain("data-tt-trust-from-settings");
    expect(hub).toContain("fromSettings");
    expect(hub).toContain("data-tt-trust-hub-from-settings");
  });

  it("settings trust subpage uses progress checklist", () => {
    const trust = readFileSync(join(ROOT, "app/me/settings/trust/page.tsx"), "utf8");
    expect(trust).toContain("MeSettingsTrustProgressPanel");
    expect(trust).toContain("me_settings_trust_subtitle_email_pending");
    expect(trust).not.toContain('href="/me/settings"');
  });

  it("community profile from settings uses profile subpage (not legacy hub)", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/profile/MeSettingsProfilePageInner.tsx"), "utf8");
    const back = readFileSync(join(ROOT, "components/me/CommunityMeSettingsBackLink.tsx"), "utf8");
    expect(page).toContain("MeSettingsHubBackLink");
    expect(page).toContain("MeSettingsProfilePanel");
    expect(back).toContain("ME_SETTINGS_HUB_PATH");
  });
});
