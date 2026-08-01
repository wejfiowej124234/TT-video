/**
 * Batch-11 W11 · orders ops jump pack · HU-415 / HU-418
 * Admin readonly · Escrow/Pay/Disputes jumps · no state-machine write
 * data_origin: hide until server filter · ≠ Production GO
 */

export const ORDERS_OPS_L5_W11_PROBE = "orders-ops-l5-batch11-w11-v1" as const;

/** HU-415 · Admin 不写订单/Escrow 状态机；写路径只在公开页 */
export const ORDERS_ADMIN_WRITE_POLICY = "escrow_pay_public_pages_only" as const;

/** HU-418 · data_origin 列/伪客户端滤暂藏，待服务端真滤 */
export const ORDERS_DATA_ORIGIN_SURFACE = "hidden_until_server_filter" as const;

export type OrdersOpsSopStepId =
  | "read_state"
  | "open_admin_detail"
  | "jump_escrow_or_pay"
  | "disputes_if_needed"
  | "no_admin_state_write";

export type OrdersOpsSopStep = {
  id: OrdersOpsSopStepId;
  labelKey: string;
};

export const ORDERS_READONLY_SOP_STEPS: OrdersOpsSopStep[] = [
  { id: "read_state", labelKey: "admin_orders_sop_step_read_state" },
  { id: "open_admin_detail", labelKey: "admin_orders_sop_step_open_admin_detail" },
  { id: "jump_escrow_or_pay", labelKey: "admin_orders_sop_step_jump_escrow_or_pay" },
  { id: "disputes_if_needed", labelKey: "admin_orders_sop_step_disputes_if_needed" },
  { id: "no_admin_state_write", labelKey: "admin_orders_sop_step_no_admin_state_write" },
];

/** Ops-facing state family → copy key (status explanation) */
export type OrdersStateOpsFamily =
  | "pre_escrow"
  | "in_escrow"
  | "disputed"
  | "terminal_ok"
  | "terminal_money"
  | "other";

const STATE_FAMILY: Record<string, OrdersStateOpsFamily> = {
  draft: "pre_escrow",
  created: "pre_escrow",
  accepted: "pre_escrow",
  escrowed: "in_escrow",
  paid: "in_escrow",
  disputed: "disputed",
  completed: "terminal_ok",
  cancelled: "terminal_ok",
  refunded: "terminal_money",
  partially_refunded: "terminal_money",
  slashed: "terminal_money",
};

export function resolveOrdersStateOpsFamily(state: string | null | undefined): OrdersStateOpsFamily {
  const s = (state ?? "").trim().toLowerCase();
  return STATE_FAMILY[s] ?? "other";
}

export function ordersStateOpsExplainKey(state: string | null | undefined): string {
  const family = resolveOrdersStateOpsFamily(state);
  return `admin_orders_state_ops_${family}`;
}

export type OrdersOpsJumpPack = {
  policy: typeof ORDERS_ADMIN_WRITE_POLICY;
  writeForbidden: true;
  escrowStateMachineWrite: "FORBIDDEN";
  financeWrite: "FORBIDDEN";
  dataOriginSurface: typeof ORDERS_DATA_ORIGIN_SURFACE;
  showDataOriginColumn: false;
  clientDataOriginFilter: false;
  adminDetailHref: string | null;
  escrowHref: string | null;
  payHref: string | null;
  disputesHref: string;
  sopSteps: OrdersOpsSopStep[];
  stateFamily: OrdersStateOpsFamily;
  stateExplainKey: string;
};

export function resolveOrdersOpsJumpPack(input: {
  orderId?: string | null;
  state?: string | null;
}): OrdersOpsJumpPack {
  const orderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
  const state = typeof input.state === "string" ? input.state.trim() : "";
  const family = resolveOrdersStateOpsFamily(state);

  return {
    policy: ORDERS_ADMIN_WRITE_POLICY,
    writeForbidden: true,
    escrowStateMachineWrite: "FORBIDDEN",
    financeWrite: "FORBIDDEN",
    dataOriginSurface: ORDERS_DATA_ORIGIN_SURFACE,
    showDataOriginColumn: false,
    clientDataOriginFilter: false,
    adminDetailHref: orderId ? `/admin/orders/${encodeURIComponent(orderId)}` : null,
    escrowHref: orderId ? `/escrow/${encodeURIComponent(orderId)}` : null,
    payHref: orderId ? `/pay?orderId=${encodeURIComponent(orderId)}` : null,
    disputesHref: "/admin/disputes",
    sopSteps: ORDERS_READONLY_SOP_STEPS,
    stateFamily: family,
    stateExplainKey: ordersStateOpsExplainKey(state),
  };
}

/** HU-418 · whether Admin UI should expose data_origin column / client filter */
export function shouldExposeOrdersDataOriginSurface(): boolean {
  return false;
}
