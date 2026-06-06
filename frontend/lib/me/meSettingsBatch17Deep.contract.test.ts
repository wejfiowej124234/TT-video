import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ME_SETTINGS_PAGE_TRACKER_V1 } from "@/lib/me/meSettingsPageTracker.v1";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";

const ROOT = process.cwd();

describe("me settings batch 17 deep flows (①)", () => {
  it("FREEZE documents batch 17 closure", () => {
    const freeze = readFileSync(
      join(ROOT, "evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain("**17**");
    expect(freeze).toContain("PLAYWRIGHT_ME_SETTINGS_BATCH17.log");
    expect(freeze).toContain("app/api/v1/me/sessions");
  });

  it("Next.js proxies sessions and security-notifications to API", () => {
    expect(readFileSync(join(ROOT, "app/api/v1/me/sessions/route.ts"), "utf8")).toContain(
      'proxyTraveltrustApi(req, "/api/v1/me/sessions"',
    );
    expect(
      readFileSync(join(ROOT, "app/api/v1/me/sessions/current/route.ts"), "utf8"),
    ).toContain("DELETE");
    expect(
      readFileSync(join(ROOT, "app/api/v1/me/security-notifications/route.ts"), "utf8"),
    ).toContain("security-notifications");
  });

  it("hub nav model has no comingSoon on functional settings hrefs", () => {
    const functionalHrefs = [
      "/me/password",
      "/me/security",
      "/me/settings/privacy",
      "/me/settings/notifications-prefs",
      "/me/settings/data",
      "/me/settings/language",
    ];
    for (const href of functionalHrefs) {
      let found = false;
      for (const section of meSettingsNavSections()) {
        for (const item of section.items) {
          if (item.href === href) {
            found = true;
            expect(item.comingSoon).toBeFalsy();
          }
        }
      }
      expect(found).toBe(true);
    }
    const navSrc = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(navSrc).not.toMatch(/comingSoon:\s*true/);
    const dataTracker = ME_SETTINGS_PAGE_TRACKER_V1.find((e) => e.route === "/me/settings/data");
    expect(dataTracker?.mustContain).toContain("data-tt-me-settings-data-export-done");
  });

  it("security sessions expose suffix revoke marker", () => {
    const sessions = readFileSync(
      join(ROOT, "app/me/security/MeSecuritySessionsSection.tsx"),
      "utf8",
    );
    expect(sessions).toContain("data-tt-me-security-revoke-suffix");
    const hook = readFileSync(join(ROOT, "app/me/security/useMeSecurityPage.ts"), "utf8");
    expect(hook).toContain("deleteMeSessionBySuffix");
    expect(hook).toContain('meSettingsHubHref("sessions")');
  });

  it("smoke scripts include batch 17 vitest and BATCH17 playwright log", () => {
    const meSmoke = readFileSync(
      join(ROOT, "../scripts/dev/smoke-me-settings-local.sh"),
      "utf8",
    );
    expect(meSmoke).toContain("meSettingsBatch17Deep.contract");
    expect(meSmoke).toMatch(/PLAYWRIGHT_ME_SETTINGS_BATCH(?:17|18|19|20)\.log/);
    const fullSmoke = readFileSync(
      join(ROOT, "../scripts/dev/smoke-account-nav-full-local.sh"),
      "utf8",
    );
    expect(fullSmoke).toContain("meSettingsBatch17Deep.contract");
  });

  it("e2e spec covers batch 17 security suffix revoke", () => {
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    const helpers = readFileSync(join(ROOT, "e2e/helpers/meSettingsE2e.ts"), "utf8");
    expect(spec).toContain("security revoke non-current session by suffix");
    expect(helpers).toContain("installMeSessionsTwoDeviceRoute");
    expect(spec).toContain("data export triggers json download");
  });
});
