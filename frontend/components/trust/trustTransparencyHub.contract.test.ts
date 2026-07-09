import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd());

describe("TrustTransparencyHub · ① contract", () => {
  it("hub uses user-facing pillar titles without internal B- codes", () => {
    const hub = readFileSync(join(root, "components/trust/TrustTransparencyHub.tsx"), "utf8");
    expect(hub).toContain("pux1_pillar_finance_title");
    expect(hub).not.toContain("trust_section_proof_b482_title");
    expect(hub).not.toContain("pux1_hub_hero");
  });

  it("trust pillar copy avoids internal spec identifiers (PER CI-14)", () => {
    const zh = readFileSync(join(root, "locales/zh.ts"), "utf8");
    const en = readFileSync(join(root, "locales/en.ts"), "utf8");
    expect(zh).not.toMatch(/pux1_pillar_gov_body:[\s\S]*D-4555/);
    expect(en).not.toMatch(/pux1_pillar_gov_body:[\s\S]*D-4555/);
  });

  it("register KYC banner links to settings trust SSOT", () => {
    const banner = readFileSync(join(root, "app/guide/register/GuideRegisterKycBanner.tsx"), "utf8");
    expect(banner).toContain("ME_TRUST_KYC_STATUS_HREF");
    expect(banner).not.toContain('href="/me/security"');
  });
});
