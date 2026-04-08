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

type DisputesListEnvelope = {
  status?: string;
  items?: unknown[];
  page?: { has_more?: boolean; next_cursor?: string | null };
  error?: string;
};

/** 拉全量争议（PostgreSQL 路径下自动跟 `page.next_cursor` 分页直至 `has_more` 为 false）。 */
export async function getDisputes(): Promise<unknown[]> {
  const acc: unknown[] = [];
  let cursor: string | undefined;
  const limit = 500;
  for (let guard = 0; guard < 50; guard++) {
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    if (cursor) qs.set("cursor", cursor);
    const url = `${apiUrl(routes.disputes)}?${qs.toString()}`;
    const res = await fetch(url, {
      headers: { "x-request-id": requestId(), ...getAuthHeaders() },
    });
    const data = (await parseResponse(res)) as DisputesListEnvelope;
    logApiJsonStatusNotOk("getDisputes", data);
    throwUnlessApiOk(data);
    const chunk = Array.isArray(data.items) ? data.items : [];
    acc.push(...chunk);
    const more = data.page?.has_more === true && data.page?.next_cursor;
    if (!more) break;
    cursor = data.page!.next_cursor!;
    if (chunk.length === 0) break;
  }
  return acc;
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
