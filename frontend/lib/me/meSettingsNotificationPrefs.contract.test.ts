import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  patchMeSettingsUserPreferences,
  readMeSettingsUserPreferences,
} from "@/lib/me/meSettingsPreferencesStorage";

const ROOT = process.cwd();

describe("me settings notification prefs storage (①)", () => {
  it("page wires user-scoped preferences and toggle rows", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/notifications-prefs/page.tsx"), "utf8");
    expect(page).toContain("useMeSettingsUserPreferences");
    expect(page).toContain("meSettingsUserId");
    expect(page).toContain("data-tt-me-settings-notif-prefs");
  });

  it("patchMeSettingsUserPreferences merges per userId", () => {
    const next = patchMeSettingsUserPreferences("user-test-1", { notification: { push: true } });
    expect(next.notification.push).toBe(true);
    const reread = readMeSettingsUserPreferences("user-test-1");
    expect(reread.notification.push).toBe(true);
  });
});
