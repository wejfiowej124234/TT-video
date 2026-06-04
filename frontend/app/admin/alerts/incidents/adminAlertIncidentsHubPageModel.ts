export const INCIDENT_Q = "incident_id";
export const INCIDENT_MAX = 512;

export const ADMIN_ALERT_INCIDENTS_HUB_FORM_ID = "admin-alert-incidents-hub-form";

export function parseIncidentHubQuery(sp: URLSearchParams): { incidentId: string } {
  return { incidentId: (sp.get(INCIDENT_Q) ?? "").trim().slice(0, INCIDENT_MAX) };
}

export function buildIncidentHubPath(incidentId: string): string {
  const id = incidentId.trim().slice(0, INCIDENT_MAX);
  if (!id) return "/admin/alerts/incidents";
  const sp = new URLSearchParams();
  sp.set(INCIDENT_Q, id);
  return `/admin/alerts/incidents?${sp.toString()}`;
}
