/**
 * B-073：`GET|POST|DELETE /api/v1/governance/delegate`（链下 MVP）
 */

import { apiUrl, routes } from "../api";
import {
  getAuthHeaders,
  parseResponse,
  requestId,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";

export type GovernanceDelegateGetResponse = {
  status?: string;
  authenticated?: boolean;
  delegate_to?: string | null;
  request_id?: string;
  data_source?: string;
  note?: string;
};

export async function getGovernanceDelegate(): Promise<GovernanceDelegateGetResponse> {
  const res = await fetch(apiUrl(routes.governanceDelegate), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as GovernanceDelegateGetResponse;
  logApiJsonStatusNotOk("getGovernanceDelegate", data);
  throwUnlessApiOk(data);
  return data;
}

export type GovernanceDelegateWriteResponse = {
  status?: string;
  delegate_to?: string | null;
  request_id?: string;
  tx_hash?: string | null;
  implementation_note?: string;
  /** POST：与已有委托目标相同时为 true */
  idempotent?: boolean;
};

export async function postGovernanceDelegate(
  delegateTo: string,
  idempotencyKey?: string
): Promise<GovernanceDelegateWriteResponse> {
  const res = await fetch(apiUrl(routes.governanceDelegate), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...writeRequestHeaders(idempotencyKey),
    },
    body: JSON.stringify({ delegate_to: delegateTo.trim() }),
  });
  const data = (await parseResponse(res)) as GovernanceDelegateWriteResponse;
  logApiJsonStatusNotOk("postGovernanceDelegate", data);
  throwUnlessApiOk(data);
  return data;
}

export async function deleteGovernanceDelegate(idempotencyKey?: string): Promise<GovernanceDelegateWriteResponse> {
  const res = await fetch(apiUrl(routes.governanceDelegate), {
    method: "DELETE",
    headers: {
      ...writeRequestHeaders(idempotencyKey),
    },
  });
  const data = (await parseResponse(res)) as GovernanceDelegateWriteResponse;
  logApiJsonStatusNotOk("deleteGovernanceDelegate", data);
  throwUnlessApiOk(data);
  return data;
}
