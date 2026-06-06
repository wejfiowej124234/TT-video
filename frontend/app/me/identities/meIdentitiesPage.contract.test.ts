import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("me identities hub page (role links · no API list fabrication)", () => {
  const src = readFileSync(join(__dir, "page.tsx"), "utf8");

  it("routes role cards via register href builder and guide register", () => {
    expect(src).toContain("buildIdentitiesApplyChildHref");
    expect(src).toContain('buildIdentitiesApplyChildHref("/guide/register"');
    expect(src).toContain('buildIdentitiesApplyChildHref("/market/acquisition"');
    expect(src).toContain("header_identity_acquisition");
    expect(src).toContain("me_identities_card_acquisition_desc");
    expect(src).toContain('buildIdentitiesApplyChildHref("/provider/register"');
    expect(src).toContain('buildIdentitiesApplyChildHref("/steward/register"');
    expect(src).not.toMatch(/useState\s*\(\s*\[\s*\{[^}]*role/);
  });

  it("uses i18n hub chrome and L5 a11y tokens", () => {
    expect(src).toContain("me_identities_hub_title");
    expect(src).toContain("me_identities_hub_eyebrow");
    expect(src).toContain("MeIdentitiesTravelerCallout");
    expect(src).toContain("me_identities_apply_section_title");
    expect(src).toContain("me_identities_card_cta_market");
    expect(src).toContain("TT_ME_IDENTITIES_L5");
    expect(src).toContain("meIdentitiesL5MainDataAttrs(true)");
    expect(src).toContain("MeIdentitiesL5IdentityCard");
    expect(src).toContain("AuthL5PageBackdrop");
    expect(src).toContain('aria-labelledby="me-identities-hub-title"');
    expect(src).toContain('aria-labelledby="me-identities-apply-heading"');
    expect(src).toContain("me_identities_core_section_title");
    expect(src).toContain("data-tt-me-identities-core-grid");
    expect(src).toContain("useMeIdentitiesCoreCardSignals");
    expect(src).toContain("deriveMeIdentitiesCoreCardView");
    expect(src).toContain("ME_IDENTITIES_STEWARD_ACTIVE_HREF");
    expect(src).toContain("ME_IDENTITIES_PROVIDER_ACTIVE_HREF");
  });

  it("links onboarding and community without inventing identity records", () => {
    expect(src).toContain('providerOnboardingHref = "/me/onboarding?role=provider&from=identities_hub"');
    expect(src).toContain('stewardOnboardingHref = "/me/onboarding?role=region_steward&from=identities_hub"');
    expect(src).toContain('href="/me/settings/profile"');
    expect(src).toContain("me_identities_back_community");
    expect(src).toContain("me_identities_onboarding_console_note");
    expect(src).toContain("AuthL5CrossNavFooter");
    expect(src).toContain("hideFeeRouterLinks");
    expect(src).toContain("gridHalo");
    expect(src).toContain("MeIdentitiesTravelerCallout");
    expect(src).not.toContain("getMeSessions");
    expect(src).toContain("useMeIdentitySlots");
    expect(src).not.toMatch(/identities\s*=\s*\[/);
  });
});
