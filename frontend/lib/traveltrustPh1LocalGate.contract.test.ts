import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const repoRoot = join(root, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
const gateScript = join(repoRoot, "scripts", "gates", "traveltrust-ph1-homepage-local.sh");

describe("traveltrust PH-1 local gate index", () => {
  it("exposes lighthouse:traveltrust evidence script (TT-PH1-184)", () => {
    expect(pkg.scripts?.["lighthouse:traveltrust"]).toMatch(/record-traveltrust-lighthouse-evidence/);
  });

  it("ships record-traveltrust-lighthouse-evidence.mjs", () => {
    const script = join(root, "scripts", "record-traveltrust-lighthouse-evidence.mjs");
    expect(readFileSync(script, "utf8")).toContain("lighthouse-traveltrust");
  });

  it("documents PH-1 gate env flags and pi1 e2e script", () => {
    const gate = readFileSync(gateScript, "utf8");
    expect(gate).toContain("TRAVELTRUST_PH1_E2E=1");
    expect(gate).toContain("TRAVELTRUST_PH1_E2E_FULL=1");
    expect(gate).toContain("TRAVELTRUST_PH1_VISUAL=1");
    expect(gate).toContain("TRAVELTRUST_PH1_LIGHTHOUSE=1");
    expect(gate).toContain("e2e:pi1-traveltrust");
    expect(gate).toContain("e2e:traveltrust-visual");
    expect(gate).toContain("home-landing-shell.spec.ts");
    expect(gate).toContain("e2e:traveltrust-visual");
    expect(gate).toContain("GO_local_traveltrust_ph1");
    expect(gate).toContain("TRAVELTRUST_PH1_VERIFY_SCREENSHOTS");
    expect(gate).toContain("traveltrust-ph1-verify-screenshots.spec.ts");
    expect(pkg.scripts?.["e2e:pi1-traveltrust"]).toContain("pi1-traveltrust-v6-browser-acceptance");
    expect(pkg.scripts?.["e2e:traveltrust-visual:update"]).toContain("--update-snapshots");
  });

  it("writes lighthouse evidence under GO_local_traveltrust_ph1 (TT-PH1-184)", () => {
    const lh = readFileSync(join(root, "scripts", "record-traveltrust-lighthouse-evidence.mjs"), "utf8");
    expect(lh).toContain("GO_local_traveltrust_ph1");
    expect(lh).toContain("lighthouse");
  });

  it("ships GO_local_traveltrust_ph1 evidence README", () => {
    const readme = join(repoRoot, "evidence", "GO_local_traveltrust_ph1", "README.md");
    expect(existsSync(readme)).toBe(true);
    expect(readFileSync(readme, "utf8")).toContain("TRAVELTRUST_PH1_E2E_FULL");
  });

  it("ships human-verify checklist and preflight gate (TT-PH1-150～158)", () => {
    const checklist = join(repoRoot, "evidence", "GO_local_traveltrust_ph1", "human-verify-checklist.md");
    const preflight = join(repoRoot, "scripts", "gates", "traveltrust-ph1-human-verify-preflight.sh");
    expect(existsSync(checklist)).toBe(true);
    expect(existsSync(preflight)).toBe(true);
    expect(readFileSync(checklist, "utf8")).toContain("TT-PH1-150");
    expect(readFileSync(preflight, "utf8")).toContain("traveltrust-hero-mobile-390x812.png");
  });
});
