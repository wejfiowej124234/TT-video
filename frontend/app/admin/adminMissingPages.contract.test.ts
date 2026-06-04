import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** ①：此前无专页 contract 的 admin 路由（静态锚点）。 */
const MISSING_PAGE_CONTRACTS: { rel: string; mainRel?: string; needles: string[] }[] = [
  {
    rel: "compliance/page.tsx",
    mainRel: "compliance/AdminComplianceHubPageMain.tsx",
    needles: ["AdminComplianceHubPageMain", "data-tt-admin-compliance-hub", "ADMIN_PERM.READ"],
  },
  { rel: "finance-suite/page.tsx", mainRel: "finance-suite/AdminFinanceSuitePageMain.tsx", needles: ["AdminFinanceSuitePageMain", "AdminPermissionDeniedBanner"] },
  { rel: "onboarding/page.tsx", mainRel: "onboarding/AdminOnboardingHubPageMain.tsx", needles: ["AdminOnboardingHubPageMain", "data-tt-admin-onboarding-hub"] },
  {
    rel: "onboarding/entitlements/page.tsx",
    needles: ["admin_onb_entitlements_title", "AdminOnboardingListPage"],
  },
  {
    rel: "onboarding/webhook-jobs/page.tsx",
    needles: ["admin_onb_webhook_jobs_title", "AdminOnboardingListPage"],
  },
  {
    rel: "onboarding/payment-events/page.tsx",
    needles: ["admin_onb_payment_events_title", "AdminOnboardingListPage", "stripeEchoColumn"],
  },
  {
    rel: "onboarding/compliance-audit/page.tsx",
    needles: ["admin_onb_compliance_title", "AdminOnboardingListPage"],
  },
  {
    rel: "users/page.tsx",
    needles: ["AdminUsersPageMain", "useAdminUsersPage", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/reports/page.tsx",
    needles: ["AdminCommunityReportsPageInner", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "operator-guide/page.tsx",
    mainRel: "operator-guide/AdminOperatorGuidePageMain.tsx",
    needles: ["AdminOperatorGuidePageMain", "data-tt-admin-operator-guide"],
  },
  {
    rel: "community/penalties/page.tsx",
    needles: ["admin_penalties", "AdminCommunityPenaltiesPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/moderation/cases/page.tsx",
    needles: ["admin_mod_cases", "AdminCommunityModerationCasesPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/risk-signals/page.tsx",
    needles: ["admin_risk_signals", "AdminCommunityRiskSignalsPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/policy-change-logs/page.tsx",
    needles: ["admin_policy_logs", "AdminCommunityPolicyChangeLogsPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/ranking/snapshots/page.tsx",
    needles: ["admin_rank_snapshots", "AdminCommunityRankingSnapshotsPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/abuse-policy/page.tsx",
    needles: ["admin_abuse", "AdminCommunityAbusePolicyPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/comments/visibility/page.tsx",
    needles: ["admin_comment_vis", "AdminCommunityCommentVisibilityPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "community/appeals/review/page.tsx",
    needles: ["admin_appeal_review", "AdminCommunityAppealReviewPageMain", "AdminCommunityPageShell", "AdminPermissionDeniedBanner"],
  },
  {
    rel: "auth-audit-events/page.tsx",
    needles: ["admin_auth_audit_events_title", "AdminAuthAuditEventsPageMain"],
  },
  { rel: "finance/page.tsx", needles: ["AdminFinancePageMain"] },
  { rel: "orders/page.tsx", mainRel: "orders/AdminOrdersPageMain.tsx", needles: ["AdminOrdersPageMain", "AdminPermissionDeniedBanner"] },
  { rel: "audit/page.tsx", needles: ["useAdminAuditPage", "AdminAuditPageMain"] },
  { rel: "policies/page.tsx", needles: ["admin_policies_title", "AdminPermissionDeniedBanner"] },
  { rel: "scheduler/jobs/page.tsx", needles: ["admin_scheduler", "AdminPermissionDeniedBanner"] },
];

describe("admin pages missing dedicated contracts (batch)", () => {
  for (const { rel, mainRel, needles } of MISSING_PAGE_CONTRACTS) {
    it(`keeps anchors in ${rel}`, () => {
      const src = [
        readFileSync(join(__dir, rel), "utf8"),
        ...(mainRel ? [readFileSync(join(__dir, mainRel), "utf8")] : []),
      ].join("\n");
      for (const n of needles) {
        expect(src).toContain(n);
      }
    });
  }
});
