import type { OrderChainSyncState, OrderRow } from "./types";

/** B-097：详情 **`order.projection_terminal`**（**`GET /orders/:id`**）优先于链上快照与业务行。 */
function projectionTerminalStatusForBadge(order: OrderRow): string | null {
  const pt = order.projection_terminal as Record<string, unknown> | null | undefined;
  if (!pt || typeof pt !== "object") return null;
  if (String(pt.read_status ?? "") === "degraded") return null;
  const st = String(pt.status ?? "").trim();
  return st.length > 0 ? st : null;
}

function normalizeChainEventTypeKey(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    return s.length > 0 ? s : null;
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    const s = String(raw).trim();
    return s.length > 0 ? s : null;
  }
  return null;
}

/**
 * `event_log_snapshot.event_type`（110 §3.3 / db::latest_escrow_event_finality_for_order）→ 与 API `order.state` 同形的展示用状态。
 * 与 `chain_off::apply_escrow_event_kind_to_order_state` + `order_state_to_str` 语义对齐（仅用于徽章，不改订单体）。
 * 未知或非字符串类型返回 `null`（不覆盖订单行状态）。
 */
export function escrowEventTypeToOrderStateForBadge(eventType: unknown): string | null {
  const k = normalizeChainEventTypeKey(eventType);
  if (k == null) return null;
  switch (k) {
    case "Paid":
      return "escrowed";
    case "DisputeOpened":
      return "disputed";
    case "Released":
      return "completed";
    case "Refunded":
      return "refunded";
    case "ResolutionExecuted":
      return "completed";
    default:
      return null;
  }
}

function orderStateRank(s: string): number {
  const x = String(s ?? "").toLowerCase().replace(/-/g, "_");
  if (
    x === "cancelled" ||
    x === "canceled" ||
    x === "refunded" ||
    x === "partially_refunded" ||
    x === "partiallyrefunded" ||
    x === "slashed"
  )
    return 60;
  if (x === "completed" || x === "released" || x === "closed") return 55;
  if (x === "disputed" || x === "dispute") return 50;
  if (x === "escrowed" || x === "funded") return 40;
  if (x === "accepted" || x === "confirmed") return 30;
  if (x === "draft" || x === "created" || x === "open") return 20;
  return 0;
}

/** 链上投影终端（B-097）优先于事件快照与业务行，用于详情顶栏 StatusBadge。始终返回字符串（可为 `""`，由调用方再兜底）。 */
export function resolveStatusForEscrowBadge(
  order: OrderRow,
  chainSync: OrderChainSyncState | null | undefined,
): string {
  const fromProjection = projectionTerminalStatusForBadge(order);
  if (fromProjection != null) {
    return fromProjection;
  }
  const fromOrder = String(order?.state ?? order?.status ?? "").trim();
  const fromChain = escrowEventTypeToOrderStateForBadge(chainSync?.eventLogSnapshot?.event_type);
  if (fromChain != null && orderStateRank(fromChain) > orderStateRank(fromOrder)) {
    return fromChain;
  }
  return fromOrder;
}
