/**
 * P8-1 单测：lib/api routes.admin（台账列表与 :id）与 04 §三、14、70 管理面路径一致
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { routes } from "./api";

describe("lib/api routes.admin · lists and byId", () => {
  it("orders, disputes, audit, reviews, users, guides, approvals, audit ops, byId paths", () => {
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
    expect(routes.admin.auditOperations({ limit: 100 })).toBe(
      "/api/v1/admin/audit/operations?limit=100",
    );
    expect(routes.admin.guideById("g1")).toBe("/api/v1/admin/guides/g1");
    expect(routes.admin.auditLogById("a1")).toBe("/api/v1/admin/audit-logs/a1");
    expect(routes.admin.approvalById("p1")).toBe("/api/v1/admin/approvals/p1");
    expect(routes.admin.orderById("a-b")).toBe("/api/v1/admin/orders/a-b");
    expect(routes.admin.disputeById("c-d")).toBe("/api/v1/admin/disputes/c-d");
    expect(routes.admin.userById("u1")).toBe("/api/v1/admin/users/u1");
    expect(routes.admin.reviewById("r1")).toBe("/api/v1/admin/reviews/r1");
  });
});
