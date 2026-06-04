import { isUuidString } from "@/lib/isUuidString";

export type AdminRiskSignalRow = {
  id?: string;
  subject_user_id?: string;
  signal_type?: string;
  rule_id?: string | null;
  severity?: string | number | null;
  context?: unknown;
  created_at?: string;
};

export type AdminRiskSignalsResponse = {
  status?: string;
  error?: string;
  items?: AdminRiskSignalRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const ADMIN_RISK_SIGNALS_ST_MAX = 128;
export const ADMIN_RISK_SIGNALS_RID_MAX = 128;
export const ADMIN_RISK_SIGNALS_SEV_MAX = 64;

export function adminRiskSignalsContextPreview(c: unknown, dash: string): string {
  if (c == null) return dash;
  try {
    const s = typeof c === "string" ? c : JSON.stringify(c);
    return s.length > 96 ? `${s.slice(0, 96)}…` : s;
  } catch {
    return dash;
  }
}

export function parseRiskSignalsQuery(sp: URLSearchParams): {
  limit: number;
  subjectUserId: string;
  signalType: string;
  ruleId: string;
  severity: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawS = (sp.get("subject_user_id") ?? "").trim();
  const subjectUserId = isUuidString(rawS) ? rawS : "";
  const signalType = (sp.get("signal_type") ?? "").trim().slice(0, ADMIN_RISK_SIGNALS_ST_MAX);
  const ruleId = (sp.get("rule_id") ?? "").trim().slice(0, ADMIN_RISK_SIGNALS_RID_MAX);
  const severity = (sp.get("severity") ?? "").trim().slice(0, ADMIN_RISK_SIGNALS_SEV_MAX);
  return { limit, subjectUserId, signalType, ruleId, severity };
}

export function buildRiskSignalsPath(q: {
  limit: number;
  subjectUserId: string;
  signalType: string;
  ruleId: string;
  severity: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.subjectUserId && isUuidString(q.subjectUserId)) sp.set("subject_user_id", q.subjectUserId.trim());
  const st = q.signalType.trim().slice(0, ADMIN_RISK_SIGNALS_ST_MAX);
  if (st) sp.set("signal_type", st);
  const rid = q.ruleId.trim().slice(0, ADMIN_RISK_SIGNALS_RID_MAX);
  if (rid) sp.set("rule_id", rid);
  const sev = q.severity.trim().slice(0, ADMIN_RISK_SIGNALS_SEV_MAX);
  if (sev) sp.set("severity", sev);
  return `/admin/community/risk-signals?${sp.toString()}`;
}
