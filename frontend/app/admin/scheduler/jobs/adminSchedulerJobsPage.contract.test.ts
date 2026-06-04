import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../../components/admin");

function readModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminSchedulerJobsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminSchedulerJobsTableSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminSchedulerJobsStatusBlock.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminSchedulerJobsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminSchedulerJobsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin scheduler jobs page", () => {
  const src = readModuleSources();

  it("keeps scheduler jobs route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.schedulerJobs");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminSchedulerJobsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain("admin_scheduler_jobs_rerun_row_aria");
    expect(src).toContain("AdminSortableTh");
  });
});
