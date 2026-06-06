import { describe, expect, it } from "vitest";

import {
  adminHomeSystemOverviewChainLagDisplay,
  adminHomeSystemOverviewRoleAssigneeTotal,
  adminHomeSystemOverviewRolesRemainder,
  adminHomeSystemOverviewTopRoles,
  adminHomeSystemOverviewUsersCount,
  computeAdminHomeUserSnapshot,
  isAdminHomeMetricsPostgresSource,
  parseAdminHomeMetricsOverview,
  parseAdminHomeObservabilityLite,
  userSnapshotFromMetrics,
} from "./adminHomeSystemOverviewMetrics";

describe("adminHomeSystemOverviewMetrics", () => {
  it("computes role counts and 7d new users from sample", () => {
    const now = Date.parse("2026-06-04T12:00:00.000Z");
    const snapshot = computeAdminHomeUserSnapshot(
      [
        { id: "1", role: "traveler", created_at: "2026-06-04T10:00:00.000Z" },
        { id: "2", role: "admin", created_at: "2026-05-20T10:00:00.000Z" },
        { id: "3", role: "traveler", created_at: "2026-06-01T10:00:00.000Z" },
      ],
      500,
      now,
    );
    expect(snapshot.sampleCount).toBe(3);
    expect(snapshot.new24h).toBe(1);
    expect(snapshot.new7d).toBe(2);
    expect(snapshot.byRole.traveler).toBe(2);
    expect(snapshot.byRole.admin).toBe(1);
  });

  it("sorts top roles by count", () => {
    expect(
      adminHomeSystemOverviewTopRoles({ b: 2, a: 5, c: 1 }).map((r) => r.role),
    ).toEqual(["a", "b", "c"]);
  });

  it("parses observability overview lite fields", () => {
    const lite = parseAdminHomeObservabilityLite({
      overview: {
        chain_id: "137",
        indexer: { lag_blocks: 3 },
        alerts: { alert_summary: { active: 2 } },
      },
    });
    expect(lite.chainId).toBe("137");
    expect(lite.indexerLagBlocks).toBe(3);
    expect(lite.alertsActive).toBe(2);
  });

  it("parses admin home metrics overview", () => {
    const metrics = parseAdminHomeMetricsOverview({
      status: "ok",
      schema_version: "admin-home-metrics-v1",
      source: "postgres",
      honesty: { admin_activity_scope: "admin_audit_logs_7d_utc" },
      users: { total: 42, by_users_role: { traveler: 40, admin: 2 } },
      trends: {
        days: ["2026-06-01", "2026-06-02"],
        user_signups: [1, 2],
        admin_activity: [10, 0],
      },
    });
    expect(metrics?.usersTotal).toBe(42);
    expect(metrics?.trends.userSignups).toEqual([1, 2]);
    expect(userSnapshotFromMetrics(metrics!).new7d).toBe(3);
  });

  it("distinguishes postgres vs memory user counts", () => {
    expect(isAdminHomeMetricsPostgresSource("postgres")).toBe(true);
    expect(isAdminHomeMetricsPostgresSource("memory")).toBe(false);
    const pgMetrics = parseAdminHomeMetricsOverview({
      status: "ok",
      users: { total: 100, by_users_role: {} },
      trends: { days: [], user_signups: [], admin_activity: [] },
      source: "postgres",
    })!;
    const memMetrics = { ...pgMetrics, source: "memory" };
    expect(adminHomeSystemOverviewUsersCount(pgMetrics, null)).toBe(100);
    expect(adminHomeSystemOverviewUsersCount(memMetrics, { sampleCount: 50 } as never)).toBe(50);
  });

  it("humanizes local dev chain ids", () => {
    expect(adminHomeSystemOverviewChainLagDisplay("31337", 0)).toEqual({
      kind: "local_dev",
      lag: 0,
    });
    expect(adminHomeSystemOverviewChainLagDisplay("137", 3)).toEqual({
      kind: "generic",
      chainId: "137",
      lag: 3,
    });
  });

  it("sums console role assignees and remainder", () => {
    const roles = { admin: 2, ops: 3, viewer: 1, auditor: 1, guest: 1 };
    expect(adminHomeSystemOverviewRoleAssigneeTotal(roles)).toBe(8);
    expect(adminHomeSystemOverviewRolesRemainder(roles, 4)).toBe(1);
    expect(adminHomeSystemOverviewTopRoles(roles, 4)).toHaveLength(4);
  });
});
