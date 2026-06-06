import { apiUrl, routes } from "../api";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type ProviderApplicationReviewStatus = "reviewing" | "approved" | "rejected";

export type PatchAdminProviderApplicationReviewBody = {
  status: ProviderApplicationReviewStatus;
  rejection_codes?: string[];
  rejection_message?: string;
};

export async function getAdminProviderApplicationsList(status?: string): Promise<unknown> {
  const q = status?.trim() ? `?status=${encodeURIComponent(status.trim())}` : "";
  const res = await fetch(apiUrl(`${routes.adminProviderApplications}${q}`), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminProviderApplicationsList", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

export async function getAdminUserProviderApplication(userId: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.adminProviderApplication(userId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminUserProviderApplication", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

export async function patchAdminProviderApplicationReview(
  userId: string,
  body: PatchAdminProviderApplicationReviewBody,
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.adminProviderApplicationReview(userId)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminProviderApplicationReview", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
