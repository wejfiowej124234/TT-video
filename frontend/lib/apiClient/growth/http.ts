import { apiUrl, routes } from "../../api";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type ReferralValidateResponse = {
  status?: string;
  valid?: boolean;
  code?: string;
  code_type?: string | null;
  label?: string | null;
  is_active?: boolean | null;
  reason?: string | null;
  error?: string;
};

export async function getReferralValidate(code: string): Promise<ReferralValidateResponse> {
  const q = new URLSearchParams({ code: code.trim() });
  const res = await fetch(apiUrl(`${routes.growthReferralsValidate}?${q}`), {
    method: "GET",
    headers: { ...writeRequestHeaders(), "x-request-id": requestId() },
  });
  const data = (await parseResponse(res)) as ReferralValidateResponse;
  logApiJsonStatusNotOk("getReferralValidate", data);
  return data;
}

export type AdminReferralCodeRow = {
  id: string;
  code: string;
  code_type: string;
  owner_user_id?: string | null;
  region_iso?: string | null;
  label?: string | null;
  is_active: boolean;
  max_uses?: number | null;
  use_count: number;
  created_at?: string;
  updated_at?: string;
};

export async function getAdminReferralCodes(params?: {
  is_active?: boolean;
  code_type?: string;
}): Promise<{ items?: AdminReferralCodeRow[]; count?: number }> {
  const q = new URLSearchParams();
  if (params?.is_active != null) q.set("is_active", params.is_active ? "true" : "false");
  if (params?.code_type?.trim()) q.set("code_type", params.code_type.trim());
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.adminGrowthReferralCodes}${suffix}`), {
    headers: { ...writeRequestHeaders(), "x-request-id": requestId() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminReferralCodes", data);
  return data as { items?: AdminReferralCodeRow[]; count?: number };
}

export async function postAdminReferralCode(body: {
  code?: string;
  code_type: string;
  owner_user_id: string;
  label?: string;
  max_uses?: number;
}): Promise<{ item?: AdminReferralCodeRow }> {
  const res = await fetch(apiUrl(routes.adminGrowthReferralCodes), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...writeRequestHeaders(),
      "x-request-id": requestId(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postAdminReferralCode", data);
  return data as { item?: AdminReferralCodeRow };
}

export async function patchAdminReferralCode(
  id: string,
  body: { is_active?: boolean; label?: string; max_uses?: number | null },
): Promise<{ item?: AdminReferralCodeRow }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthReferralCodes}/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...writeRequestHeaders(),
      "x-request-id": requestId(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminReferralCode", data);
  return data as { item?: AdminReferralCodeRow };
}
