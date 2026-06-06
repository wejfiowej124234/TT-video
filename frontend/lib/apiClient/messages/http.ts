/**
 * **订单聊天** **`GET|POST /api/v1/orders/:id/messages`**（**`crates/api/src/routes/messages/mod.rs`**；**04** §3.4、**48** §5.8）。
 *
 * **chain_off**：**无 chain_off** → **503** **`chain_off_unavailable`**（GET/POST 同）；**有 chain_off** → 须会话 **401** **`login_required`**；**`:id`** 非 UUID → **400** **`invalid_uuid`**；非参与方等业务码见 **`messages_list_impl`** / **`message_post_impl`**。
 * 请求头：**`writeRequestHeaders`**（POST）内含 **`getAuthHeaders` + 幂等键**；GET 含 **`x-request-id` + getAuthHeaders**。
 */

import { apiUrl, routes } from "../../api";
import {
  getAuthHeaders,
  writeRequestHeaders,
  parseResponse,
  requestId,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";
import type { OrderMessageRow } from "./types";

/** **`GET …/messages`**：见模块头 **chain_off** / **401** / **400**。 */
export async function getOrderMessages(orderId: string): Promise<OrderMessageRow[]> {
  const res = await fetch(apiUrl(routes.orderMessages(orderId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; items?: unknown[] };
  logApiJsonStatusNotOk("getOrderMessages", data);
  throwUnlessApiOk(data);
  return Array.isArray(data.items) ? (data.items as OrderMessageRow[]) : [];
}

/** **`POST …/messages`**：**body** **`{ content }`**；见模块头。 */
export async function postOrderMessage(
  orderId: string,
  body: { content: string },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderMessages(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrderMessage", data);
  throwUnlessApiOk(data);
  return data;
}
