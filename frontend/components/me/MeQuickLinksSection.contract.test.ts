import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = readFileSync(join(process.cwd(), "components/me/MeQuickLinksSection.tsx"), "utf8");

describe("MeQuickLinksSection IA (① · settings hub)", () => {
  it("does not expose pay hub in quick links (orders card is primary pay entry)", () => {
    expect(SRC).not.toContain('href="/pay"');
    expect(SRC).not.toContain("header_payHub");
  });

  it("links settings hub for asideList and pills", () => {
    expect(SRC).toContain("/me/settings");
    expect(SRC).toContain("community_me_settings");
  });

  it("compactForCommunityMe hides orders and content dupes (header 我的 / 工具 is SSOT)", () => {
    expect(SRC).toContain("me_communityHint_compact");
    expect(SRC).toContain('compactForCommunityMe ? "me_communityHint_compact"');
    expect(SRC).toContain("{compactForCommunityMe ? null : (");
    expect(SRC).toContain('href="/orders"');
    expect(SRC).toContain('href="/community/me/posts"');
  });
});
