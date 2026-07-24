import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("me identities hub page (PD-009 capability IA)", () => {
  const src = readFileSync(join(__dir, "page.tsx"), "utf8");

  it("partitions capabilities vs operator identities", () => {
    expect(src).toContain("me_identities_capabilities_section_title");
    expect(src).toContain("me_identities_operator_section_title");
    expect(src).toContain("deriveMeIdentitiesAcquisitionCardView");
    expect(src).toContain("MeIdentitiesProfileLinksNav");
    expect(src).toContain("useMeIdentitiesProfileLinkThumbs");
    expect(src).toContain("MeIdentitiesProfileLinkThumb");
    expect(src).toContain("meIdentitiesProfileLinks");
    expect(src).not.toContain('buildIdentitiesApplyChildHref("/market/acquisition"');
  });

  it("routes role cards via register href builder and guide register", () => {
    expect(src).toContain('buildIdentitiesApplyChildHref("/guide/register"');
    expect(src).toContain("header_identity_acquisition");
    expect(src).toContain("me_identities_card_acquisition_capability_desc");
    expect(src).toContain('buildIdentitiesApplyChildHref("/provider/register"');
    expect(src).toContain('buildIdentitiesApplyChildHref("/steward/register"');
    expect(src).not.toMatch(/useState\s*\(\s*\[\s*\{[^}]*role/);
  });

  it("uses i18n hub chrome and L5 a11y tokens", () => {
    expect(src).toContain("me_identities_hub_title");
    expect(src).toContain("me_identities_hub_eyebrow");
    expect(src).toContain("MeIdentitiesTravelerCallout");
    expect(src).toContain("TT_ME_IDENTITIES_L5");
    expect(src).toContain("meIdentitiesL5MainDataAttrs(true)");
    expect(src).toContain("MeIdentitiesL5IdentityCard");
    expect(src).toContain("AuthL5PageBackdrop");
    expect(src).toContain('aria-labelledby="me-identities-hub-title"');
    expect(src).toContain("useMeIdentitiesCoreCardSignals");
    expect(src).toContain("deriveMeIdentitiesCoreCardView");
    expect(src).toContain("ME_IDENTITIES_MERCHANT_SETTINGS_HREF");
    expect(src).toContain("ME_IDENTITIES_STEWARD_SETTINGS_HREF");
  });

  it("links community profile without duplicate onboarding footer links", () => {
    expect(src).toContain('providerOnboardingHref = "/me/onboarding?role=provider&from=identities_hub"');
    expect(src).toContain("stewardAdmissionWorkbenchHref");
    expect(src).toContain('href="/me/settings/profile"');
    expect(src).toContain("me_identities_hub_footer_note");
    expect(src).toContain('href="/me/publish"');
    expect(src).toContain("me_identities_publish_hub_link");
    expect(src).toContain("me_identities_operator_section_hint");
    expect(src).toContain("data-tt-me-identities-operator-grid");
    expect(src).not.toContain("<details");
    expect(src).not.toContain("me_identities_operator_section_expand");
    expect(src).not.toContain("meIdentitiesHubOperatorSectionDefaultOpen");
    expect(src).not.toContain("me_identities_link_onboarding_provider");
    expect(src).not.toMatch(/slotState && slotState !== "inactive"/);
    expect(src).toContain("AuthL5CrossNavFooter");
    expect(src).not.toContain("getMeSessions");
    expect(src).toContain("useMeIdentitySlots");
    expect(src).not.toMatch(/identities\s*=\s*\[/);
  });
});

describe("me settings nav (workspace hubs only · no duplicate identity profiles)", () => {
  it("does not expose identity_profiles section on settings hub", () => {
    const sections = meSettingsNavSections({
      showGuideHub: true,
      showMerchantHub: true,
      showStewardHub: true,
      showAcquisitionHub: true,
    });
    expect(sections.some((s) => s.id === "identity_profiles")).toBe(false);
    const travel = sections.find((s) => s.id === "travel");
    expect(travel?.items.some((i) => i.id === "guide_hub")).toBe(true);
    expect(travel?.items.some((i) => i.id === "guide_profile")).toBe(false);
  });
});
