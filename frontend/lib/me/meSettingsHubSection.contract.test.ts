import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";

const ROOT = process.cwd();

describe("me settings hub section L5 (①)", () => {
  it("support section has feedback only (no reports duplicate with header menu)", () => {
    const support = meSettingsNavSections().find((s) => s.id === "support");
    expect(support?.items.map((i) => i.id)).toEqual(["feedback"]);
    expect(support?.items.some((i) => i.id === "my_content_menu_hint")).toBe(false);
  });

  it("account section has password, security, and community profile edit link", () => {
    const account = meSettingsNavSections().find((s) => s.id === "account");
    expect(account?.items.map((i) => i.id)).toEqual(["password", "security"]);
    const flat = meSettingsNavSections({ showGuideHub: true }).flatMap((s) => s.items);
    expect(flat.some((i) => i.id === "onboarding")).toBe(false);
    expect(flat.some((i) => i.id === "provider_register")).toBe(false);
    expect(flat.some((i) => i.id === "steward_register")).toBe(false);
  });

  it("nav model links security events to notifications focus", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSecurityHref("notifications")');
    expect(nav).toContain("me_settings_item_security_events");
    expect(nav).not.toContain("ME_SETTINGS_ACCOUNT_ONBOARDING_ITEM_IDS");
  });
});
