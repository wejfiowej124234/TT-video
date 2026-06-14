import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const fe = join(process.cwd());

/** ① · 全 Admin locale · 运营可读（禁工程 jargon / API 路径） */
describe("admin operator copy clarity L5 (① · full admin locale)", () => {
  const JARGON =
    /GET \/api|\/api\/v1|\bPATCH\b|\bPUT\b|\bPOST\b|提交 PATCH|writeRequestHeaders|subject_user_id|admin\.[a-z0-9_.]+|\b403\b|Missing admin\.|\b(M[0-9]+|G-S[0-9]|O-S[0-9])\b|ops_[a-z_]+|catalog_[a-z_]+|append-only|ISO3166|\bCRUD\b|community_posts|community_post_id|SEED_TEST|meta\.|catalog-pg|NEXT_PUBLIC|96-18|\bspec\s+\d+|data_unavailable|TT-LINE|B-417|\bEpic [A-Z]|Moderation PATCH|chain_off|`GET /;

  function adminEntries(file: "zh.ts" | "en.ts"): Array<{ key: string; value: string }> {
    const src = readFileSync(join(fe, "locales", file), "utf8");
    const out: Array<{ key: string; value: string }> = [];
    const re = /\b(admin_[a-z0-9_]+):\s*(?:\n\s*)?"((?:[^"\\]|\\.)*)"/g;
    for (const m of src.matchAll(re)) {
      if (m[1].endsWith("_meta_title") || m[1].endsWith("_meta_description")) continue;
      out.push({ key: m[1], value: m[2] });
    }
    return out;
  }

  for (const locale of ["zh.ts", "en.ts"] as const) {
    it(`${locale} admin_* strings avoid operator jargon`, () => {
      const offenders: string[] = [];
      for (const { key, value } of adminEntries(locale)) {
        if (!value.trim()) offenders.push(`${key}: empty`);
        else if (JARGON.test(value)) offenders.push(`${key}: ${value.slice(0, 120)}`);
      }
      expect(offenders).toEqual([]);
    });
  }

  it("content L5 surfaces exported for full plane coverage", () => {
    const surfaces = readFileSync(join(fe, "components/admin/content/AdminContentL5Surfaces.tsx"), "utf8");
    expect(surfaces).toContain("AdminContentDataTable");
    expect(surfaces).toContain("AdminContentPanelCard");
  });

  it("finance reconciliation page uses human snapshot heading key", () => {
    const api = readFileSync(join(fe, "app/admin/finance-reconciliation/AdminFinanceReconciliationApiSection.tsx"), "utf8");
    expect(api).toContain("admin_finance_reconciliation_finance_summary_api_heading");
    expect(api).not.toContain("GET /api");
  });
});
