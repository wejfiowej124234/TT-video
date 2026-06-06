import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");

const appAdmin = join(fe, "app", "admin");



const DETAIL_PAGES: { file: string; key: string }[] = [

  { file: "users/[id]/AdminUserDetailPageMain.tsx", key: "admin_user_detail_subtitle_l5" },

  { file: "orders/[id]/AdminOrderDetailPageMain.tsx", key: "admin_order_detail_subtitle_l5" },

  { file: "disputes/[id]/AdminDisputeDetailPageMain.tsx", key: "admin_dispute_detail_subtitle_l5" },

  { file: "reviews/[id]/AdminReviewDetailPageMain.tsx", key: "admin_review_detail_subtitle_l5" },

  { file: "guides/[id]/AdminGuideDetailPageMain.tsx", key: "admin_guide_detail_subtitle_l5" },

  { file: "audit/logs/[id]/AdminAuditLogDetailPageMain.tsx", key: "admin_audit_detail_subtitle_l5" },

];



/** ① 第三十五批 UX · 经营详情页 subtitle 产品化。 */

describe("admin batch35 UX L5 (①)", () => {

  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");

  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");



  it("defines paired detail _subtitle_l5 keys", () => {

    for (const { key } of DETAIL_PAGES) {

      expect(zh).toContain(key);

      expect(en).toContain(key);

    }

    expect(zh).not.toMatch(/admin_order_detail_subtitle_l5:[^\n]*GET \/api/);

  });



  it("detail PageMain uses _subtitle_l5", () => {

    for (const { file, key } of DETAIL_PAGES) {

      expect(readFileSync(join(appAdmin, file), "utf8")).toContain(key);

    }

  });

});


