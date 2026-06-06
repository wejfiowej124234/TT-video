import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");

const appAdmin = join(fe, "app", "admin");



const CONFIG_PAGES: { file: string; key: string }[] = [

  { file: "config/AdminConfigHubPageMain.tsx", key: "admin_config_hub_subtitle_l5" },

  { file: "config/releases/AdminConfigReleasesPageMain.tsx", key: "admin_config_releases_subtitle_l5" },

  { file: "flags/AdminFlagsPageMain.tsx", key: "admin_flags_subtitle_l5" },

  { file: "policies/AdminPoliciesPageMain.tsx", key: "admin_policies_subtitle_l5" },

  { file: "permissions/AdminPermissionsPageMain.tsx", key: "admin_permissions_subtitle_l5" },

  { file: "onboarding/AdminOnboardingHubPageMain.tsx", key: "admin_onboarding_hub_subtitle_l5" },

];



/** ① 第三十三批 UX · 配置/权限/入驻枢纽 subtitle 产品化。 */

describe("admin batch33 UX L5 (①)", () => {

  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");

  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");



  it("defines paired config hub _subtitle_l5 keys", () => {

    for (const { key } of CONFIG_PAGES) {

      expect(zh).toContain(key);

      expect(en).toContain(key);

    }

  });



  it("config hub PageMain chrome uses _subtitle_l5", () => {

    for (const { file, key } of CONFIG_PAGES) {

      const src = readFileSync(join(appAdmin, file), "utf8");

      expect(src).toContain(key);

    }

  });

});


