/**
 * **委托**（**B-073**；**`governance_delegate.rs`**；**`GET|POST|DELETE /api/v1/governance/delegate`**）。
 *
 * **链下 MVP**（响应常带 **`x-implementation-status: chain_off_mvp`**）：
 * - **GET**：**始终 200**；未登录 → **`authenticated:false`**、**`delegate_to:null`**、**`note`**；已登录 → 当前委托或 **`delegate_to:null`**。**不**走 **`login_required`**。
 * - **POST**：未登录 → **401** **`login_required`**；非法 UUID → **400** **`invalid_delegate_to`**；委托给自己 → **400** **`cannot_delegate_to_self`**；成功 → **200** **`status:ok`**、**`idempotent`**。
 * - **DELETE**：未登录 → **401** **`login_required`**；无活跃委托 → **404** **`no_active_delegation`**；成功 → **200**。
 *
 * **与订单域不同**：**不**使用 **`chain_off_unavailable` 503** 作为本路由门禁。投票时若仍委托给他人，见治理投票 **`403`** **`delegation_active_cannot_vote`**（**`governance_proposals/vote.rs`**，非本文件）。
 */

import { apiUrl, routes } from "../../api";
import {
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
  writeRequestHeaders,
} from "../core";
import type { GovernanceDelegateGetResponse, GovernanceDelegateWriteResponse } from "./types";

export async function getGovernanceDelegate(): Promise<GovernanceDelegateGetResponse> {
  const res = await fetch(apiUrl(routes.governanceDelegate), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as GovernanceDelegateGetResponse;
  logApiJsonStatusNotOk("getGovernanceDelegate", data);
  throwUnlessApiOk(data);
  return data;
}

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
