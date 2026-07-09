import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TRAVELTRUST_ROADMAP_2026 } from "./traveltrustRoadmap2026";
import { TRAVELTRUST_PUBLIC_DISCLOSURE_REGISTRY } from "./traveltrustNetworkAnnouncements";

const ROOT = join(__dirname, "../..");
const LOCALES = ["en.ts", "zh.ts"] as const;
const SURFACE_AUDIT_REGISTRY = "registry/traveltrust-public-surface-audit.v1.yaml";

const FORBIDDEN_PATTERNS = [
  /testnet preview/i,
  /Sepolia [Pp]review/,
  /Sepolia preview/i,
  /测试网预览/,
  /待上线/,
  /Opening Jul/i,
  /Round 1 Beta/i,
  /Engineering Mock/i,
  /51-F7; to follow/,
  /待后续实现/,
  /escrow planning/i,
  /链上托管规划/,
  /预计 7 月 15 日正式开放/,
];

const SCAN_PREFIXES = [
  "traveltrust_tagline",
  "traveltrust_meta_",
  "traveltrust_roadmap_2026_",
  "traveltrust_liquidity_",
  "traveltrust_faq_",
  "traveltrust_legacy_faq_",
  "traveltrust_demo_disclosure",
  "traveltrust_hero_card_kicker",
  "traveltrust_cinematic_chapter_liquidity",
  "traveltrust_cinematic_sr_chapter_liquidity",
  "traveltrust_pulse_community_governance",
  "traveltrust_pulse_trust_escrow_core",
  "traveltrust_pulse_product_intro",
  "governance_desc",
  "governance_meta_",
  "governance_hub_",
  "governance_proposals_",
  "governance_params_web3",
  "staking_meta_",
  "staking_page",
  "trust_meta_",
  "p003_hub_intro",
] as const;

function matchesScanPrefix(key: string): boolean {
  return SCAN_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));
}

function extractLocaleEntries(src: string): Array<{ key: string; value: string }> {
  const entries: Array<{ key: string; value: string }> = [];
  const re = /^\s+([a-zA-Z0-9_]+):\s*\n?\s*"((?:\\.|[^"\\])*)"/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src)) !== null) {
    const key = match[1]!;
    if (!matchesScanPrefix(key)) continue;
    entries.push({ key, value: match[2]!.replace(/\\"/g, '"') });
  }
  return entries;
}

describe("public surface audit", () => {
  it("references surface audit registry SSOT", () => {
    const reg = readFileSync(join(ROOT, SURFACE_AUDIT_REGISTRY), "utf8");
    expect(reg).toContain("PUBLIC_SURFACE_AUDIT_PASS");
    expect(reg).toContain("/trust");
    expect(reg).toContain("extends_disclosure_registry");
    expect(TRAVELTRUST_PUBLIC_DISCLOSURE_REGISTRY).toBe("registry/traveltrust-public-disclosure.v1.yaml");
  });

  it("scanned locale prefixes avoid stale preview / mock / planning drift", () => {
    for (const file of LOCALES) {
      const src = readFileSync(join(ROOT, "frontend/locales", file), "utf8");
      const entries = extractLocaleEntries(src);
      expect(entries.length).toBeGreaterThan(20);
      for (const { key, value } of entries) {
        for (const bad of FORBIDDEN_PATTERNS) {
          expect(value, `${file} ${key}`).not.toMatch(bad);
        }
      }
    }
  });

  it("footer roadmap SSOT lists two 2026 product milestones", () => {
    expect(TRAVELTRUST_ROADMAP_2026).toHaveLength(2);
    expect(TRAVELTRUST_ROADMAP_2026.map((m) => m.id)).toEqual([
      "milestone-app-launch",
      "milestone-china-guides",
    ]);
  });

  it("governance params strip keeps Sepolia ACTIVE kicker in both locales", () => {
    for (const file of LOCALES) {
      const src = readFileSync(join(ROOT, "frontend/locales", file), "utf8");
      expect(src).toContain("governance_params_web3_runtime_kicker");
      expect(src).toContain("Web3 Runtime ACTIVE");
    }
  });

  it("staking route has no Coming Soon shell copy in page module", () => {
    const stakingPage = readFileSync(join(ROOT, "frontend/app/staking/page.tsx"), "utf8");
    expect(stakingPage).not.toMatch(/coming soon/i);
    expect(stakingPage).toContain("WorkspaceL5PageShell");
  });

  it("trust hub route exists at /trust (transparency alias documented in registry)", () => {
    expect(readFileSync(join(ROOT, "frontend/app/trust/page.tsx"), "utf8")).toContain("TrustTransparencyHub");
    const reg = readFileSync(join(ROOT, SURFACE_AUDIT_REGISTRY), "utf8");
    expect(reg).toContain("alias: /transparency");
  });
});
