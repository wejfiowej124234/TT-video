/**
 * P8-1 单测：lib/api routes.admin（社区治理）与 04 §三、14、70 管理面路径一致
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { routes } from "./api";

describe("lib/api routes.admin · community", () => {
  it("community reports/snapshots/policy/appeals/penalties/moderation/risk + indexer reconcile filters", () => {
    expect(
      routes.admin.communityReports({
        limit: 10,
        status: "open",
        reporter_id: "550e8400-e29b-41d4-a716-446655440000",
        target_type: "post|",
        reason_code: "spam%",
        target_id: "550e8400-e29b-41d4-a716-446655440001",
      }),
    ).toBe(
      "/api/v1/admin/community/reports?limit=10&status=open&reporter_id=550e8400-e29b-41d4-a716-446655440000&target_type=post%7C&reason_code=spam%25&target_id=550e8400-e29b-41d4-a716-446655440001",
    );
    expect(
      routes.admin.communityRankingSnapshots({ limit: 5, feed_mode: "for_you|" }),
    ).toBe("/api/v1/admin/community/ranking/snapshots?limit=5&feed_mode=for_you%7C");
    expect(
      routes.admin.communityPolicyChangeLogs({
        limit: 20,
        scope: "abuse%",
        summary: "note|",
        source: "patch",
        actor_id: "550e8400-e29b-41d4-a716-446655440002",
      }),
    ).toBe(
      "/api/v1/admin/community/policy-change-logs?limit=20&scope=abuse%25&summary=note%7C&source=patch&actor_id=550e8400-e29b-41d4-a716-446655440002",
    );
    expect(
      routes.admin.communityAppeals({
        limit: 15,
        report_id: "550e8400-e29b-41d4-a716-446655440000",
        status: "pending",
      }),
    ).toBe(
      "/api/v1/admin/community/appeals?limit=15&report_id=550e8400-e29b-41d4-a716-446655440000&status=pending",
    );
    expect(
      routes.admin.communityPenalties({
        limit: 12,
        subject_user_id: "550e8400-e29b-41d4-a716-446655440001",
        report_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "active",
      }),
    ).toBe(
      "/api/v1/admin/community/penalties?limit=12&subject_user_id=550e8400-e29b-41d4-a716-446655440001&report_id=550e8400-e29b-41d4-a716-446655440002&status=active",
    );
    expect(
      routes.admin.communityModerationCases({
        limit: 8,
        report_id: "550e8400-e29b-41d4-a716-446655440003",
        actor_id: "550e8400-e29b-41d4-a716-446655440004",
        status_before: "open|",
        status_after: "res%",
      }),
    ).toBe(
      "/api/v1/admin/community/moderation/cases?limit=8&report_id=550e8400-e29b-41d4-a716-446655440003&actor_id=550e8400-e29b-41d4-a716-446655440004&status_before=open%7C&status_after=res%25",
    );
    expect(
      routes.admin.communityRiskSignals({
        limit: 25,
        subject_user_id: "550e8400-e29b-41d4-a716-446655440005",
        signal_type: "rate%",
        rule_id: "ab|use",
        severity: "high",
      }),
    ).toBe(
      "/api/v1/admin/community/risk-signals?limit=25&subject_user_id=550e8400-e29b-41d4-a716-446655440005&signal_type=rate%25&rule_id=ab%7Cuse&severity=high",
    );
    expect(
      routes.admin.indexerReconcileReports({
        limit: 5,
        offset: 0,
        projection_reconcile_clean: false,
        issues_min: 3,
      }),
    ).toBe(
      "/api/v1/admin/indexer/reconcile-reports?limit=5&offset=0&projection_reconcile_clean=false&issues_min=3",
    );
  });
});
