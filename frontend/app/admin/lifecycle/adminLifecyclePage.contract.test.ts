import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../components/admin");

function readModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminLifecyclePageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminLifecyclePage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminLifecyclePageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin lifecycle page", () => {
  const src = readModuleSources();

  it("keeps lifecycle state machines route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.lifecycleStateMachines");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminLifecyclePageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
