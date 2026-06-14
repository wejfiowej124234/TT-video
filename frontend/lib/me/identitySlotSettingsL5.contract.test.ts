import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "./identitySlotSettingsL5";
import { TT_WORKSPACE_L5 } from "../workspace/workspaceWorkbenchL5";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("identitySlotSettingsL5 (① · settings-linked identity profile shell)", () => {
  it("reuses workspace header tokens and meSettings section card family", () => {
    expect(TT_IDENTITY_SLOT_SETTINGS_L5.headerCard).toBe(TT_WORKSPACE_L5.headerCard);
    expect(TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard).toContain("rounded-xl");
  });

  it("IdentitySlotSettingsShell uses glass header + hub back link", () => {
    const shell = read("components/me/identitySettings/IdentitySlotSettingsShell.tsx");
    expect(shell).toContain("IdentitySlotSettingsShell");
    expect(shell).toContain("TT_IDENTITY_SLOT_SETTINGS_L5.headerCard");
    expect(shell).toContain("ME_IDENTITIES_HUB_PATH");
    expect(shell).toContain("MeSettingsL5FlowPage");
  });

  it("merchant settings page wires shell + L5 section cards", () => {
    const page = read("app/me/identities/merchant/settings/MeMerchantProfileSettingsPageInner.tsx");
    expect(page).toContain("IdentitySlotSettingsShell");
    expect(page).toContain("TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard");
    expect(page).toContain("IdentitySlotProfileImageField");
    expect(page).not.toContain('type="url"');
    expect(page).not.toContain("me_merchant_profile_avatar_url");
  });
});
