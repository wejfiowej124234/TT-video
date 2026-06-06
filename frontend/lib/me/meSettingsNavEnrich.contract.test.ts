import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { meSettingsRowDescription } from "@/lib/me/meSettingsNavEnrich";
import type { MeSettingsNavItem } from "@/lib/me/meSettingsNavModel";

const ROOT = process.cwd();

describe("meSettingsNavEnrich", () => {
  it("overrides security and wallet desc from hub status", () => {    const t = (key: string, vars?: Record<string, string | number>) =>
      vars ? `${key}:${vars.n ?? ""}` : key;

    const security: MeSettingsNavItem = {
      id: "security",
      iconId: "shield",
      labelKey: "x",
      descKey: "me_settings_desc_security",
      href: "/me/security",
    };
    expect(
      meSettingsRowDescription(security, t, {
        loading: false,
        activeSessionCount: 2,
        walletVerified: null,
      }),
    ).toContain("me_settings_desc_security_live:2");

    const wallet: MeSettingsNavItem = {
      id: "wallet",
      iconId: "wallet",
      labelKey: "x",
      descKey: "me_settings_desc_wallet_verify",
      href: "/me/security",
    };
    expect(
      meSettingsRowDescription(wallet, t, {
        loading: false,
        activeSessionCount: null,
        walletVerified: false,
      }),
    ).toBe("me_settings_desc_wallet_pending_row");
  });

  it("nav model links legal/help via settings extension href (same-tab L5)", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSettingsNavExtensionHref("/privacy")');
    expect(nav).toContain('meSettingsNavExtensionHref("/help")');
    expect(nav).toContain('meSettingsNavExtensionHref("/trust")');
    expect(nav).not.toMatch(/id: "privacy"[\s\S]*external: true/);
    expect(nav).toContain('href: "/me/settings/data"');
  });

  it("row component opens external links in new tab", () => {
    const row = readFileSync(join(ROOT, "components/me/MeSettingsL5Row.tsx"), "utf8");
    expect(row).toContain('target: "_blank"');
    expect(row).toContain("noopener noreferrer");
  });
});
