import { apiUrl, routes } from "../api";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type GuideApplicationReviewStatus =
  | "reviewing"
  | "approved"
  | "rejected"
  | "needs_more_info";

export type PatchAdminGuideApplicationReviewBody = {
  status: GuideApplicationReviewStatus;
  rejection_codes?: string[];
  rejection_message?: string;
};

export async function getAdminGuideApplicationsList(status?: string): Promise<unknown> {
  const q = status?.trim() ? `?status=${encodeURIComponent(status.trim())}` : "";
  const res = await fetch(apiUrl(`${routes.adminGuideApplications}${q}`), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGuideApplicationsList", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

export async function getAdminUserGuideApplication(userId: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.adminGuideApplication(userId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminUserGuideApplication", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

export async function patchAdminGuideApplicationReview(
  userId: string,
  body: PatchAdminGuideApplicationReviewBody,
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.adminGuideApplicationReview(userId)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminGuideApplicationReview", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
