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

describe("admin VIS L5 (①)", () => {
  const adminUi = readFileSync(join(__dir, "..", "adminUi.ts"), "utf8");
  const listChrome = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminListPageChrome.tsx"), "utf8");
  const detailChrome = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminDetailPageChrome.tsx"), "utf8");
  const queueChrome = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminQueueListPageChrome.tsx"), "utf8");
  const writePerm = readFileSync(join(__dir, "adminListPageWritePermission.ts"), "utf8");
  const breadcrumb = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminSubpageBreadcrumb.tsx"), "utf8");
  const shellCtx = readFileSync(join(__dir, "adminShellContextForPath.ts"), "utf8");
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");

  it("defines list/detail width tokens and page chrome uses them", () => {
    expect(adminUi).toContain("TT_ADMIN_PAGE_INNER_LIST");
    expect(adminUi).toContain("ADMIN_TABLE_THEAD_CLASS");
    expect(adminUi).toContain("sticky top-0");
    expect(adminUi).toContain("TT_ADMIN_PAGE_INNER_DETAIL");
    expect(adminUi).toContain("TT_ADMIN_PAGE_INNER_FORM");
    expect(adminUi).toContain("TT_ADMIN_LAYOUT_GUTTER");
    expect(listChrome).toContain("TT_ADMIN_PAGE_INNER_LIST");
    expect(listChrome).toContain("data-tt-admin-list-page");
    expect(listChrome).toContain("AdminPageAccessBadge");
    expect(listChrome).toContain("adminWritePermissionForPathname");
    expect(listChrome).toContain("AdminSubpageBreadcrumb");
    expect(listChrome).toContain("showSubpageBreadcrumb");
    expect(listChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(listChrome).toContain("data-tt-admin-list-page-body-canvas");
    expect(detailChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(detailChrome).toContain("data-tt-admin-detail-page-body-canvas");
    expect(queueChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(queueChrome).toContain("data-tt-admin-queue-list-body-canvas");
    expect(detailChrome).toContain("AdminSubpageBreadcrumb");
    expect(detailChrome).toContain("data-tt-admin-detail-page");
    expect(detailChrome).toContain("AdminPageAccessBadge");
    expect(writePerm).toContain("adminWritePermissionForPathname");
    expect(queueChrome).toContain("AdminWarmL5Surface");
    expect(queueChrome).toContain("AdminPageAccessBadge");
    expect(queueChrome).toContain("AdminSubpageBreadcrumb");
  });

  it("wires shell group breadcrumb context", () => {
    expect(shellCtx).toContain("adminShellContextForPath");
    expect(shellCtx).toContain("adminBreadcrumbLeafForPath");
    expect(shellCtx).toContain("NESTED_LEAF_RULES");
    expect(breadcrumb).toContain("data-tt-admin-subpage-shell-group");
    expect(breadcrumb).toContain("adminShellContextForPath");
    expect(breadcrumb).toContain("adminBreadcrumbLeafForPath");
    expect(breadcrumb).toContain("data-tt-admin-subpage-breadcrumb-inbox");
    expect(breadcrumb).toContain("adminPathShowsInboxBreadcrumb");
  });

  it("app/admin uses semantic width aliases not raw marketing inner tokens", () => {
    const offenders = walkTsx(adminAppRoot).filter((file) => {
      const src = readFileSync(file, "utf8");
      return /TT_MARKETING_ADMIN_INNER_(4XL|5XL|6XL)/.test(src);
    });
    expect(offenders).toEqual([]);
  });

  it("app/admin loading routes use semantic width tokens not raw max-w-*", () => {
    const loadingOffenders = walkTsx(adminAppRoot)
      .filter((f) => f.endsWith("loading.tsx"))
      .filter((file) => {
        const src = readFileSync(file, "utf8");
        return /\bmx-auto\s+max-w-/.test(src);
      });
    expect(loadingOffenders).toEqual([]);
  });
});
