import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_NAV_HEADER_PAGE_TRACKER_V1,
  ME_SETTINGS_PAGE_TRACKER_V1,
} from "@/lib/me/meSettingsPageTracker.v1";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";

const ROOT = process.cwd();

function readFrontend(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function assertTrackerEntry(entry: { route: string; sourceFiles: readonly string[]; mustContain: readonly string[]; mustNotContain?: readonly string[] }) {
  const combined = entry.sourceFiles.map((rel) => readFrontend(rel)).join("\n");
  for (const needle of entry.mustContain) {
    expect(combined, `${entry.route} missing: ${needle}`).toContain(needle);
  }
  for (const rel of entry.sourceFiles) {
    for (const banned of entry.mustNotContain ?? []) {
      expect(readFrontend(rel), `${rel} must not contain: ${banned}`).not.toContain(banned);
    }
  }
}

describe("me settings page tracker v1 (① · 逐页满分闸)", () => {
  it.each(ME_SETTINGS_PAGE_TRACKER_V1.map((e) => [e.route, e] as const))(
    "settings family %s passes L5 markers",
    (_route, entry) => {
      assertTrackerEntry(entry);
    },
  );

  it.each(ACCOUNT_NAV_HEADER_PAGE_TRACKER_V1.map((e) => [e.route, e] as const))(
    "header nav %s wired in model",
    (_route, entry) => {
      assertTrackerEntry(entry);
    },
  );

  it("me-settings-l5-local-gate.v1.json lists same routes as tracker", () => {
    const gate = JSON.parse(
      readFileSync(join(ROOT, "evidence/GO_local_auth_l5/me-settings-l5-local-gate.v1.json"), "utf8"),
    ) as { routes: { path: string }[] };
    const trackerPaths = ME_SETTINGS_PAGE_TRACKER_V1.map((e) => e.route);
    expect(gate.routes.map((r) => r.path)).toEqual(trackerPaths);
  });

  it("hub nav model has no duplicate hrefs vs header primary routes", () => {
    const flat = meSettingsNavSections().flatMap((s) => s.items);
    const dupHrefs = [
      "/orders",
      "/me/settings/profile",
      "/community/me/posts",
      "/community/me/collects",
      "/community/me/likes",
      "/community/me/reports",
      "/me/identities",
    ];
    for (const href of dupHrefs) {
      expect(flat.some((i) => i.href === href), `hub must not duplicate ${href}`).toBe(false);
    }
  });

  it("ME-SETTINGS-L5-FREEZE doc syncs with code SSOT (2026-06-02 closure)", () => {
    const doc = readFileSync(join(ROOT, "evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md"), "utf8");
    expect(doc).toContain("2026-06-02");
    expect(doc).toContain("meSettingsNavModel.ts");
    expect(doc).toContain("MeSettingsPageInner.tsx");
    expect(doc).toContain("MeSettingsProfileCard");
    expect(doc).toContain("MeSettingsHubStatusStrip");
    for (const sectionId of ["account", "travel", "support", "privacy", "general"]) {
      expect(doc).toContain(sectionId);
    }
  });

  it("HEADER-UTILITY-MENU-L5-FREEZE doc syncs with nav model SSOT", () => {
    const doc = readFileSync(join(ROOT, "evidence/GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md"), "utf8");
    expect(doc).toContain("headerUserMenuNavModel.ts");
    expect(doc).toContain("header_userMenu_section_mine");
    expect(doc).toContain("/community/me/reports");
    expect(doc).toContain("MeSettingsL5ConfirmDialog");
  });
});
