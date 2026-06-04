export type ComplianceEventRow = {
  id?: string;
  request_id?: string;
  event_type?: string;
  event_detail?: string | null;
  occurred_at?: string;
};

export type ComplianceEventsListRes = {
  status?: string;
  error?: string;
  items?: ComplianceEventRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const COMPLIANCE_EVENTS_EVENT_TYPE_MAX = 128;

export function truncComplianceEventDetail(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function parseComplianceEventsQuery(sp: URLSearchParams): { limit: number; eventType: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const eventType = (sp.get("event_type") ?? "").trim().slice(0, COMPLIANCE_EVENTS_EVENT_TYPE_MAX);
  return { limit, eventType };
}

export function buildComplianceEventsPath(
  requestId: string,
  q: { limit: number; eventType: string },
): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const et = q.eventType.trim().slice(0, COMPLIANCE_EVENTS_EVENT_TYPE_MAX);
  if (et) sp.set("event_type", et);
  const base = `/admin/compliance/requests/${encodeURIComponent(requestId)}/events`;
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
