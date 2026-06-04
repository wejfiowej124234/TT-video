import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..", "..");

describe("admin UX shared modules (①)", () => {
  it("exports CSV helper", () => {
    const src = readFileSync(join(root, "lib/admin/downloadAdminCsv.ts"), "utf8");
    expect(src).toContain("export function downloadAdminCsv");
  });

  it("keeps list fetch error + empty state + access badge + shell nav scroll", () => {
    const err = readFileSync(join(root, "components/admin/AdminListFetchError.tsx"), "utf8");
    const alert = readFileSync(join(root, "components/admin/AdminAlertError.tsx"), "utf8");
    const empty = readFileSync(join(root, "components/admin/AdminListPageEmptyState.tsx"), "utf8");
    const badge = readFileSync(join(root, "components/admin/AdminPageAccessBadge.tsx"), "utf8");
    const shell = readFileSync(join(root, "components/admin/AdminShellBar.tsx"), "utf8");
    expect(err).toContain("data-tt-admin-list-fetch-error");
    expect(alert).toContain("data-tt-admin-alert-error");
    expect(empty).toContain("data-tt-admin-list-empty");
    expect(empty).toContain("data-tt-admin-list-empty-widget");
    expect(badge).toContain("data-tt-admin-access-badge");
    expect(shell).toContain("data-tt-admin-shell-nav-scroll");
  });
});
