import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  GUIDE_WORKBENCH_L5_BANNED_COPY,
  GUIDE_WORKBENCH_L5_CLOSURE_FINDINGS,
  GUIDE_WORKBENCH_L5_LOCALE_KEYS,
  GUIDE_WORKBENCH_L5_OPEN_P0,
  GUIDE_WORKBENCH_L5_OPEN_P1,
  GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
  GUIDE_WORKBENCH_PAGE_L5_UI_FROZEN,
} from "./guideWorkbenchL5ClosureSprintModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Guide workbench L5 full closure (① local · frozen)", () => {
  it("freeze doc is ACTIVE and P0/P1 closed", () => {
    const freeze = read("evidence/GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md");
    expect(freeze).toContain("冻结结论（ACTIVE）");
    expect(GUIDE_WORKBENCH_PAGE_L5_UI_FROZEN).toBe(true);
    expect(GUIDE_WORKBENCH_L5_OPEN_P0).toHaveLength(0);
    expect(GUIDE_WORKBENCH_L5_OPEN_P1).toHaveLength(0);
    expect(GUIDE_WORKBENCH_L5_CLOSURE_FINDINGS.filter((f) => f.status === "open")).toHaveLength(0);
  });

  it("locale keys exist and avoid banned copy", () => {
    for (const key of GUIDE_WORKBENCH_L5_LOCALE_KEYS) {
      const zhVal = (zh as Record<string, string>)[key];
      const enVal = (en as Record<string, string>)[key];
      expect(zhVal, `zh:${key}`).toBeTruthy();
      expect(enVal, `en:${key}`).toBeTruthy();
      expect(zhVal).not.toMatch(GUIDE_WORKBENCH_L5_BANNED_COPY);
      expect(enVal).not.toMatch(GUIDE_WORKBENCH_L5_BANNED_COPY);
    }
  });

  it("/guide page wires ops-only L5 sections (admission on Trust)", () => {
    const page = read("app/guide/page.tsx");
    expect(page).toContain("GuideWorkbenchMarketExposureCard");
    expect(page).toContain("GuideWorkbenchStatsTeaser");
    expect(page).toContain("resolveGuideWorkbenchHeaderSubtitleKey");
    expect(page).toContain("shouldShowGuideWorkbenchPesConversion");
    expect(page).toContain("GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE");
    expect(page).toContain("GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER");
    expect(page).not.toContain("GuideWorkbenchGateProgressCard");
    expect(page).not.toContain("resolveGuideWorkbenchGateProgress");

    const inboxIdx = page.indexOf("<GuideWorkbenchInboxCard");
    const marketIdx = page.indexOf("<GuideWorkbenchMarketExposureCard");
    const statsIdx = page.indexOf("<GuideDashboardStats");
    expect(inboxIdx).toBeGreaterThan(0);
    expect(marketIdx).toBeGreaterThan(inboxIdx);
    if (statsIdx > 0) expect(statsIdx).toBeGreaterThan(marketIdx);
    expect(read("components/guide/GuideWorkbenchInboxCard.tsx")).not.toContain(
      "GuideWorkbenchTrustAdmissionLink",
    );
    expect(read("components/guide/GuideWorkbenchStakingGateCard.tsx")).toContain(
      "GuideWorkbenchTrustAdmissionLink",
    );
  });

  it("market exposure card merges profile preview + availability", () => {
    const card = read("components/guide/GuideWorkbenchMarketExposureCard.tsx");
    expect(card).toContain("guideProfileMissingPublicTitle");
    expect(card).toContain('data-tt-guide-workbench-profile-public-title-hint="1"');
    expect(card).toContain("guide_workbench_profile_public_title_hint");
    expect(card).toContain("guideProfileSettingsHrefFromWorkbench");
    expect(card).toContain('data-tt-guide-workbench-market-exposure="1"');
    expect(card).toContain('data-tt-guide-workbench-availability="1"');
    expect(card).toContain("#guide-availability");
    expect(card).toContain("GUIDE_WORKBENCH_MARKET_EXPOSURE_ANCHOR");
  });

  it("admission checklist SSOT lives on Trust progress model", () => {
    const model = read("lib/me/meSettingsTrustProgressModel.ts");
    expect(model).toContain("guide_registration");
    expect(model).toContain("guide_listing");
    expect(model).toContain("resolveMeSettingsTrustProgress");
    const hook = read("lib/me/useMeSettingsTrustPage.ts");
    expect(hook).toContain("getMeGuideProfile");
    expect(hook).toContain("guideOperator");
    const page = read("app/guide/page.tsx");
    expect(page).not.toContain("GuideWorkbenchGateProgressCard");
  });

  it("public guide calendar anchor unchanged", () => {
    const detail = read("components/guides/GuideOccupiedScheduleBlock.tsx");
    expect(detail).toContain('id="guide-availability"');
  });

  it("stats teaser provides collapsed anchor", () => {
    const teaser = read("components/guide/GuideWorkbenchStatsTeaser.tsx");
    expect(teaser).toContain('id="guide-workbench-stats"');
    expect(teaser).toContain('data-tt-guide-workbench-stats-teaser="1"');
  });

  it("README and full-page E2E spec exist", () => {
    expect(read("app/guide/README.md")).toContain("GUIDE-WORKBENCH-L5-FREEZE");
    expect(read("app/guide/README.md")).toContain("GuideWorkbenchMarketExposureCard");
    const spec = read("e2e/guide-workbench-full-l5.spec.ts");
    expect(spec).toContain("data-tt-guide-workbench-market-exposure");
    expect(read("components/guide/GuideWorkbenchTrustAdmissionLink.tsx")).toContain(
      "data-tt-guide-workbench-inbox-trust-link",
    );
    expect(read("components/guide/GuideWorkbenchInboxCard.tsx")).toContain(
      "data-tt-guide-workbench-inbox-empty",
    );
    expect(read("components/guide/GuideWorkbenchMarketExposureCard.tsx")).not.toContain(
      "GuideWorkbenchTrustAdmissionLink",
    );
    expect(read("app/guide/page.tsx")).toContain("resolveGuideInboxEmptyGuidance");
    expect(read("app/guide/page.tsx")).toContain("GuideWorkbenchStakingGateCard");
    expect(read("app/guide/page.tsx")).toContain("resolveGuideStakingGateMode");
    expect(read("app/guide/page.tsx")).toContain("useGuideIdentityMinStake");
    expect(spec).toContain("data-tt-guide-workbench-stats-teaser");
  });

  it("closure probe constants are stable", () => {
    expect(GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE).toBe("guide-workbench-full-v1");
    expect(GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER).toBe("guide-workbench-l5-20260612");
  });
});
