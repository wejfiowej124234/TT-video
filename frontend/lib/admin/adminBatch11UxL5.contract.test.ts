import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

function walkModalTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkModalTsx(p));
    else if (/Modal\.tsx$/.test(name) || /Wizard\.tsx$/.test(name)) out.push(p);
  }
  return out;
}

/** ① 第十一批 UX · 全 Admin Modal/Wizard 统一焦点陷阱壳。 */
describe("admin batch11 UX L5 (①)", () => {
  it("shared AdminDialogFocusPanel + AdminDialogScrim components", () => {
    const panel = readFileSync(join(componentsAdmin, "AdminDialogFocusPanel.tsx"), "utf8");
    const scrim = readFileSync(join(componentsAdmin, "AdminDialogScrim.tsx"), "utf8");
    expect(panel).toContain("useFocusTrap");
    expect(panel).toContain("data-tt-admin-dialog-focus-trap");
    expect(scrim).toContain("data-tt-admin-dialog-scrim");
    expect(scrim).toContain("ADMIN_MODAL_SCRIM_CLASS");
    expect(scrim).not.toContain("bg-black/40");
  });

  it("all app/admin Modal and Wizard files use focus panel", () => {
    const offenders: string[] = [];
    for (const file of walkModalTsx(appAdmin)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("AdminDialogFocusPanel")) {
        offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("flags publish modal wires scrim dismiss", () => {
    const modal = readFileSync(
      join(appAdmin, "flags", "AdminFlagsPublishModal.tsx"),
      "utf8",
    );
    expect(modal).toContain("AdminDialogScrim");
    expect(modal).toContain('trapId="flags-publish"');
  });
});
