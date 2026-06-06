/**
 * D9 · G1/G16 · POST 机采路由表与 spec §2.4 对齐
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const captureSpec = readFileSync(
  join(import.meta.dirname, "../e2e/site-theme-v1-evidence-capture.spec.ts"),
  "utf8",
);

const REQUIRED_SLUGS = [
  "home",
  "market",
  "market-provider",
  "market-acquisition",
  "did-rank",
  "community",
  "explore",
  "friends",
  "messages",
  "me",
  "feedback",
  "tt",
] as const;

describe("site theme V1 POST routes (D9 · G1)", () => {
  it("capture spec includes home slug first (G1)", () => {
    expect(captureSpec).toMatch(/slug:\s*"home"/);
    expect(captureSpec).toMatch(/path:\s*"\/"/);
    const homeIdx = captureSpec.indexOf('slug: "home"');
    const marketIdx = captureSpec.indexOf('slug: "market"');
    expect(homeIdx).toBeGreaterThan(-1);
    expect(marketIdx).toBeGreaterThan(homeIdx);
  });

  it("lists all POST slugs including community root and subroutes (G16)", () => {
    for (const slug of REQUIRED_SLUGS) {
      expect(captureSpec).toContain(`slug: "${slug}"`);
    }
  });

  it("mobile capture includes home in G9 subset", () => {
    expect(captureSpec).toContain('mobileSlugs = ["home", "market", "did-rank", "community"]');
    expect(captureSpec).toContain("mobile-390x844.png");
  });
});
