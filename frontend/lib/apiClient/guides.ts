/**
 * 向导 API：列表、详情、注册、上传、质押
 */

import { apiUrl, routes } from "../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
  fetchGetWithTransitRetry,
} from "./core";

export async function getGuides(params?: {
  city?: string;
  language?: string;
  service_type?: string;
  country_code?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: unknown[]; page?: { limit: number; next_cursor: string | null; has_more: boolean } }> {
  const q = new URLSearchParams();
  if (params?.city) q.set("city", params.city);
  if (params?.language) q.set("language", params.language);
  if (params?.service_type) q.set("service_type", params.service_type);
  if (params?.country_code) q.set("country_code", params.country_code);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const url = apiUrl(routes.guides) + (q.toString() ? `?${q}` : "");
  const res = await fetchGetWithTransitRetry(url, {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  }, { attempts: 5 });
  const data = (await parseResponse(res)) as {
    items?: unknown[];
    status?: string;
    page?: { limit: number; next_cursor: string | null; has_more: boolean };
  };
  logApiJsonStatusNotOk("getGuides", data);
  throwUnlessApiOk(data);
  const items = Array.isArray(data?.items) ? data.items : [];
  return data?.page ? { items, page: data.page } : { items };
}

export async function getGuide(id: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.guideById(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; guide?: unknown };
  logApiJsonStatusNotOk("getGuide", data);
  throwUnlessApiOk(data);
  if (data?.guide != null) return data.guide;
  throw new Error("guide_not_found");
}

/** B-079：只读档期占用，与接单 `schedule_conflict` / `lock_slot` 同源数据 */
export async function getGuideAvailability(id: string): Promise<{
  status?: string;
  guide_id?: string;
  occupied_ranges?: { start_date?: string; end_date?: string }[];
}> {
  const res = await fetch(apiUrl(routes.guideAvailability(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    guide_id?: string;
    occupied_ranges?: { start_date?: string; end_date?: string }[];
  };
  logApiJsonStatusNotOk("getGuideAvailability", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postGuideUploadDoc(
  body: { content_base64: string; filename?: string },
  idempotencyKey?: string
): Promise<{ status?: string; url?: string; error?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...writeRequestHeaders(idempotencyKey),
  };
  const res = await fetch(apiUrl(routes.guideUploadDoc), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as { status?: string; url?: string; error?: string };
  logApiJsonStatusNotOk("postGuideUploadDoc", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postGuide(
  body: {
    city: string;
    country_code?: string;
    languages?: string[];
    service_types?: string[];
    bio?: string;
    wallet_address?: string;
    real_name?: string;
    passport_number?: string;
    id_photo_url?: string;
    language_cert_url?: string;
    guide_license_url?: string;
  },
  idempotencyKey?: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...writeRequestHeaders(idempotencyKey),
  };
  const res = await fetch(apiUrl(routes.guides), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postGuide", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postGuideStake(
  guideId: string,
  body: { amount: string },
  idempotencyKey?: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": requestId(),
    ...getAuthHeaders(),
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
    headers["X-Idempotency-Key"] = idempotencyKey;
  }
  const res = await fetch(apiUrl(routes.guideStake(guideId)), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postGuideStake", data);
  throwUnlessApiOk(data);
  return data;
}
