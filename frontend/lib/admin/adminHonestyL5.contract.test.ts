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

/** ① HON-03 / HON-04：Admin 列表/页身错误态与空态引导。 */
describe("admin honesty L5 (①)", () => {
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");
  const alertError = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminAlertError.tsx"), "utf8");
  const listFetchError = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminListFetchError.tsx"), "utf8");
  const emptyState = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminListPageEmptyState.tsx"), "utf8");

  it("defines unified alert + list fetch error + empty next links", () => {
    expect(alertError).toContain("data-tt-admin-alert-error");
    expect(alertError).toContain('href="/auth/login"');
    expect(listFetchError).toContain("AdminAlertError");
    expect(listFetchError).toContain("data-tt-admin-list-fetch-error");
    expect(emptyState).toContain("admin_list_empty_next");
    expect(emptyState).toContain("data-tt-admin-list-empty");
    expect(emptyState).toContain("data-tt-admin-list-empty-widget");
    expect(emptyState).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
  });

  it("defines AdminNoticeBanner for warning/readonly notices", () => {
    const notice = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminNoticeBanner.tsx"), "utf8");
    expect(notice).toContain("data-tt-admin-notice");
    expect(notice).toContain("ADMIN_NOTICE_WARNING_CLASS");
  });

  it("app/admin avoids raw danger alerts outside AdminAlertError/AdminListFetchError", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("border-danger/20 bg-danger/5") && !/role="alert"[\s\S]*text-danger/.test(src)) {
        continue;
      }
      if (src.includes("AdminAlertError") || src.includes("AdminListFetchError")) continue;
      if (file.endsWith("error.tsx")) continue;
      offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("app/admin avoids raw text-danger role=alert without AdminAlertError", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      if (!/text-danger[^"]*"[^>]*role="alert"|role="alert"[^>]*text-danger/.test(src)) continue;
      if (src.includes("AdminAlertError")) continue;
      if (file.endsWith("error.tsx")) continue;
      offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("PageMain/PageInner avoid raw danger alerts without AdminAlertError/AdminListFetchError", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      if (!file.endsWith("PageMain.tsx") && !file.endsWith("PageInner.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("border-danger/20 bg-danger/5")) continue;
      if (src.includes("AdminAlertError") || src.includes("AdminListFetchError")) continue;
      offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("AdminListPageEmptyState usages include nextLinks guidance", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("AdminListPageEmptyState")) continue;
      if (!/AdminListPageEmptyState[\s\S]*?nextLinks\s*=/.test(src)) {
        offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("list empty state exposes filtered marker for applied-filter empty triple", () => {
    expect(emptyState).toContain("data-tt-admin-list-empty-filtered");
    expect(emptyState).toContain("filteredEmpty");
  });

  it("community applied filter banners avoid JSON.stringify dump", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      if (
        src
          .split("\n")
          .some(
            (line) =>
              /JSON\.stringify\(appliedFilters\)/.test(line) && !/appliedFiltersKey/.test(line),
          )
      ) {
        offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("formatAdminAppliedFiltersHuman SSOT is used by guides and flags", () => {
    const fmt = readFileSync(join(__dir, "formatAdminAppliedFiltersHuman.ts"), "utf8");
    expect(fmt).toContain("formatAdminAppliedFiltersHuman");
    for (const rel of ["guides/AdminGuidesPageMain.tsx", "flags/AdminFlagsListSection.tsx"]) {
      const src = readFileSync(join(adminAppRoot, rel), "utf8");
      expect(src, rel).toContain("formatAdminAppliedFiltersHuman");
    }
  });
});
