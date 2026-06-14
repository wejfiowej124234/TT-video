import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type MeStewardProfile = {
  steward_id?: string;
  motivation?: string | null;
  tagline?: string | null;
  jurisdictions?: string[];
  status?: string | null;
  stake_display?: string | null;
  stake_amount?: string | null;
  application_status?: string | null;
  slot_state?: string | null;
  profile_patch_allowed?: boolean | null;
  rejection_codes?: string[];
  rejection_message?: string | null;
  blocked_reasons?: string[] | Record<string, boolean>;
  updated_at?: string;
};

export type PatchMeStewardProfileBody = {
  motivation?: string;
  tagline?: string;
};

export async function getMeStewardProfile(): Promise<{ profile?: MeStewardProfile | null }> {
  const res = await fetch(apiUrl(routes.meRegionStewardProfile), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  if (res.status === 404) {
    return { profile: null };
  }
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeStewardProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeStewardProfile | null };
}

export async function patchMeStewardProfile(
  body: PatchMeStewardProfileBody,
): Promise<{ profile?: MeStewardProfile | null }> {
  const res = await fetch(apiUrl(routes.meRegionStewardProfile), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchMeStewardProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeStewardProfile | null };
}
