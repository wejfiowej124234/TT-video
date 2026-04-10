/**
 * Epic C-01 / C-02：`GET /api/v1/admin/cross-check` 与 `GET /api/v1/admin/drift-summary` 只读封装 +
 * 宽读取归一化（仅 `status` / `source_kind` / `drift_detected` / `delta` 等浅层守卫，**不**收窄 `body`、不解释语义）。
 */

import { apiUrl, routes } from "../api";
import {
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
} from "./core";

export type AdminCrossCheckSourceKind = "projection" | "chain_ssot" | "reference";

export type CrossCheckSlot = {
  source_kind: AdminCrossCheckSourceKind;
  /** 各槽同源 handler 的完整成功体；勿收窄类型 */
  body: unknown;
};

/** 宽顶壳：除三槽与 `drift_summary` 外不承诺字段 */
export type AdminCrossCheckResponse = Record<string, unknown> & {
  status?: string;
  fee_pool_projection?: CrossCheckSlot;
  governance_pool_chain?: CrossCheckSlot;
  protocol_reference?: CrossCheckSlot;
  drift_summary?: unknown;
};

export type AdminDriftSummaryResponse = Record<string, unknown> & {
  status?: string;
  drift_detected?: unknown;
  delta?: unknown;
};

/** C-02：槽只读视图（`source_kind` 仅在三元字面量内保留，否则 `undefined`） */
export type NormalizedCrossCheckSlot = {
  source_kind: AdminCrossCheckSourceKind | undefined;
  body: unknown;
};

/** C-02：`cross-check` 根上 `drift_summary` 的浅层切片（`delta` 仍为 `unknown`） */
export type NormalizedCrossCheckDriftSummary = {
  drift_detected: boolean | undefined;
  delta: unknown;
};

/** C-02：`GET …/cross-check` 成功体的只读归一化视图 */
export type NormalizedAdminCrossCheck = {
  status: string | undefined;
  fee_pool_projection: NormalizedCrossCheckSlot | undefined;
  governance_pool_chain: NormalizedCrossCheckSlot | undefined;
  protocol_reference: NormalizedCrossCheckSlot | undefined;
  drift_summary: NormalizedCrossCheckDriftSummary | undefined;
};

/** C-02：`GET …/drift-summary` 成功体的只读归一化视图 */
export type NormalizedAdminDriftSummary = {
  status: string | undefined;
  drift_detected: boolean | undefined;
  delta: unknown;
};

function readOwnString(obj: Record<string, unknown>, key: string): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return undefined;
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

/** 任意 JSON 根上的 `status`（字符串）；非对象或无字段则为 `undefined`。 */
export function readAdminJsonStatus(data: unknown): string | undefined {
  if (data == null || typeof data !== "object") return undefined;
  return readOwnString(data as Record<string, unknown>, "status");
}

/**
 * 单槽宽归一化：不校验 `body` 形状；`source_kind` 非三字面量之一则为 `undefined`。
 */
export function normalizeCrossCheckSlot(raw: unknown): NormalizedCrossCheckSlot | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const sk = o.source_kind;
  const source_kind: AdminCrossCheckSourceKind | undefined =
    sk === "projection" || sk === "chain_ssot" || sk === "reference" ? sk : undefined;
  const body = Object.prototype.hasOwnProperty.call(o, "body") ? o.body : undefined;
  return { source_kind, body };
}

function normalizeDriftSummaryBlob(blob: unknown): NormalizedCrossCheckDriftSummary | undefined {
  if (blob == null || typeof blob !== "object") return undefined;
  const o = blob as Record<string, unknown>;
  const dd = Object.prototype.hasOwnProperty.call(o, "drift_detected") ? o.drift_detected : undefined;
  const drift_detected = typeof dd === "boolean" ? dd : undefined;
  const delta = Object.prototype.hasOwnProperty.call(o, "delta") ? o.delta : undefined;
  return { drift_detected, delta };
}

/** `GET …/cross-check` 响应（或任意同形对象）的只读归一化；失败体也可调用，仅得到浅层字段。 */
export function normalizeAdminCrossCheckRead(data: unknown): NormalizedAdminCrossCheck {
  if (data == null || typeof data !== "object") {
    return {
      status: undefined,
      fee_pool_projection: undefined,
      governance_pool_chain: undefined,
      protocol_reference: undefined,
      drift_summary: undefined,
    };
  }
  const o = data as Record<string, unknown>;
  return {
    status: readOwnString(o, "status"),
    fee_pool_projection: normalizeCrossCheckSlot(o.fee_pool_projection),
    governance_pool_chain: normalizeCrossCheckSlot(o.governance_pool_chain),
    protocol_reference: normalizeCrossCheckSlot(o.protocol_reference),
    drift_summary: normalizeDriftSummaryBlob(o.drift_summary),
  };
}

/** `GET …/drift-summary` 响应（或任意同形对象）的只读归一化。 */
export function normalizeAdminDriftSummaryRead(data: unknown): NormalizedAdminDriftSummary {
  if (data == null || typeof data !== "object") {
    return { status: undefined, drift_detected: undefined, delta: undefined };
  }
  const o = data as Record<string, unknown>;
  const dd = Object.prototype.hasOwnProperty.call(o, "drift_detected") ? o.drift_detected : undefined;
  return {
    status: readOwnString(o, "status"),
    drift_detected: typeof dd === "boolean" ? dd : undefined,
    delta: Object.prototype.hasOwnProperty.call(o, "delta") ? o.delta : undefined,
  };
}

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
