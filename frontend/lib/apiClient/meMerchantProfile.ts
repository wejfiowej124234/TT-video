import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type MeMerchantProfile = {
  merchant_id?: string;
  shop_name?: string;
  city?: string;
  country_code?: string;
  categories?: string[];
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  application_status?: string | null;
  slot_state?: string | null;
  profile_patch_allowed?: boolean | null;
  rejection_codes?: string[];
  rejection_message?: string | null;
  blocked_reasons?: string[] | Record<string, boolean>;
  updated_at?: string;
};

export type PatchMeMerchantProfileBody = {
  shop_name?: string;
  city?: string;
  country_code?: string;
  categories?: string[];
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
};

export async function getMeMerchantProfile(): Promise<{ profile?: MeMerchantProfile | null }> {
  const res = await fetch(apiUrl(routes.meMerchantProfile), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  if (res.status === 404) {
    return { profile: null };
  }
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeMerchantProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeMerchantProfile | null };
}

export async function patchMeMerchantProfile(
  body: PatchMeMerchantProfileBody,
): Promise<{ profile?: MeMerchantProfile | null }> {
  const res = await fetch(apiUrl(routes.meMerchantProfile), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchMeMerchantProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeMerchantProfile | null };
}
