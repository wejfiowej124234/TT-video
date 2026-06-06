/** ① 工作台「系统概况」· 用户列表样本聚合（非全库 KPI · 诚实标注）。 */

export const ADMIN_HOME_SYSTEM_OVERVIEW_USER_LIMIT = 500;

export type AdminHomeUserListItem = {
  id: string;
  role: string;
  created_at?: string | null;
};

export type AdminHomeUserSnapshot = {
  sampleCount: number;
  limit: number;
  possiblyTruncated: boolean;
  new24h: number;
  new7d: number;
  byRole: Record<string, number>;
};

const MS_DAY = 86_400_000;

export function computeAdminHomeUserSnapshot(
  items: AdminHomeUserListItem[],
  limit: number,
  nowMs = Date.now(),
): AdminHomeUserSnapshot {
  const weekMs = 7 * MS_DAY;
  let new24h = 0;
  let new7d = 0;
  const byRole: Record<string, number> = {};

  for (const u of items) {
    const role = u.role?.trim() || "unknown";
    byRole[role] = (byRole[role] ?? 0) + 1;
    const ts = u.created_at ? Date.parse(u.created_at) : NaN;
    if (!Number.isFinite(ts)) continue;
    const age = nowMs - ts;
    if (age >= 0 && age <= MS_DAY) new24h += 1;
    if (age >= 0 && age <= weekMs) new7d += 1;
  }

  return {
    sampleCount: items.length,
    limit,
    possiblyTruncated: items.length >= limit,
    new24h,
    new7d,
    byRole,
  };
}

export function adminHomeSystemOverviewTopRoles(
  byRole: Record<string, number>,
  max = 4,
): { role: string; count: number }[] {
  return Object.entries(byRole)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role))
    .slice(0, max);
}

export function parseAdminHomeObservabilityLite(body: unknown): AdminHomeObservabilityLite {
  const root = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const overview =
    root?.overview && typeof root.overview === "object"
      ? (root.overview as Record<string, unknown>)
      : null;
  const indexer =
    overview?.indexer && typeof overview.indexer === "object"
      ? (overview.indexer as Record<string, unknown>)
      : null;
  const alerts =
    overview?.alerts && typeof overview.alerts === "object"
      ? (overview.alerts as Record<string, unknown>)
      : null;

  const chainRaw = overview?.chain_id;
  const chainId =
    typeof chainRaw === "string" || typeof chainRaw === "number" ? String(chainRaw) : null;

  const lagRaw = indexer?.lag_blocks;
  const indexerLagBlocks =
    typeof lagRaw === "number" && Number.isFinite(lagRaw) ? lagRaw : null;

  const alertSummary =
    alerts?.alert_summary && typeof alerts.alert_summary === "object"
      ? (alerts.alert_summary as Record<string, unknown>)
      : null;
  const activeRaw = alertSummary?.active ?? alerts?.active;
  const alertsActive =
    typeof activeRaw === "number" && Number.isFinite(activeRaw) ? activeRaw : null;

  return { chainId, indexerLagBlocks, alertsActive };
}

export type AdminHomeObservabilityLite = {
  chainId: string | null;
  indexerLagBlocks: number | null;
  alertsActive: number | null;
};

export type AdminHomeMetricsTrends = {
  days: string[];
  userSignups: number[];
  adminActivity: number[];
};

export type AdminHomeMetricsOverview = {
  schemaVersion: string;
  source: string;
  usersTotal: number;
  byUsersRole: Record<string, number>;
  byConsoleRole: Record<string, number> | null;
  trends: AdminHomeMetricsTrends;
  adminActivityAvailable: boolean;
  honestyNote: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function numberArray(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "number" && Number.isFinite(x) ? x : 0));
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function roleMap(v: unknown): Record<string, number> {
  const rec = asRecord(v);
  if (!rec) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(rec)) {
    if (typeof val === "number" && Number.isFinite(val)) out[k] = val;
  }
  return out;
}

export function parseAdminHomeMetricsOverview(body: unknown): AdminHomeMetricsOverview | null {
  const root = asRecord(body);
  if (!root || root.status !== "ok") return null;
  const users = asRecord(root.users);
  const trends = asRecord(root.trends);
  const honesty = asRecord(root.honesty);
  if (!users || !trends) return null;

  const adminScope = typeof honesty?.admin_activity_scope === "string" ? honesty.admin_activity_scope : "";
  return {
    schemaVersion: typeof root.schema_version === "string" ? root.schema_version : "admin-home-metrics-v1",
    source: typeof root.source === "string" ? root.source : "unknown",
    usersTotal: typeof users.total === "number" ? users.total : 0,
    byUsersRole: roleMap(users.by_users_role),
    byConsoleRole: users.by_console_role ? roleMap(users.by_console_role) : null,
    trends: {
      days: stringArray(trends.days),
      userSignups: numberArray(trends.user_signups),
      adminActivity: numberArray(trends.admin_activity),
    },
    adminActivityAvailable: !adminScope.includes("unavailable"),
    honestyNote: typeof honesty?.site_traffic_note === "string" ? honesty.site_traffic_note : null,
  };
}

export function userSnapshotFromMetrics(metrics: AdminHomeMetricsOverview): AdminHomeUserSnapshot {
  const new7d = metrics.trends.userSignups.reduce((a, b) => a + b, 0);
  const new24h =
    metrics.trends.userSignups.length > 0
      ? metrics.trends.userSignups[metrics.trends.userSignups.length - 1] ?? 0
      : 0;
  return {
    sampleCount: metrics.usersTotal,
    limit: metrics.usersTotal,
    possiblyTruncated: metrics.source === "memory",
    new24h,
    new7d,
    byRole: metrics.byUsersRole,
  };
}

export function isAdminHomeMetricsPostgresSource(source: string | undefined | null): boolean {
  return source === "postgres";
}

export function adminHomeSystemOverviewUsersCount(
  metrics: AdminHomeMetricsOverview | null,
  users: AdminHomeUserSnapshot | null,
): number {
  if (metrics && isAdminHomeMetricsPostgresSource(metrics.source)) {
    return metrics.usersTotal;
  }
  return users?.sampleCount ?? metrics?.usersTotal ?? 0;
}

export function adminHomeSystemOverviewRoleAssigneeTotal(byRole: Record<string, number>): number {
  return Object.values(byRole).reduce((sum, n) => sum + n, 0);
}

export function adminHomeSystemOverviewRolesRemainder(
  byRole: Record<string, number>,
  shownMax: number,
): number {
  return Math.max(0, Object.keys(byRole).length - shownMax);
}

export type AdminHomeChainLagDisplay =
  | { kind: "local_dev"; lag: number | null }
  | { kind: "generic"; chainId: string; lag: number | null }
  | { kind: "empty" };

/** 本地 dev 链 ID 人话化（31337 / 1337 等）。 */
export function adminHomeSystemOverviewChainLagDisplay(
  chainId: string | null,
  lagBlocks: number | null,
): AdminHomeChainLagDisplay {
  if (!chainId?.trim()) return { kind: "empty" };
  const id = chainId.trim();
  if (id === "31337" || id === "1337") {
    return { kind: "local_dev", lag: lagBlocks };
  }
  return { kind: "generic", chainId: id, lag: lagBlocks };
}
