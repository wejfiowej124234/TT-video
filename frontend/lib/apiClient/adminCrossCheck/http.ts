import { apiUrl, routes } from "../../api";
import {
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
} from "../core";
import type { AdminCrossCheckResponse, AdminDriftSummaryResponse } from "./types";

export async function getAdminCrossCheck(): Promise<AdminCrossCheckResponse> {
  const res = await fetch(apiUrl(routes.admin.crossCheck), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as AdminCrossCheckResponse;
  logApiJsonStatusNotOk("getAdminCrossCheck", data);
  throwUnlessApiOk(data);
  return data;
}

export async function getAdminDriftSummary(): Promise<AdminDriftSummaryResponse> {
  const res = await fetch(apiUrl(routes.admin.driftSummary), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as AdminDriftSummaryResponse;
  logApiJsonStatusNotOk("getAdminDriftSummary", data);
  throwUnlessApiOk(data);
  return data;
}
