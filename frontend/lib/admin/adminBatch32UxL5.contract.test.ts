import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");

const appAdmin = join(fe, "app", "admin", "community");



const COMMUNITY_PAGES: { file: string; key: string }[] = [

  { file: "policy-change-logs/AdminCommunityPolicyChangeLogsPageMain.tsx", key: "admin_policy_logs_subtitle_l5" },

  { file: "ranking/snapshots/AdminCommunityRankingSnapshotsPageMain.tsx", key: "admin_rank_snapshots_subtitle_l5" },

  { file: "risk-signals/AdminCommunityRiskSignalsPageMain.tsx", key: "admin_risk_signals_subtitle_l5" },

  { file: "moderation/cases/AdminCommunityModerationCasesPageMain.tsx", key: "admin_mod_cases_subtitle_l5" },

  { file: "appeals/AdminCommunityAppealsPageMain.tsx", key: "admin_appeals_subtitle_l5" },

  { file: "appeals/review/AdminCommunityAppealReviewPageMain.tsx", key: "admin_appeal_review_subtitle_l5" },

  { file: "comments/visibility/AdminCommunityCommentVisibilityPageMain.tsx", key: "admin_comment_vis_subtitle_l5" },

  { file: "abuse-policy/AdminCommunityAbusePolicyPageMain.tsx", key: "admin_abuse_subtitle_l5" },

  { file: "penalties/AdminCommunityPenaltiesPageMain.tsx", key: "admin_penalties_subtitle_l5" },

];



/** ① 第三十二批 UX · 社区深页 subtitle 产品化。 */

describe("admin batch32 UX L5 (①)", () => {

  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");

  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");



  it("defines paired community _subtitle_l5 keys", () => {

    for (const { key } of COMMUNITY_PAGES) {

      expect(zh).toContain(key);

      expect(en).toContain(key);

    }

  });



  it("community PageMain chrome uses _subtitle_l5", () => {

    for (const { file, key } of COMMUNITY_PAGES) {

      const src = readFileSync(join(appAdmin, file), "utf8");

      expect(src).toContain(key);

    }

  });

});


