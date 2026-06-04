export type LifecycleStateMachineRow = {
  machine_code?: string;
  domain?: string;
  version?: string | null;
  entity_type?: string;
  current_state?: string;
  expected_state?: string;
  anomaly_flag?: boolean | null;
  anomaly_type?: string | null;
  last_transition_at?: string | null;
  source_of_truth?: string | null;
  repairable?: boolean | null;
};

export type LifecycleListRes = {
  status?: string;
  error?: string;
  items?: LifecycleStateMachineRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const LIFECYCLE_MACHINE_CODE_MAX = 128;
export const LIFECYCLE_DOMAIN_MAX = 64;
export const LIFECYCLE_ENTITY_MAX = 64;
export const LIFECYCLE_VERSION_MAX = 32;
export const LIFECYCLE_SOT_MAX = 128;

const ANOMALY_URL = new Set(["true", "false", "1", "0", "yes", "no"]);

export function normalizeLifecycleAnomalyUrl(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  return ANOMALY_URL.has(t) ? t : "";
}

export function parseLifecycleListQuery(sp: URLSearchParams): {
  limit: number;
  machineCode: string;
  domain: string;
  entityType: string;
  version: string;
  sourceOfTruth: string;
  anomalyFlag: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const machineCode = (sp.get("machine_code") ?? "").trim().slice(0, LIFECYCLE_MACHINE_CODE_MAX);
  const domain = (sp.get("domain") ?? "").trim().slice(0, LIFECYCLE_DOMAIN_MAX);
  const entityType = (sp.get("entity_type") ?? "").trim().slice(0, LIFECYCLE_ENTITY_MAX);
  const version = (sp.get("version") ?? "").trim().slice(0, LIFECYCLE_VERSION_MAX);
  const sourceOfTruth = (sp.get("source_of_truth") ?? "").trim().slice(0, LIFECYCLE_SOT_MAX);
  const anomalyFlag = normalizeLifecycleAnomalyUrl(sp.get("anomaly_flag") ?? "");
  return { limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag };
}

export function buildLifecycleListPath(q: {
  limit: number;
  machineCode: string;
  domain: string;
  entityType: string;
  version: string;
  sourceOfTruth: string;
  anomalyFlag: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const mc = q.machineCode.trim().slice(0, LIFECYCLE_MACHINE_CODE_MAX);
  if (mc) sp.set("machine_code", mc);
  const d = q.domain.trim().slice(0, LIFECYCLE_DOMAIN_MAX);
  if (d) sp.set("domain", d);
  const et = q.entityType.trim().slice(0, LIFECYCLE_ENTITY_MAX);
  if (et) sp.set("entity_type", et);
  const v = q.version.trim().slice(0, LIFECYCLE_VERSION_MAX);
  if (v) sp.set("version", v);
  const sot = q.sourceOfTruth.trim().slice(0, LIFECYCLE_SOT_MAX);
  if (sot) sp.set("source_of_truth", sot);
  const af = normalizeLifecycleAnomalyUrl(q.anomalyFlag);
  if (af) sp.set("anomaly_flag", af);
  return `/admin/lifecycle?${sp.toString()}`;
}
