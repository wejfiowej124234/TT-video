/**
 * P8-1 单测：lib/api routes.admin（媒体 / 合规 / 索引对账导出）与 04 §三、14、70 管理面路径一致
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { routes } from "./api";

describe("lib/api routes.admin · media compliance indexer", () => {
  it("media access logs, compliance DSAR, signed-url tokens, reconcile list & export", () => {
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
  });
});
