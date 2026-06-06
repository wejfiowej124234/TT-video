import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ME_SETTINGS_PAGE_TRACKER_V1 } from "@/lib/me/meSettingsPageTracker.v1";

const ROOT = process.cwd();
const E2E_REL = "e2e/me-settings-l5-hub.spec.ts";
const PROFILE_E2E_REL = "e2e/me-settings-profile-l5.spec.ts";

function readSpec(route: string): string {
  if (route === "/me/settings/profile") {
    return readFileSync(join(ROOT, PROFILE_E2E_REL), "utf8");
  }
  return readFileSync(join(ROOT, E2E_REL), "utf8");
}

/** ① Playwright 须覆盖的设置族路由（错误边界仅 Vitest · 不测故意抛错页） */
const E2E_PATH_ALIASES: Record<string, readonly string[]> = {
  "/disputes/[id]": ["/disputes/${placeholderId}", 'data-tt-me-settings-route="disputes-detail"'],
};

const E2E_SKIP_ROUTES = new Set(["/me/settings/error"]);

/** 批次 18–19 安全/Hub 深链流（非 tracker 路由字面量） */
const BATCH_18_19_SECURITY_FLOWS = [
  "hub account security row deep-links",
  "hub security events nav row deep-links",
  "hub wallet nav row deep-links",
  "security focus=sessions scrolls sessions panel into view",
  "security notifications expand and export json",
  "security notifications filter by delivery_status sent",
  "security notifications filter by event_type password_changed",
  "loginTouristDualSessionViaBrowser",
  "sessionCount - 1",
] as const;

describe("me settings extension Playwright coverage (①)", () => {
  it("me-settings-l5-hub.spec.ts visits every tracker route (except error boundary)", () => {
    const spec = readFileSync(join(ROOT, E2E_REL), "utf8");
    const missing: string[] = [];

    for (const entry of ME_SETTINGS_PAGE_TRACKER_V1) {
      if (E2E_SKIP_ROUTES.has(entry.route)) continue;
      const spec = readSpec(entry.route);
      const needles = E2E_PATH_ALIASES[entry.route] ?? [entry.route];
      if (!needles.some((n) => spec.includes(n))) {
        missing.push(entry.route);
      }
    }

    expect(missing, `add Playwright goto for: ${missing.join(", ")}`).toEqual([]);
  });

  it("profile L5 spec uses shared session helper", () => {
    const spec = readFileSync(join(ROOT, PROFILE_E2E_REL), "utf8");
    expect(spec).toContain("gotoWithMeSettingsSessionReady");
    expect(spec).toContain("/me/settings/profile");
  });

  it("spec covers batch 18–19 security hub flows", () => {
    const spec = readFileSync(join(ROOT, E2E_REL), "utf8");
    const missing = BATCH_18_19_SECURITY_FLOWS.filter((f) => !spec.includes(f));
    expect(missing, `add Playwright flow: ${missing.join(", ")}`).toEqual([]);
  });
});
