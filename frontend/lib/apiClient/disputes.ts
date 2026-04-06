/**
 * 争议 API：列表、详情、证据、裁决
 */

import { apiUrl, routes } from "../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";

export async function getDisputes(): Promise<unknown[]> {
  const res = await fetch(apiUrl(routes.disputes), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; items?: unknown[] };
  logApiJsonStatusNotOk("getDisputes", data);
  throwUnlessApiOk(data);
  return Array.isArray(data.items) ? data.items : [];
}

export async function getDispute(id: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.disputeById(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; dispute?: unknown };
  logApiJsonStatusNotOk("getDispute", data);
  throwUnlessApiOk(data);
  if (data.dispute != null) return data.dispute;
  throw new Error("dispute_not_found");
}

export async function getOrderEvidence(orderId: string): Promise<unknown[]> {
  const res = await fetch(apiUrl(routes.orderEvidence(orderId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; items?: unknown[] };
  logApiJsonStatusNotOk("getOrderEvidence", data);
  throwUnlessApiOk(data);
  return Array.isArray(data.items) ? data.items : [];
}

export async function postOrderEvidence(
  orderId: string,
  body: { content_hash: string },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderEvidence(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrderEvidence", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postDisputeResolve(
  disputeId: string,
  body: { refund_ratio: number; slash_guide: boolean },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.disputeResolve(disputeId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postDisputeResolve", data);
  throwUnlessApiOk(data);
  return data;
}

/** Intents 扩展（48 routes/intents）：执行裁决意向 */
export async function postDisputeExecuteResolutionIntent(
  disputeId: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.disputeExecuteResolutionIntent(disputeId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postDisputeExecuteResolutionIntent", data);
  return data;
}
