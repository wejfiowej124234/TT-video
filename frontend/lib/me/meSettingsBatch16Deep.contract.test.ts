import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ME_SETTINGS_PAGE_TRACKER_V1 } from "@/lib/me/meSettingsPageTracker.v1";

const ROOT = process.cwd();

describe("me settings batch 16 deep flows (①)", () => {
  it("FREEZE documents batch 15–16 closure", () => {
    const freeze = readFileSync(
      join(ROOT, "evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain("**15**");
    expect(freeze).toContain("**16**");
    expect(freeze).toContain("PLAYWRIGHT_ME_SETTINGS_BATCH16.log");
  });

  it("security sessions expose revoke-current marker and L5 confirm", () => {
    const sessions = readFileSync(
      join(ROOT, "app/me/security/MeSecuritySessionsSection.tsx"),
      "utf8",
    );
    const hook = readFileSync(join(ROOT, "app/me/security/useMeSecurityPage.ts"), "utf8");
    expect(sessions).toContain("data-tt-me-security-revoke-current");
    expect(hook).toContain("useMeSettingsL5Confirm");
    expect(hook).toContain("deleteMeSessionCurrent");
  });

  it("hub nav rows avoid comingSoon on functional settings routes", () => {
    const row = readFileSync(join(ROOT, "components/me/MeSettingsL5Row.tsx"), "utf8");
    expect(row).toContain("badgeSoon");
    expect(row).toContain("comingSoon");
    const notif = ME_SETTINGS_PAGE_TRACKER_V1.find((e) => e.route === "/me/settings/notifications-prefs");
    const privacy = ME_SETTINGS_PAGE_TRACKER_V1.find((e) => e.route === "/me/settings/privacy");
    expect(notif?.mustNotContain).toContain("comingSoon: true");
    expect(privacy?.mustNotContain ?? []).not.toContain("comingSoon: true");
    expect(privacy?.mustContain).toContain("MeSettingsCommunityVisibilitySection");
  });

  it("account-nav full smoke script includes batch 16 vitest", () => {
    const smoke = readFileSync(
      join(ROOT, "../scripts/dev/smoke-account-nav-full-local.sh"),
      "utf8",
    );
    expect(smoke).toContain("meSettingsBatch16Deep.contract");
    expect(smoke).toContain("meSettingsBatch15Deep.contract");
    expect(smoke).toMatch(/PLAYWRIGHT_ME_SETTINGS_BATCH(?:16|17|18|19|20)\.log/);
  });

  it("e2e spec covers batch 16 flows", () => {
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    const helpers = readFileSync(join(ROOT, "e2e/helpers/meSettingsE2e.ts"), "utf8");
    expect(spec).toContain("security revoke current session uses L5 confirm");
    expect(spec).toContain("disputes empty list from settings shows empty state");
    expect(helpers).toContain("installEmptyDisputesListRoute");
    expect(helpers).toContain("installMeSessionsRevokeRoute");
  });
});
