/**
 * B-097：`GET /orders` / `GET /orders/:id` 的 **`display_status`**（链上投影 SSOT）与 **`projection_terminal`** 分歧提示。
 */

import type { OrderBadgeVariant, OrderStatusInput } from "./orderStatusI18n";
import { orderStateToBadgeVariant, orderStateToStatusLabelKey } from "./orderStatusI18n";

export type ProjectionTerminalApi = {
  status?: string;
  resolution_type?: string | null;
  updated_at?: string;
  diverges_from_order_state?: boolean;
  read_status?: string;
  error?: string;
};

export type OrderWithProjectionDisplay = {
  display_status?: string | null;
  projection_terminal?: ProjectionTerminalApi | null;
  state?: string | null;
  status?: string | null;
  sub_status?: string | null;
};

/** 徽章/文案用主状态：有 **`display_status`** 时用其值，否则回落 **`state`/`status`**。 */
export function orderDisplayStatusRaw(order: OrderWithProjectionDisplay): string {
  const d = order.display_status?.trim();
  if (d) return d;
  return String(order.state ?? order.status ?? "").trim();
}

/** 与 **`orderStateToStatusLabelKey`** 对齐；**`display_status`** 作单一 state 传入。 */
export function orderStatusLabelKeyFromApiOrder(order: OrderWithProjectionDisplay): string {
  const raw = orderDisplayStatusRaw(order);
  if (raw) return orderStateToStatusLabelKey(raw);
  return orderStateToStatusLabelKey({
    state: order.state ?? undefined,
    status: order.status ?? undefined,
    sub_status: order.sub_status ?? undefined,
  } satisfies OrderStatusInput);
}

export function orderBadgeVariantFromApiOrder(order: OrderWithProjectionDisplay): OrderBadgeVariant {
  const raw = orderDisplayStatusRaw(order);
  if (raw) return orderStateToBadgeVariant(raw);
  return orderStateToBadgeVariant({
    state: order.state ?? undefined,
    status: order.status ?? undefined,
    sub_status: order.sub_status ?? undefined,
  } satisfies OrderStatusInput);
}

/** 业务行与投影行不一致（且非 degraded）。 */
export function orderProjectionDivergesFromOrderState(order: OrderWithProjectionDisplay): boolean {
  const pt = order.projection_terminal;
  if (!pt || typeof pt !== "object") return false;
  if (String(pt.read_status ?? "") === "degraded") return false;
  return pt.diverges_from_order_state === true;
}

/** 投影块存在但读库失败。 */
export function orderProjectionTerminalDegraded(order: OrderWithProjectionDisplay): boolean {
  const pt = order.projection_terminal;
  if (!pt || typeof pt !== "object") return false;
  return String(pt.read_status ?? "") === "degraded";
}
