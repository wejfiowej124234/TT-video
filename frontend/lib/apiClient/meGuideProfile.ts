import { apiUrl } from "../api";
import { routes } from "@/lib/api/routes";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type MeGuideApplicationMaterials = {
  wallet_address?: string | null;
  real_name?: string | null;
  id_photo_submitted?: boolean;
  id_photo_url?: string | null;
  language_cert_submitted?: boolean;
  language_cert_url?: string | null;
  guide_license_submitted?: boolean;
  guide_license_url?: string | null;
  submitted_at?: string | null;
};

export type MeGuideProfile = {
  guide_id?: string;
  city?: string;
  country_code?: string;
  languages?: string[];
  service_types?: string[];
  bio?: string | null;
  hourly_rate?: string | null;
  hourly_currency?: string | null;
  avatar_url?: string | null;
  public_title?: string | null;
  status?: string;
  slot_state?: string | null;
  profile_patch_allowed?: boolean | null;
  application_status?: string;
  blocked_reasons?: string[] | Record<string, boolean>;
  rejection_codes?: string[];
  rejection_message?: string | null;
  application_materials?: MeGuideApplicationMaterials | null;
  updated_at?: string;
  /** 公众 GET /guides/:id 是否可访问（测试/演示 data_origin 等为 false） */
  public_detail_available?: boolean;
};

export type PatchMeGuideProfileBody = {
  city?: string;
  country_code?: string;
  languages?: string[];
  service_types?: string[];
  bio?: string;
  hourly_rate?: string;
  avatar_url?: string;
  public_title?: string;
};

export async function getMeGuideProfile(): Promise<{ profile?: MeGuideProfile | null }> {
  const res = await fetch(apiUrl(routes.meGuideProfile), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeGuideProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeGuideProfile | null };
}

export async function patchMeGuideProfile(body: PatchMeGuideProfileBody): Promise<{ profile?: MeGuideProfile | null }> {
  const res = await fetch(apiUrl(routes.meGuideProfile), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchMeGuideProfile", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { profile?: MeGuideProfile | null };
}
