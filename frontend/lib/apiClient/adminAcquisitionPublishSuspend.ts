import { apiUrl, routes } from "../api";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type PatchAdminAcquisitionPublishSuspendBody = {
  suspended_until: string | null;
};

export type AdminAcquisitionPublishSuspendResult = {
  status?: string;
  acquisition_publish_suspended?: boolean;
  acquisition_publish_suspended_until?: string | null;
  target_user_id?: string;
};

export async function patchAdminUserAcquisitionPublishSuspend(
  userId: string,
  body: PatchAdminAcquisitionPublishSuspendBody,
): Promise<AdminAcquisitionPublishSuspendResult> {
  const res = await fetch(apiUrl(routes.adminUserAcquisitionPublishSuspend(userId)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as AdminAcquisitionPublishSuspendResult;
  logApiJsonStatusNotOk("patchAdminUserAcquisitionPublishSuspend", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
