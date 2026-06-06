import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");

const appAdmin = join(fe, "app", "admin");



const OPS_PAGES: { file: string; key: string }[] = [

  { file: "observability/AdminObservabilityPageMain.tsx", key: "admin_observability_subtitle_l5" },

  { file: "cross-check/AdminCrossCheckPageMain.tsx", key: "admin_cross_check_subtitle_l5" },

  { file: "drift-summary/AdminDriftSummaryPageMain.tsx", key: "admin_drift_summary_subtitle_l5" },

  { file: "fee-router/AdminFeeRouterPageMain.tsx", key: "admin_fee_router_subtitle_l5" },

  { file: "region-vault/AdminRegionVaultPageMain.tsx", key: "admin_region_vault_subtitle_l5" },

  { file: "schema/AdminSchemaPageMain.tsx", key: "admin_schema_subtitle_l5" },

  { file: "indexer/AdminIndexerPageMain.tsx", key: "admin_indexer_subtitle_l5" },

  { file: "jobs/AdminJobsPageMain.tsx", key: "admin_jobs_subtitle_l5" },

  { file: "guides/AdminGuidesPageMain.tsx", key: "admin_guides_subtitle_l5" },

];



/** ① 第二十九批 UX · 运维/只读页 subtitle 产品化（L5 _subtitle 键）。 */

describe("admin batch29 UX L5 (①)", () => {

  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");

  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");



  it("defines paired L5 ops subtitle keys in zh/en", () => {

    for (const { key } of OPS_PAGES) {

      expect(zh).toContain(key);

      expect(en).toContain(key);

    }

    expect(zh).not.toMatch(/admin_schema_subtitle_l5:[^\n]*GET \/api/);

    expect(en).not.toMatch(/admin_schema_subtitle_l5:[^\n]*GET \/api/);

  });



  it("ops PageMain chrome uses _subtitle_l5", () => {

    for (const { file, key } of OPS_PAGES) {

      const src = readFileSync(join(appAdmin, file), "utf8");

      expect(src).toContain(key);

    }

  });

});


