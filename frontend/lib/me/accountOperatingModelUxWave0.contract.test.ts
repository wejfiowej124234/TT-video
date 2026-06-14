import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  ACCOUNT_OPERATING_MODEL_UX_WAVE0_ACTIVE,
  ACCOUNT_OPERATING_MODEL_UX_WAVE0_FINDINGS,
  ACCOUNT_OPERATING_MODEL_UX_WAVE0_MARKER,
  ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE,
  ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE_DOC,
  ACCOUNT_UX_BOUNDARY_COPY_I18N_KEYS,
  ACCOUNT_UX_BOUNDARY_ZH_ANCHORS,
  ME_IDENTITIES_HUB_P2_3_PROBE_ATTRS,
  ME_SETTINGS_TRAVEL_SECTION_HINT_KEY,
  ME_SETTINGS_WORKBENCH_SECONDARY_DESC_KEYS,
  ME_SETTINGS_WORKBENCH_SHORTCUT_ITEM_IDS,
  PUBLISH_HUB_SINGLE_IDENTITY_FILTER_DATA_ATTR,
  PUBLISH_HUB_SINGLE_IDENTITY_FILTER_HINT_KEY,
} from "@/lib/me/accountOperatingModelUxWave0Model";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";

const ROOT = process.cwd();

describe("account operating model UX wave0 (100/100 · ①)", () => {
  const scoreDoc = readFileSync(join(ROOT, ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE_DOC), "utf8");
  const publishMain = readFileSync(join(ROOT, "app/me/publish/PublishHubPageMain.tsx"), "utf8");
  const navModel = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
  const identitiesPage = readFileSync(join(ROOT, "app/me/identities/page.tsx"), "utf8");

  it("score SSOT declares ACTIVE 100", () => {
    expect(ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE).toBe(100);
    expect(ACCOUNT_OPERATING_MODEL_UX_WAVE0_ACTIVE).toBe(true);
    expect(ACCOUNT_OPERATING_MODEL_UX_WAVE0_MARKER).toBe("account-operating-model-ux-wave0-20260613");
    expect(scoreDoc).toContain("100 / 100");
    expect(scoreDoc).toContain("Wave 0");
  });

  it("W0-1 boundary copy keys exist in zh/en", () => {
    for (const key of ACCOUNT_UX_BOUNDARY_COPY_I18N_KEYS) {
      expect(zh[key as keyof typeof zh], key).toBeTruthy();
      expect(en[key as keyof typeof en], key).toBeTruthy();
    }
    for (const { key, mustContain } of ACCOUNT_UX_BOUNDARY_ZH_ANCHORS) {
      const text = String(zh[key as keyof typeof zh]);
      for (const anchor of mustContain) {
        expect(text, `${key} missing ${anchor}`).toContain(anchor);
      }
    }
    expect(publishMain).toContain("publish_hub_operating_context");
  });

  it("W0-2 settings workbench shortcuts demoted to secondary copy", () => {
    expect(navModel).toContain("ME_SETTINGS_WORKBENCH_SHORTCUT_ITEM_IDS");
    for (const id of ME_SETTINGS_WORKBENCH_SHORTCUT_ITEM_IDS) {
      expect(navModel).toContain(`id: "${id}"`);
    }
    for (const key of ME_SETTINGS_WORKBENCH_SECONDARY_DESC_KEYS) {
      expect(String(zh[key as keyof typeof zh])).toContain("多重身份");
      expect(String(en[key as keyof typeof en])).toMatch(/Multiple roles/i);
    }
    expect(String(zh[ME_SETTINGS_TRAVEL_SECTION_HINT_KEY as keyof typeof zh])).toContain("多重身份");
    const travel = meSettingsNavSections({
      showGuideHub: true,
      showMerchantHub: true,
    }).find((s) => s.id === "travel");
    expect(travel?.items.some((i) => i.id === "publish_hub")).toBe(true);
  });

  it("W0-3 Hub P2-3 blocked_reason wired", () => {
    expect(identitiesPage).toContain("useMeIdentityHubBlockedReasons");
    for (const attr of ME_IDENTITIES_HUB_P2_3_PROBE_ATTRS) {
      expect(readFileSync(join(ROOT, "components/me/MeIdentitiesL5IdentityCard.tsx"), "utf8")).toContain(attr);
    }
  });

  it("W0-4 single-slot auto filter hint on publish hub", () => {
    expect(publishMain).toContain("publishHubDefaultFilterFromUnlockedSlots");
    expect(publishMain).toContain("PUBLISH_HUB_SINGLE_IDENTITY_FILTER_HINT_KEY");
    expect(publishMain).toContain("PUBLISH_HUB_SINGLE_IDENTITY_FILTER_DATA_ATTR");
  });

  it("Wave0 findings closed; Wave1+ deferred to ②", () => {
    const closed = ACCOUNT_OPERATING_MODEL_UX_WAVE0_FINDINGS.filter((f) => f.status === "closed");
    expect(closed.map((f) => f.id)).toEqual(["W0-1", "W0-2", "W0-3", "W0-4"]);
    expect(
      ACCOUNT_OPERATING_MODEL_UX_WAVE0_FINDINGS.filter((f) => f.status === "deferred").every((f) => f.phase === "②"),
    ).toBe(true);
    expect(scoreDoc).toContain("ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE");
  });
});
