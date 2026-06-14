import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type MeAcquisitionProfile = {
  public_bio?: string | null;
  tagline?: string | null;
  avatar_url?: string | null;
  acquisition_trust_score?: number | null;
  acquisition_publish_eligible?: boolean | null;
  acquisition_publish_bond_waived?: boolean | null;
  acquisition_publish_bond_active?: boolean | null;
  acquisition_publish_bond_display?: string | null;
  acquisition_publish_suspended?: boolean | null;
  slot_state?: string | null;
  profile_patch_allowed?: boolean | null;
  acquisition_slot_state?: string | null;
  application_status?: string | null;
  rejection_codes?: string[];
  rejection_message?: string | null;
  blocked_reasons?: string[] | Record<string, boolean>;
  updated_at?: string;
};

export type PatchMeAcquisitionProfileBody = {
  public_bio?: string;
  tagline?: string;
  avatar_url?: string;
};

export async function getMeAcquisitionProfile(): Promise<{ profile?: MeAcquisitionProfile | null }> {
  const res = await fetch(apiUrl(routes.meAcquisitionProfile), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeAcquisitionProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeAcquisitionProfile | null };
}

export async function patchMeAcquisitionProfile(
  body: PatchMeAcquisitionProfileBody,
): Promise<{ profile?: MeAcquisitionProfile | null }> {
  const res = await fetch(apiUrl(routes.meAcquisitionProfile), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchMeAcquisitionProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeAcquisitionProfile | null };
}
