import { apiUrl, routes } from "../../api";
import {
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
} from "../core";
import type {
  AdminAuthAuditEventsResponse,
  GetAdminAuthAuditEventsParams,
} from "./types";

export async function getAdminAuthAuditEvents(
  params?: GetAdminAuthAuditEventsParams,
): Promise<AdminAuthAuditEventsResponse> {
  const res = await fetch(apiUrl(routes.admin.authAuditEvents(params)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as AdminAuthAuditEventsResponse;
  logApiJsonStatusNotOk("getAdminAuthAuditEvents", data);
  throwUnlessApiOk(data);
  return data;
}
