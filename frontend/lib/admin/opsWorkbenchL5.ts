/**
 * Batch-11 W09 · ops workbench honesty · HU-412 / HU-420 / HU-422
 * FE readonly · ≠ REAL_DB projection deploy · ≠ fund write · ≠ Production GO
 */

export const OPS_WORKBENCH_L5_W09_PROBE = "ops-workbench-l5-batch11-w09-v1" as const;

export const OPS_FOUR_LEAF_IDS = ["users", "guides", "orders", "disputes"] as const;
export type OpsFourLeafId = (typeof OPS_FOUR_LEAF_IDS)[number];

export type OpsDataSourceTone = "real_db" | "memory" | "mixed" | "unavailable";

export type OpsListDataSourceStrip = {
  tone: OpsDataSourceTone;
  labelKey: string;
  metaSource: string | null;
};

function normalizeSource(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  return s.length > 0 ? s : null;
}

export function classifyOpsMetaSource(source: string | null): OpsDataSourceTone {
  if (!source) return "unavailable";
  if (
    source.includes("postgres") ||
    source === "pg" ||
    source.includes("real_db") ||
    source === "database"
  ) {
    return "real_db";
  }
  if (
    source === "memory" ||
    source.includes("chain_off") ||
    source.includes("dev_memory") ||
    source === "in_memory"
  ) {
    return "memory";
  }
  return "mixed";
}

/**
 * HU-412 / HU-420 · list meta.source → fail-closed data-source strip.
 * Prefer meta.source; fall back to applied_filters.source when present.
 */
export function resolveOpsListDataSourceStrip(
  meta: Record<string, unknown> | null | undefined,
  appliedFilters?: Record<string, unknown> | null | undefined,
): OpsListDataSourceStrip {
  const metaSource =
    normalizeSource(meta?.source) ?? normalizeSource(appliedFilters?.source);
  const tone = classifyOpsMetaSource(metaSource);
  if (tone === "unavailable") {
    return {
      tone,
      labelKey: "admin_ops_leaf_data_source_unavailable",
      metaSource: null,
    };
  }
  if (tone === "real_db") {
    return {
      tone,
      labelKey: "admin_ops_leaf_data_source_real_db",
      metaSource,
    };
  }
  if (tone === "memory") {
    return {
      tone,
      labelKey: "admin_ops_leaf_data_source_memory",
      metaSource,
    };
  }
  return {
    tone: "mixed",
    labelKey: "admin_ops_leaf_data_source_mixed",
    metaSource,
  };
}

export type OpsKpiSourceKind = "real_db" | "memory" | "unknown";

export function classifyOpsKpiSource(source: string | null | undefined): OpsKpiSourceKind {
  const tone = classifyOpsMetaSource(normalizeSource(source ?? null));
  if (tone === "real_db") return "real_db";
  if (tone === "memory") return "memory";
  return "unknown";
}

/** Batch-12 HU-456 · workbench four-leaf strip mode */
export type FourLeafHomeMemoryRiskMode = "risk" | "real_db_ok";

/**
 * HU-456 · MEMORY 条仅在 memory/unknown 显示；双源均为 REAL_DB 时 OK 芯片（禁狼来了）。
 * Fail-closed：任一非 REAL_DB → risk。
 */
export function resolveFourLeafHomeMemoryRiskMode(
  metricsSource: string | null | undefined,
  kpiSource: string | null | undefined,
): FourLeafHomeMemoryRiskMode {
  const metricsKind = classifyOpsKpiSource(metricsSource);
  const kpiKind = classifyOpsKpiSource(kpiSource);
  if (metricsKind === "real_db" && kpiKind === "real_db") return "real_db_ok";
  return "risk";
}

/**
 * Merge orders + disputes KPI channel sources · fail-closed toward memory/unknown.
 */
export function mergeOpsKpiSources(
  ordersSource: string | null,
  disputesSource: string | null,
): string | null {
  const a = classifyOpsKpiSource(ordersSource);
  const b = classifyOpsKpiSource(disputesSource);
  if (a === "memory" || b === "memory") return "memory";
  if (a === "unknown" || b === "unknown") return null;
  if (a === "real_db" && b === "real_db") return "postgres";
  return null;
}

export type OpsDomainLampOpsResult = {
  tone: "ok" | "attention" | "neutral" | "unknown";
  sourceKind: OpsKpiSourceKind;
  sourceBadgeKey: string;
};

/**
 * HU-422 · 经营域灯：memory / unknown KPI 不得假绿（ok）。
 */
export function resolveOperationsDomainLamp(input: {
  orders: number | null;
  disputes: number | null;
  kpiLoading: boolean;
  kpiSource: string | null | undefined;
}): OpsDomainLampOpsResult {
  const sourceKind = classifyOpsKpiSource(input.kpiSource ?? null);
  const sourceBadgeKey =
    sourceKind === "real_db"
      ? "admin_home_domain_health_ops_source_real_db"
      : sourceKind === "memory"
        ? "admin_home_domain_health_ops_source_memory"
        : "admin_home_domain_health_ops_source_unknown";

  if (input.kpiLoading || input.orders === null || input.disputes === null) {
    return { tone: "unknown", sourceKind, sourceBadgeKey };
  }
  if (input.disputes > 0) {
    return { tone: "attention", sourceKind, sourceBadgeKey };
  }
  if (sourceKind === "real_db") {
    return { tone: "ok", sourceKind, sourceBadgeKey };
  }
  if (sourceKind === "memory") {
    return { tone: "neutral", sourceKind, sourceBadgeKey };
  }
  return { tone: "unknown", sourceKind, sourceBadgeKey };
}

/**
 * Batch-12 HU-449 · 绿点（ok）仅 REAL_DB 可宣称健康。
 * memory / unknown 下 ok → neutral（attention 待办黄点保留）。
 */
export function clampDomainHealthToneNoFakeGreen(
  tone: "ok" | "attention" | "neutral" | "unknown",
  kpiSourceKind: OpsKpiSourceKind,
): "ok" | "attention" | "neutral" | "unknown" {
  if (tone === "ok" && kpiSourceKind !== "real_db") return "neutral";
  return tone;
}
