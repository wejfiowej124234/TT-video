import { apiUrl, routes } from "../api";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type AdminGuideRegistrationStatus =
  | "pending"
  | "active"
  | "rejected"
  | "suspended"
  | "pending_review";

export type PatchAdminGuideRegistrationBody = {
  status: AdminGuideRegistrationStatus;
  rejection_codes?: string[];
  rejection_message?: string;
};

export async function patchAdminGuideRegistration(
  guideId: string,
  body: PatchAdminGuideRegistrationBody,
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.admin.guideById(guideId)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminGuideRegistration", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
