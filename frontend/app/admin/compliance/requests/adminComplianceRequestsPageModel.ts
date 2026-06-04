export type Sla = { due_at?: string; seconds_until_due?: number; overdue?: boolean };

export type DsarRow = {
  id?: string;
  request_ref?: string;
  subject_id?: string;
  request_type?: string;
  status?: string;
  due_at?: string | null;
  sla_hours?: number | null;
  sla?: Sla;
  jurisdiction?: string | null;
  notes?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
};

export type ComplianceRequestsListRes = {
  status?: string;
  error?: string;
  items?: DsarRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const COMPLIANCE_REQUESTS_REF_MAX = 256;
export const COMPLIANCE_REQUESTS_SUBJECT_MAX = 256;
export const COMPLIANCE_REQUESTS_JURIS_MAX = 128;

const TYPE_URL = new Set(["export", "erasure"]);
const STATUS_URL = new Set(["open", "in_progress", "completed", "rejected", "cancelled"]);

export function parseComplianceRequestsListQuery(sp: URLSearchParams): {
  limit: number;
  requestRef: string;
  subjectId: string;
  requestType: string;
  status: string;
  jurisdiction: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const requestRef = (sp.get("request_ref") ?? "").trim().slice(0, COMPLIANCE_REQUESTS_REF_MAX);
  const subjectId = (sp.get("subject_id") ?? "").trim().slice(0, COMPLIANCE_REQUESTS_SUBJECT_MAX);
  const rawType = (sp.get("request_type") ?? "").trim().toLowerCase();
  const requestType = TYPE_URL.has(rawType) ? rawType : "";
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = STATUS_URL.has(rawSt) ? rawSt : "";
  const jurisdiction = (sp.get("jurisdiction") ?? "").trim().slice(0, COMPLIANCE_REQUESTS_JURIS_MAX);
  return { limit, requestRef, subjectId, requestType, status, jurisdiction };
}

export function buildComplianceRequestsListPath(q: {
  limit: number;
  requestRef: string;
  subjectId: string;
  requestType: string;
  status: string;
  jurisdiction: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const rr = q.requestRef.trim().slice(0, COMPLIANCE_REQUESTS_REF_MAX);
  if (rr) sp.set("request_ref", rr);
  const sid = q.subjectId.trim().slice(0, COMPLIANCE_REQUESTS_SUBJECT_MAX);
  if (sid) sp.set("subject_id", sid);
  if (q.requestType === "export" || q.requestType === "erasure") {
    sp.set("request_type", q.requestType);
  }
  if (STATUS_URL.has(q.status)) sp.set("status", q.status);
  const jur = q.jurisdiction.trim().slice(0, COMPLIANCE_REQUESTS_JURIS_MAX);
  if (jur) sp.set("jurisdiction", jur);
  return `/admin/compliance/requests?${sp.toString()}`;
}

export function normalizeComplianceRequestTypeUrl(raw: string): string {
  const rt = raw.trim().toLowerCase();
  return TYPE_URL.has(rt) ? rt : "";
}

export function normalizeComplianceStatusUrl(raw: string): string {
  const st = raw.trim().toLowerCase();
  return STATUS_URL.has(st) ? st : "";
}

export function slaHint(sla: Sla | undefined, dash: string): string {
  if (!sla || typeof sla !== "object") return dash;
  if (sla.overdue) return "overdue";
  if (sla.seconds_until_due != null) return `${sla.seconds_until_due}s`;
  return sla.due_at ?? dash;
}
