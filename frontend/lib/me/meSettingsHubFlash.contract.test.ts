import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ME_SETTINGS_FLASH_VALUES,
  meSettingsFlashMessageKey,
  meSettingsHubHref,
  parseMeSettingsFlash,
} from "@/lib/me/meSettingsHubFlash";

const ROOT = process.cwd();

describe("me settings hub flash (①)", () => {
  it("parses wallet and sessions flash query values only", () => {
    expect(ME_SETTINGS_FLASH_VALUES).toEqual(["wallet", "sessions"]);
    expect(parseMeSettingsFlash("wallet")).toBe("wallet");
    expect(parseMeSettingsFlash("sessions")).toBe("sessions");
    expect(parseMeSettingsFlash("bogus")).toBeNull();
    expect(parseMeSettingsFlash(null)).toBeNull();
  });

  it("builds hub href with flash query", () => {
    expect(meSettingsHubHref()).toBe("/me/settings");
    expect(meSettingsHubHref("wallet")).toBe("/me/settings?flash=wallet");
    expect(meSettingsHubHref("sessions")).toBe("/me/settings?flash=sessions");
  });

  it("maps flash keys to i18n message keys", () => {
    expect(meSettingsFlashMessageKey("wallet")).toBe("me_settings_flash_wallet_verified");
    expect(meSettingsFlashMessageKey("sessions")).toBe("me_settings_flash_sessions_updated");
  });

  it("hub inner renders flash banner with machine-read marker", () => {
    const inner = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");
    const banner = readFileSync(join(ROOT, "components/me/MeSettingsHubFlashBanner.tsx"), "utf8");
    const hook = readFileSync(join(ROOT, "lib/me/useMeSettingsHubFlash.ts"), "utf8");
    expect(inner).toContain("useMeSettingsHubFlash");
    expect(inner).toContain("MeSettingsHubFlashBanner");
    expect(banner).toContain('data-tt-me-settings-flash-banner="1"');
    expect(hook).toContain("router.replace");
    expect(hook).toContain("ME_SETTINGS_HUB_PATH");
  });

  it("wallet verify section links back with wallet flash", () => {
    const wallet = readFileSync(join(ROOT, "app/me/security/MeSecurityWalletVerifySection.tsx"), "utf8");
    expect(wallet).toContain('meSettingsHubHref("wallet")');
  });

  it("security session revoke success navigates with sessions flash", () => {
    const security = readFileSync(join(ROOT, "app/me/security/useMeSecurityPage.ts"), "utf8");
    expect(security).toContain('meSettingsHubHref("sessions")');
    expect(security).toContain("router.push");
  });
});
