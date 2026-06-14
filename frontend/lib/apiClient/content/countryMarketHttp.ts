import { apiUrl, routes } from "../../api";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type CountryMarketLaunchRow = {
  id: string;
  jurisdiction_iso: string;
  catalog_country_id?: string | null;
  phase: string;
  checklist?: Record<string, unknown>;
  owner_user_id?: string | null;
  launched_at?: string | null;
  evidence_ref?: string | null;
  created_at?: string;
  updated_at?: string;
};

function adminHeaders() {
  return { ...writeRequestHeaders(), "x-request-id": requestId() };
}

export async function getAdminCountryMarketLaunches(params?: {
  phase?: string;
  limit?: number;
}): Promise<{ items?: CountryMarketLaunchRow[] }> {
  const q = new URLSearchParams();
  if (params?.phase?.trim()) q.set("phase", params.phase.trim());
  if (params?.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.adminCountryMarketLaunches}${suffix}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminCountryMarketLaunches", data);
  return data as { items?: CountryMarketLaunchRow[] };
}

export async function postAdminCountryMarketLaunch(body: {
  jurisdiction_iso: string;
  catalog_country_id?: string;
  owner_user_id?: string;
}): Promise<{ item?: CountryMarketLaunchRow }> {
  const res = await fetch(apiUrl(routes.adminCountryMarketLaunches), {
    method: "POST",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postAdminCountryMarketLaunch", data);
  return data as { item?: CountryMarketLaunchRow };
}
