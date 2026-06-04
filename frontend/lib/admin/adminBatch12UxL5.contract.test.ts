import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第十二批 UX · ADM-U01 预备面板 / 对话框滚动锁 / 手册 SSOT。 */
describe("admin batch12 UX L5 (①)", () => {
  it("ADM-U01 local prep panel on permissions and operator guide", () => {
    const panel = readFileSync(join(componentsAdmin, "AdminAdmU01LocalPrepPanel.tsx"), "utf8");
    const perms = readFileSync(
      join(appAdmin, "permissions", "AdminPermissionsPageMain.tsx"),
      "utf8",
    );
    const guide = readFileSync(
      join(appAdmin, "operator-guide", "AdminOperatorGuidePageMain.tsx"),
      "utf8",
    );
    expect(panel).toContain("ADMIN_ADM_U01_SHELL_PREP_FLOWS");
    expect(panel).toContain("data-tt-admin-adm-u01-prep-flow");
    expect(perms).toContain("AdminAdmU01LocalPrepPanel");
    expect(guide).toContain("admin-operator-guide-adm-u01-shell-matrix");
  });

  it("operator guide phase2 commands re-export from SSOT", () => {
    const model = readFileSync(
      join(appAdmin, "operator-guide", "adminOperatorGuidePageModel.ts"),
      "utf8",
    );
    const ssot = readFileSync(join(__dir, "adminPhase2LocalPrepCommands.ts"), "utf8");
    expect(model).toContain("OPERATOR_GUIDE_PHASE2_PREP_COMMANDS");
    expect(model).toContain("adminPhase2LocalPrepCommands");
    expect(ssot).toContain("OPERATOR_GUIDE_PHASE2_PREP_COMMANDS");
  });

  it("AdminDialogFocusPanel locks body scroll", () => {
    const panel = readFileSync(join(componentsAdmin, "AdminDialogFocusPanel.tsx"), "utf8");
    expect(panel).toContain('document.body.style.overflow = "hidden"');
  });

  it("home shell preview banner stays compact; ADM-U01 prep on operator guide", () => {
    const banner = readFileSync(join(componentsAdmin, "AdminHomeShellPreviewBanner.tsx"), "utf8");
    const guide = readFileSync(
      join(appAdmin, "operator-guide", "AdminOperatorGuidePageMain.tsx"),
      "utf8",
    );
    expect(banner).toContain("sm:flex-row sm:items-center");
    expect(banner).not.toContain("data-tt-admin-home-shell-preview-adm-u01-link");
    expect(guide).toContain("admin-operator-guide-adm-u01-shell-matrix");
  });
});
