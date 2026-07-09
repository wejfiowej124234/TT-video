/**
 * P8-1 单测：lib/api 与 04 §三、14 路由一致
 */
// @vitest-environment node
// `apiUrl()` 在浏览器 + loopback 基址下返回相对路径；本文件按 Node/SSR 断言绝对 URL。
import { describe, it, expect } from "vitest";
import { apiBase, apiUrl, routes } from "./api";

describe("lib/api", () => {
  it("apiBase is a string URL", () => {
    expect(typeof apiBase).toBe("string");
    expect(apiBase.length).toBeGreaterThan(0);
  });

  it("apiUrl concatenates base and path", () => {
    expect(apiUrl("/meta")).toBe(`${apiBase}/meta`);
    expect(apiUrl(routes.meta)).toBe(`${apiBase}/meta`);
    expect(apiUrl(routes.orders)).toBe(`${apiBase}/api/v1/orders`);
  });

  it("routes match 04 §三", () => {
    expect(routes.meta).toBe("/meta");
    expect(routes.auth.login).toBe("/auth/login");
    expect(routes.auth.register).toBe("/auth/register");
    expect(routes.me).toBe("/api/v1/me");
    expect(routes.guides).toBe("/api/v1/guides");
    expect(routes.guideById("abc")).toBe("/api/v1/guides/abc");
    expect(routes.itineraries).toBe("/api/v1/itineraries");
    expect(routes.orders).toBe("/api/v1/orders");
    expect(routes.orderById("id-1")).toBe("/api/v1/orders/id-1");
    expect(routes.orderChainSyncStatus("id-1")).toBe("/api/v1/orders/id-1/chain-sync-status");
    expect(routes.disputes).toBe("/api/v1/disputes");
    expect(routes.disputeById("d-1")).toBe("/api/v1/disputes/d-1");
  });

  it("routes include mock-pay and intents (48 §2.2)", () => {
    expect(routes.orderMockPay("oid")).toBe("/api/v1/orders/oid/mock-pay");
    expect(routes.orderConfirmCompletionIntent("oid")).toBe("/api/v1/orders/oid/confirm-completion-intent");
    expect(routes.orderOpenDisputeIntent("oid")).toBe("/api/v1/orders/oid/open-dispute-intent");
    expect(routes.disputeExecuteResolutionIntent("did")).toBe("/api/v1/disputes/did/execute-resolution-intent");
  });

  it("routes include media signed-urls and access (04 §3.4 / 270)", () => {
    expect(routes.mediaSignedUrls).toBe("/api/v1/media/signed-urls");
    expect(routes.mediaAccess("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "/api/v1/media/access/550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("routes include traveltrust page-brief (04 B-191)", () => {
    expect(routes.traveltrustPageBrief).toBe("/api/v1/traveltrust/page-brief");
    expect(apiUrl(routes.traveltrustPageBrief)).toBe(
      `${apiBase}/api/v1/traveltrust/page-brief`,
    );
  });

  it("routes include trust growth P-SCALE1", () => {
    expect(routes.trustGrowthIngest).toBe("/api/v1/trust-growth/ingest");
    expect(routes.trustGrowthConfig).toBe("/api/v1/trust-growth/config");
  });

  it("routes include trust growth admin P-OBS1", () => {
    expect(routes.admin.trustGrowthObservability).toBe("/api/v1/admin/trust-growth/observability");
    expect(routes.admin.trustGrowthControl).toBe("/api/v1/admin/trust-growth/control");
    expect(routes.admin.trustGrowthRollbackControl).toBe("/api/v1/admin/trust-growth/rollback-control");
  });

  it("routes include governance placeholders (49 G / 84)", () => {
    expect(routes.governancePool).toBe("/api/v1/governance/pool");
    expect(routes.governanceRewards).toBe("/api/v1/governance/rewards");
    expect(routes.governanceFeeRoutes).toBe("/api/v1/governance/fee-routes");
    expect(routes.governanceVaultForwards).toBe("/api/v1/governance/vault-forwards");
    expect(routes.governanceVacancyLedger).toBe("/api/v1/governance/vacancy-ledger");
    expect(routes.adminVacancyLedgerOps).toBe("/api/v1/admin/vacancy-ledger");
    expect(routes.governanceProtocolReference).toBe("/api/v1/governance/protocol-reference");
    expect(routes.governanceProtocolReferencePending).toBe(
      "/api/v1/governance/protocol-reference/pending",
    );
  });

  it("routes.admin includes observability and fee-router (70)", () => {
    expect(routes.admin.observabilityOverview).toBe("/api/v1/admin/observability/overview");
    expect(routes.admin.metricsHomeOverview).toBe("/api/v1/admin/metrics/home-overview");
    expect(routes.admin.feeRouterRoutedEvents).toBe("/api/v1/admin/fee-router/routed-events");
    expect(routes.admin.regionVaultForwardedEvents).toBe(
      "/api/v1/admin/region-vault/forwarded-events",
    );
    expect(routes.admin.configRelease("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "/api/v1/admin/config/releases/550e8400-e29b-41d4-a716-446655440000",
    );
    expect(
      routes.admin.configReleases({ limit: 20, release_key: "ssot", status: "published" }),
    ).toBe("/api/v1/admin/config/releases?limit=20&release_key=ssot&status=published");
    expect(
      routes.admin.secretsMetadata({
        limit: 50,
        key_alias: "HMAC",
        status: "active",
        env_scope: "api",
      }),
    ).toBe("/api/v1/admin/secrets/metadata?limit=50&key_alias=HMAC&status=active&env_scope=api");
    expect(
      routes.admin.flags({ limit: 100, flag_code: "pay", enabled: "true", scope: "global" }),
    ).toBe("/api/v1/admin/flags?limit=100&flag_code=pay&enabled=true&scope=global");
    expect(
      routes.admin.tenantScopes({
        limit: 30,
        tenant_key: "def",
        region_code: "global",
        status: "active",
        scope_class: "ops",
      }),
    ).toBe(
      "/api/v1/admin/tenants/scopes?limit=30&tenant_key=def&region_code=global&status=active&scope_class=ops",
    );
    expect(
      routes.admin.policies({
        limit: 25,
        policy_code: "baseline",
        status: "active",
        scope_type: "resource",
        binding_role: "tourist",
      }),
    ).toBe(
      "/api/v1/admin/policies?limit=25&policy_code=baseline&status=active&scope_type=resource&binding_role=tourist",
    );
    expect(
      routes.admin.internalToolAudits({
        limit: 40,
        tool_id: "reg",
        action_code: "inspect",
        actor_id: "u1",
        approval_request_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toBe(
      "/api/v1/admin/internal-tools/audits?limit=40&tool_id=reg&action_code=inspect&actor_id=u1&approval_request_id=550e8400-e29b-41d4-a716-446655440000",
    );
    expect(
      routes.admin.apiVersions({ limit: 30, api_version: "v1", status: "active" }),
    ).toBe("/api/v1/admin/api-versions?limit=30&api_version=v1&status=active");
    expect(
      routes.admin.lifecycleStateMachines({
        limit: 25,
        machine_code: "escrow",
        domain: "order",
        entity_type: "escrow",
        version: "1",
        source_of_truth: "db",
        anomaly_flag: "false",
      }),
    ).toBe(
      "/api/v1/admin/lifecycle/state-machines?limit=25&machine_code=escrow&domain=order&entity_type=escrow&version=1&source_of_truth=db&anomaly_flag=false",
    );
    expect(
      routes.admin.mediaAccessLogs({
        limit: 40,
        action: "read_ok",
        object_id: "evidence|",
        actor_or_ip: "127",
        token_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toBe(
      "/api/v1/admin/media/access-logs?limit=40&action=read_ok&object_id=evidence%7C&actor_or_ip=127&token_id=550e8400-e29b-41d4-a716-446655440000",
    );
    expect(
      routes.admin.complianceDataRequests({
        limit: 30,
        request_ref: "DSAR",
        subject_id: "0000",
        request_type: "export",
        status: "open",
        jurisdiction: "EU",
      }),
    ).toBe(
      "/api/v1/admin/compliance/data-requests?limit=30&request_ref=DSAR&subject_id=0000&request_type=export&status=open&jurisdiction=EU",
    );
    expect(
      routes.admin.complianceDataRequestEvents("550e8400-e29b-41d4-a716-446655440000", {
        limit: 25,
        event_type: "status%",
      }),
    ).toBe(
      "/api/v1/admin/compliance/data-requests/550e8400-e29b-41d4-a716-446655440000/events?limit=25&event_type=status%25",
    );
    expect(
      routes.admin.mediaSignedUrlTokens({
        limit: 20,
        object_id: "evidence|x",
        url_scope: "read",
        issued_to: "550e8400-e29b-41d4-a716-446655440001",
        token_id: "550e8400-e29b-41d4-a716-446655440002",
      }),
    ).toBe(
      "/api/v1/admin/media/signed-url-tokens?limit=20&object_id=evidence%7Cx&url_scope=read&issued_to=550e8400-e29b-41d4-a716-446655440001&token_id=550e8400-e29b-41d4-a716-446655440002",
    );
    expect(routes.admin.indexerReconcileReports({ limit: 10, offset: 0, chain_id: "1" })).toBe(
      "/api/v1/admin/indexer/reconcile-reports?limit=10&offset=0&chain_id=1",
    );
    expect(
      routes.admin.indexerReconcileReportsExport({ limit: 10, offset: 0, chain_id: "1" }),
    ).toBe(
      "/api/v1/admin/indexer/reconcile-reports/export?format=csv&limit=10&offset=0&chain_id=1",
    );
    expect(
      routes.admin.indexerReconcileReportsExport({ format: "json", limit: 5, offset: 0 }),
    ).toBe("/api/v1/admin/indexer/reconcile-reports/export?format=json&limit=5&offset=0");
    expect(
      routes.admin.indexerReconcileReportsExport({
        format: "json",
        exportScope: "all",
        limit: 100,
      }),
    ).toBe("/api/v1/admin/indexer/reconcile-reports/export?format=json&export_scope=all&limit=100");
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
    expect(routes.admin.orders()).toBe("/api/v1/admin/orders");
    expect(routes.admin.orders({ limit: 80, state: "draft" })).toBe(
      "/api/v1/admin/orders?limit=80&state=draft",
    );
    expect(routes.admin.disputes()).toBe("/api/v1/admin/disputes");
    expect(routes.admin.disputes({ limit: 25, status: "open" })).toBe(
      "/api/v1/admin/disputes?limit=25&status=open",
    );
    expect(routes.admin.auditLogs()).toBe("/api/v1/admin/audit-logs");
    expect(
      routes.admin.auditLogs({
        limit: 30,
        actor_id: "550e8400-e29b-41d4-a716-446655440000",
        action: "admin.orders.read",
        resource_type: "orders",
      }),
    ).toBe(
      "/api/v1/admin/audit-logs?limit=30&actor_id=550e8400-e29b-41d4-a716-446655440000&action=admin.orders.read&resource_type=orders",
    );
    expect(routes.admin.reviews()).toBe("/api/v1/admin/reviews");
    expect(routes.admin.reviews({ limit: 100, max_score: 2 })).toBe(
      "/api/v1/admin/reviews?limit=100&max_score=2",
    );
    expect(routes.admin.reviews({ limit: 50, min_score: 1, max_score: 3 })).toBe(
      "/api/v1/admin/reviews?limit=50&min_score=1&max_score=3",
    );
    expect(routes.admin.users()).toBe("/api/v1/admin/users");
    expect(
      routes.admin.users({
        limit: 40,
        role: "guide",
        kyc_status: "none",
      }),
    ).toBe("/api/v1/admin/users?limit=40&role=guide&kyc_status=none");
    expect(routes.admin.guides()).toBe("/api/v1/admin/guides");
    expect(routes.admin.guides({ limit: 20, status: "pending_review" })).toBe(
      "/api/v1/admin/guides?limit=20&status=pending_review",
    );
    expect(routes.admin.approvals()).toBe("/api/v1/admin/approvals");
    expect(routes.admin.approvals({ limit: 50, status: "pending" })).toBe(
      "/api/v1/admin/approvals?limit=50&status=pending",
    );
    expect(routes.admin.auditOperations()).toBe("/api/v1/admin/audit/operations");
    expect(routes.admin.auditOperations({ limit: 100 })).toBe("/api/v1/admin/audit/operations?limit=100");
    expect(routes.admin.guideById("g1")).toBe("/api/v1/admin/guides/g1");
    expect(routes.admin.auditLogById("a1")).toBe("/api/v1/admin/audit-logs/a1");
    expect(routes.admin.approvalById("p1")).toBe("/api/v1/admin/approvals/p1");
    expect(routes.admin.orderById("a-b")).toBe("/api/v1/admin/orders/a-b");
    expect(routes.admin.disputeById("c-d")).toBe("/api/v1/admin/disputes/c-d");
    expect(routes.admin.userById("u1")).toBe("/api/v1/admin/users/u1");
    expect(routes.admin.reviewById("r1")).toBe("/api/v1/admin/reviews/r1");
  });
});
