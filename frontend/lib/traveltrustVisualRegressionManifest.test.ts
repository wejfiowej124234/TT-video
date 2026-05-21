import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  TRAVELTRUST_VISUAL_DEFAULT_PROJECT,
  TRAVELTRUST_VISUAL_SNAPSHOT_BASENAMES,
  TRAVELTRUST_VISUAL_SNAPSHOT_DIR,
} from "./traveltrustVisualRegressionManifest";

const root = join(__dirname, "..");

describe("traveltrustVisualRegressionManifest (TT-PH1-182)", () => {
  it("lists expected chromium snapshot basenames", () => {
    expect(TRAVELTRUST_VISUAL_DEFAULT_PROJECT).toBe("chromium");
    expect(TRAVELTRUST_VISUAL_SNAPSHOT_BASENAMES).toHaveLength(5);
    for (const name of TRAVELTRUST_VISUAL_SNAPSHOT_BASENAMES) {
      expect(name).toMatch(new RegExp(`-${TRAVELTRUST_VISUAL_DEFAULT_PROJECT}(-win32)?\\.png$`));
    }
  });

  it("documents snapshot dir relative to frontend/", () => {
    expect(TRAVELTRUST_VISUAL_SNAPSHOT_DIR).toContain("traveltrust-hero-visual-regression");
    const spec = join(root, "e2e", "traveltrust-hero-visual-regression.spec.ts");
    expect(existsSync(spec)).toBe(true);
  });

  it("has desktop chromium baselines when generated (TT-PH1-182)", () => {
    const dir = join(root, TRAVELTRUST_VISUAL_SNAPSHOT_DIR);
    if (!existsSync(dir)) return;
    expect(existsSync(join(dir, "traveltrust-hero-desktop-chromium.png"))).toBe(true);
    expect(existsSync(join(dir, "traveltrust-roles-desktop-chromium.png"))).toBe(true);
    expect(existsSync(join(dir, "traveltrust-start-desktop-chromium.png"))).toBe(true);
  });
});
