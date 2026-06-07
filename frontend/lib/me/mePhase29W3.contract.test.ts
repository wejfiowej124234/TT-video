import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FE = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(FE, rel), "utf8");
}

describe("phase29 W3 release polish (RP-003/015)", () => {
  it("RP-003 wires MeGuideRoleBadge on /me profile and /guide dashboard", () => {
    const badge = read("components/me/MeGuideRoleBadge.tsx");
    const profile = read("components/me/MeSettingsProfileIdentityCard.tsx");
    const guide = read("app/guide/GuideDashboardPageMain.tsx");
    expect(badge).toContain('data-tt-me-guide-role-badge="1"');
    expect(badge).toContain("userIsGuide");
    expect(profile).toContain("MeGuideRoleBadge");
    expect(guide).toContain("MeGuideRoleBadge");
  });

  it("RP-015 community hub redirect one-time notice", () => {
    const redirectPage = read("app/community/me/page.tsx");
    const notice = read("components/me/MeCommunityHubRedirectNotice.tsx");
    const profile = read("app/me/settings/profile/MeSettingsProfilePageInner.tsx");
    expect(redirectPage).toContain("markMeCommunityHubRedirectNoticePending");
    expect(notice).toContain('data-tt-me-community-hub-redirect-notice="1"');
    expect(notice).toContain("me_community_hub_redirect_notice");
    expect(profile).toContain("MeCommunityHubRedirectNotice");
  });
});
