import { apiUrl, routes } from "../api";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type StewardApplicationReviewStatus = "under_review" | "approved" | "rejected";

export type PatchAdminStewardApplicationReviewBody = {
  status: StewardApplicationReviewStatus;
  rejection_codes?: string[];
  rejection_message?: string;
};

export async function getAdminStewardApplicationsList(status?: string): Promise<unknown> {
  const q = status?.trim() ? `?status=${encodeURIComponent(status.trim())}` : "";
  const res = await fetch(apiUrl(`${routes.adminStewardApplications}${q}`), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminStewardApplicationsList", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

export async function getAdminUserStewardApplication(userId: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.adminStewardApplication(userId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminUserStewardApplication", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

export async function patchAdminStewardApplicationReview(
  userId: string,
  body: PatchAdminStewardApplicationReviewBody,
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.adminStewardApplicationReview(userId)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminStewardApplicationReview", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
