import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** HON-03 / VIS-05：写成功与 wizard 步骤 token。 */
describe("admin success + wizard L5 (①)", () => {
  const adminUi = readFileSync(join(__dir, "..", "adminUi.ts"), "utf8");
  const success = readFileSync(
    join(__dir, "..", "..", "components", "admin", "AdminSuccessBanner.tsx"),
    "utf8",
  );
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");

  it("defines success notice + wizard step tokens", () => {
    expect(adminUi).toContain("ADMIN_NOTICE_SUCCESS_CLASS");
    expect(adminUi).toContain("adminWizardStepClass");
    expect(adminUi).toContain("ADMIN_WIZARD_STEP_ACTIVE_CLASS");
    expect(adminUi).toContain("ADMIN_WARM_L5_MODAL_FORM_CONTROL_CLASS");
    expect(adminUi).toMatch(/ADMIN_WARM_L5_MODAL_FORM_CONTROL_CLASS[\s\S]*color-scheme:light/);
    expect(adminUi).toMatch(/ADMIN_WIZARD_STEP_ACTIVE_CLASS[\s\S]*border-ref-sun/);
    expect(adminUi).not.toMatch(/ADMIN_WIZARD_STEP_ACTIVE_CLASS[\s\S]*border-travel-/);
    expect(success).toContain("AdminNoticeBanner");
    expect(success).toContain("data-tt-admin-success-notice");
  });

  it("app/admin avoids raw success blocks without AdminSuccessBanner/AdminNoticeBanner success", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("border-success/25 bg-success/10")) continue;
      if (src.includes("AdminSuccessBanner") || src.includes('tone="success"')) continue;
      offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("reports moderation wizard uses adminWizardStepClass", () => {
    const src = readFileSync(
      join(adminAppRoot, "community", "reports", "AdminCommunityReportsModerationWizard.tsx"),
      "utf8",
    );
    expect(src).toContain("adminWizardStepClass");
    expect(src).toContain("ADMIN_WARM_L5_MODAL_FORM_CONTROL_CLASS");
    expect(src).toContain("data-tt-admin-warm-l5-modal-control");
    expect(src).not.toContain("border-travel-500 bg-travel-50 text-travel-800");
  });
});
