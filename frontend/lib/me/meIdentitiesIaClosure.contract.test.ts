import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ME_IDENTITIES_IA_BANNED_HUB_PATTERNS,
  ME_IDENTITIES_IA_CLOSURE_ACTIVE,
  ME_IDENTITIES_IA_CLOSURE_PROBE,
  ME_IDENTITIES_IA_CLOSURE_SPRINT_ID,
  ME_IDENTITIES_IA_LOCALE_KEYS,
  ME_IDENTITIES_STEWARD_ADMISSION_ANCHOR,
  meIdentitiesHubOperatorSectionDefaultOpen,
} from "./meIdentitiesIaClosureSprintModel";
import { STEWARD_ADMISSION_WORKBENCH_HREF } from "@/lib/steward/stewardAdmissionNav";

const ROOT = process.cwd();
const HUB_PAGE = readFileSync(join(ROOT, "app/me/identities/page.tsx"), "utf8");
const ONBOARDING_MAIN = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingPageMain.tsx"), "utf8");
const ME_PAGE = readFileSync(join(ROOT, "app/me/page.tsx"), "utf8");
const FREEZE_DOC = readFileSync(
  join(ROOT, "evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md"),
  "utf8",
);
const TASK_LIST = readFileSync(
  join(ROOT, "evidence/GO_local_auth_l5/MULTI-IDENTITY-IA-CLOSURE-TASK-LIST.md"),
  "utf8");
const AUDIT_DOC = readFileSync(
  join(ROOT, "evidence/GO_local_auth_l5/MULTI-IDENTITY-IA-ENTERPRISE-AUDIT.md"),
  "utf8",
);
const E2E_SPEC = readFileSync(join(ROOT, "e2e/me-identities-core-hub.spec.ts"), "utf8");
const ZH = readFileSync(join(ROOT, "locales/zh.ts"), "utf8");
const EN = readFileSync(join(ROOT, "locales/en.ts"), "utf8");

describe("meIdentities IA closure sprint (① · ACTIVE)", () => {
  it("declares sprint SSOT", () => {
    expect(ME_IDENTITIES_IA_CLOSURE_ACTIVE).toBe(true);
    expect(ME_IDENTITIES_IA_CLOSURE_SPRINT_ID).toContain("20260612");
    expect(ME_IDENTITIES_IA_CLOSURE_PROBE).toBe("multi-identity-ia-v1");
  });

  it("hub page implements capability/operator/profile IA without banned regressions", () => {
    expect(HUB_PAGE).toContain("me_identities_capabilities_section_title");
    expect(HUB_PAGE).toContain("me_identities_operator_section_title");
    expect(HUB_PAGE).toContain("MeIdentitiesProfileLinksNav");
    expect(HUB_PAGE).toContain("deriveMeIdentitiesCoreCardView");
    expect(HUB_PAGE).toContain("stewardAdmissionWorkbenchHref");
    expect(HUB_PAGE).toContain('href="/me/settings/profile"');
    expect(HUB_PAGE).toContain("me_identities_operator_section_hint");
    expect(HUB_PAGE).toContain("data-tt-me-identities-operator-grid");
    expect(HUB_PAGE).not.toContain("<details");
    expect(HUB_PAGE).not.toContain("me_identities_operator_section_expand");
    expect(HUB_PAGE).not.toContain("meIdentitiesHubOperatorSectionDefaultOpen");
    for (const pattern of ME_IDENTITIES_IA_BANNED_HUB_PATTERNS) {
      expect(HUB_PAGE, pattern.source).not.toMatch(pattern);
    }
  });

  it("steward USDC SSOT is workbench A-track anchor", () => {
    expect(STEWARD_ADMISSION_WORKBENCH_HREF).toContain(ME_IDENTITIES_STEWARD_ADMISSION_ANCHOR);
    expect(HUB_PAGE).toContain("stewardAdmissionWorkbenchHref");
    expect(ONBOARDING_MAIN).toMatch(/region_steward.*redirect|stewardAdmissionWorkbenchHref/s);
  });

  it("/me redirects to identities hub", () => {
    expect(ME_PAGE).toContain("ME_IDENTITIES_HUB_PATH");
    expect(ME_PAGE).toContain("redirect(");
  });

  it("onboarding main removed steward dead UI branches", () => {
    expect(ONBOARDING_MAIN).not.toContain("MeOnboardingStewardJourneyBridge");
    expect(ONBOARDING_MAIN).not.toContain("MeOnboardingStewardStakeSection");
  });

  it("E2E covers steward payment_pending → workbench admission", () => {
    expect(E2E_SPEC).toContain("steward_payment_pending");
    expect(E2E_SPEC).toContain("steward-b-track-admission");
  });

  it("freeze doc, task list, and enterprise audit mutual-reference", () => {
    expect(FREEZE_DOC).toContain("MULTI-IDENTITY-IA-CLOSURE-TASK-LIST");
    expect(FREEZE_DOC).toContain("me_identities_operator_section_hint");
    expect(FREEZE_DOC).toContain("/me/settings/profile");
    expect(TASK_LIST).toContain("① 本地 · ACTIVE 收口");
    expect(TASK_LIST).toContain("MULTI-IDENTITY-IA-ENTERPRISE-AUDIT");
    expect(AUDIT_DOC).toContain("100 / 100");
    expect(AUDIT_DOC).toContain(ME_IDENTITIES_IA_CLOSURE_SPRINT_ID);
  });

  it("locale keys exist in zh/en and removed dead hub onboarding note", () => {
    for (const key of ME_IDENTITIES_IA_LOCALE_KEYS) {
      expect(ZH, key).toContain(`${key}:`);
      expect(EN, key).toContain(`${key}:`);
    }
    expect(ZH).not.toContain("me_identities_onboarding_console_note:");
    expect(EN).not.toContain("me_identities_onboarding_console_note:");
  });

  it("operator section default-open helper matches slot states", () => {
    expect(meIdentitiesHubOperatorSectionDefaultOpen({})).toBe(true);
    expect(meIdentitiesHubOperatorSectionDefaultOpen({ guide: "inactive", merchant: "inactive" })).toBe(
      true,
    );
    expect(meIdentitiesHubOperatorSectionDefaultOpen({ guide: "pending" })).toBe(true);
    expect(meIdentitiesHubOperatorSectionDefaultOpen({ region_steward: "active" })).toBe(true);
  });
});
