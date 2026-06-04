import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const depthDir = join(__dir, "..", "..", "components", "admin");

const DEPTH_PANELS = readdirSync(depthDir).filter(
  (f) => f.startsWith("AdminFinance") && f.endsWith("DepthPanel.tsx"),
);

/** FIN-02 · ① 七件套 depth 面板齐套（动作链 + 诚实页脚）。 */
describe("admin finance depth panels L5 (①)", () => {
  it("every AdminFinance*DepthPanel has actions + honesty footer", () => {
    expect(DEPTH_PANELS.length).toBeGreaterThanOrEqual(7);
    for (const file of DEPTH_PANELS) {
      const src = readFileSync(join(depthDir, file), "utf8");
      expect(src, `${file} depth panel token`).toContain("ADMIN_FIN_DEPTH_PANEL_CLASS");
      const hasFooter =
        src.includes("AdminFinanceDepthHonestyFooter") ||
        src.includes("AdminFinanceDepthActionLinks");
      const hasActions =
        src.includes("data-tt-admin-fin-depth-actions") ||
        src.includes("data-tt-admin-fin-export-depth-submit") ||
        src.includes("AdminFinanceDepthActionLinks");
      expect(hasFooter, `${file} missing honesty footer`).toBe(true);
      expect(hasActions, `${file} missing depth actions`).toBe(true);
    }
  });

  it("depth action links component is shared SSOT", () => {
    const links = readFileSync(join(depthDir, "AdminFinanceDepthActionLinks.tsx"), "utf8");
    expect(links).toContain("data-tt-admin-fin-depth-actions");
    expect(links).toContain("AdminFinanceDepthHonestyFooter");
  });
});
