import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_BATCHES,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK,
} from "@/lib/traveltrust/l5";

const repoRoot = join(__dirname, "..", "..");
const evidence = join(repoRoot, "frontend/evidence/GO_local_cinematic_l5_closure");

describe("traveltrust cinematic L5 local gate index (①)", () => {
  it("exposes engineering lock and batch ledger", () => {
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK).toBe("2026-05-20");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_BATCHES).toMatch(/^A-[A-Z]$/);
  });

  it("ships verify and capture gate scripts", () => {
    const verify = join(repoRoot, "scripts/gates/verify-cinematic-l5-local.sh");
    const capture = join(repoRoot, "scripts/gates/capture-cinematic-l5-evidence.sh");
    const maybe = join(repoRoot, "scripts/gates/maybe-run-cinematic-l5-verify-on-diff.sh");
    expect(readFileSync(verify, "utf8")).toContain("npm run test:cinematic-l5");
    expect(readFileSync(capture, "utf8")).toContain("cinematic-l5-evidence-capture.spec.ts");
    expect(readFileSync(maybe, "utf8")).toContain("verify-cinematic-l5-local.sh");
  });

  it("ships evidence closure docs and required PNG names", () => {
    for (const name of [
      "README.md",
      "COMPLETION-STATUS.md",
      "CODE-CLOSURE-STATEMENT.md",
      "ENGINEERING-LOCK.md",
      "MAINTAINER-ONE-PAGE.md",
      "SECTION-6-2-CHECKLIST.md",
      "CAPTURE.md",
      "ISSUES-ENGINEERING-SYNC.md",
    ]) {
      expect(existsSync(join(evidence, name)), name).toBe(true);
    }
    const capture = readFileSync(join(evidence, "CAPTURE.md"), "utf8");
    expect(capture).toContain("hero-scroll-handoff-l5.png");
    expect(capture).toContain("roles-theater-l5.png");
    expect(capture).toContain("start-steps-l5.png");
    expect(capture).toContain("faq-trust-l5.png");
    expect(capture).toContain("settlement-liquidity-l5.png");
  });

  it("documents npm scripts in frontend package.json", () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, "frontend/package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.["test:cinematic-l5"]).toContain("traveltrustCinematicNonGlobeL5");
    expect(pkg.scripts?.["verify:cinematic-l5"]).toContain("verify-cinematic-l5-local.sh");
    expect(pkg.scripts?.["capture:cinematic-l5"]).toContain("capture-cinematic-l5-evidence.sh");
  });
});
