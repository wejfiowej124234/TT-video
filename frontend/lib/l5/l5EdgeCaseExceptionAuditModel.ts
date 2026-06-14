/**
 * L5 Edge-Case & Exception Audit Program · SSOT（① · 功能冻结）
 * 标准：异常场景下用户仍能理解「发生了什么 · 为什么 · 下一步」
 */
export const L5_EDGE_CASE_AUDIT_ID = "l5-edge-case-exception-audit-20260608" as const;

export type L5EdgeCaseRole = "traveler" | "guide" | "merchant" | "admin" | "governance";

export type L5EdgeCaseCategory =
  | "empty_state"
  | "permission_denied"
  | "no_data"
  | "cancel_flow"
  | "timeout"
  | "failure_recovery"
  | "duplicate_op"
  | "boundary_input"
  | "network_error"
  | "cross_role_interrupt";

export type L5EdgeCaseFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  role: L5EdgeCaseRole;
  category: L5EdgeCaseCategory;
  route: string;
  title: string;
  status: "closed" | "open" | "deferred";
  phase: "—" | "②" | "③";
};

export const L5_EDGE_CASE_FINDINGS: readonly L5EdgeCaseFinding[] = [
  { id: "EC-P0-01", severity: "P0", role: "traveler", category: "failure_recovery", route: "/orders", title: "Orders list ReferenceError on load", status: "closed", phase: "—" },
  { id: "EC-P0-02", severity: "P0", role: "traveler", category: "failure_recovery", route: "/#results", title: "Preview card stablecoinPair crash", status: "closed", phase: "—" },
  { id: "EC-P1-01", severity: "P1", role: "traveler", category: "network_error", route: "/orders", title: "orders_requestFailed bare 请求失败 no next step", status: "closed", phase: "—" },
  { id: "EC-P1-02", severity: "P1", role: "traveler", category: "failure_recovery", route: "/escrow/:id", title: "escrow_loadFailed bare 加载失败 no recovery hint", status: "closed", phase: "—" },
  { id: "EC-P1-03", severity: "P1", role: "traveler", category: "no_data", route: "/orders", title: "Projection SSOT jargon on order cards", status: "closed", phase: "—" },
  { id: "EC-P1-04", severity: "P1", role: "traveler", category: "empty_state", route: "/market", title: "Empty guide bind sub shows ① 本地 seed jargon", status: "closed", phase: "—" },
  { id: "EC-P1-05", severity: "P1", role: "traveler", category: "empty_state", route: "/market", title: "Empty state steps reference Escrow/DID", status: "closed", phase: "—" },
  { id: "EC-P1-06", severity: "P1", role: "traveler", category: "failure_recovery", route: "/pay", title: "pay_step3 Approve/Deposit exception path jargon", status: "closed", phase: "—" },
  { id: "EC-P1-07", severity: "P1", role: "governance", category: "network_error", route: "/governance", title: "governance_requestFailed bare no retry guidance", status: "closed", phase: "—" },
  { id: "EC-P1-08", severity: "P1", role: "admin", category: "permission_denied", route: "/admin", title: "Console gate exposes admin/super_admin API jargon", status: "closed", phase: "—" },
  { id: "EC-P1-09", severity: "P1", role: "guide", category: "timeout", route: "/market", title: "accept_window_expired no role-specific next step", status: "closed", phase: "—" },
  { id: "EC-P1-10", severity: "P1", role: "traveler", category: "timeout", route: "/pay", title: "payment_window_expired no traveler next step", status: "closed", phase: "—" },
  { id: "EC-P2-01", severity: "P2", role: "traveler", category: "failure_recovery", route: "/escrow/:id", title: "Protocol pause / wrong chain wallet copy depth", status: "open", phase: "②" },
  { id: "EC-P2-02", severity: "P2", role: "traveler", category: "cross_role_interrupt", route: "/market", title: "Bind backfill failed recovery parity with bind_empty", status: "open", phase: "②" },
  { id: "EC-P2-03", severity: "P2", role: "merchant", category: "boundary_input", route: "/provider/register", title: "Multi-step KYB field-level error grouping", status: "open", phase: "②" },
  { id: "EC-P2-04", severity: "P2", role: "traveler", category: "duplicate_op", route: "/escrow/:id", title: "Version conflict modal consumer copy sweep", status: "open", phase: "②" },
  { id: "EC-P2-05", severity: "P2", role: "admin", category: "failure_recovery", route: "/admin", title: "Partial inbox channel error aggregated UX", status: "deferred", phase: "③" },
] as const;

export const L5_EDGE_CASE_OPEN_P0 = L5_EDGE_CASE_FINDINGS.filter((f) => f.severity === "P0" && f.status === "open");
export const L5_EDGE_CASE_OPEN_P1 = L5_EDGE_CASE_FINDINGS.filter((f) => f.severity === "P1" && f.status === "open");

/** 异常/空态/权限 copy 禁止裸错误与开发术语 */
export const L5_EDGE_CASE_BANNED_EXCEPTION_COPY =
  /^(请求失败|加载失败|Request failed|Load failed)$|\u2460 本地|\u2460 Local|Escrow 草稿|链上投影|on-chain projection|\bDID\b|admin\/super_admin|Approve|Deposit|seed 的 API/i;

export const L5_EDGE_CASE_EXCEPTION_LOCALE_KEYS = [
  "orders_requestFailed",
  "escrow_loadFailed",
  "governance_requestFailed",
  "orders_projection_ssot_degraded",
  "orders_projection_ssot_notice_divergent_short",
  "market_empty_guides_for_own_order_sub",
  "market_empty_guides_for_own_order_sub_multi",
  "market_empty_guides_for_own_order_step3",
  "market_empty_orders_step2",
  "market_empty_guides_step1",
  "pay_step3",
  "admin_console_gate_forbidden_body",
  "order_error_accept_window_expired",
  "order_error_payment_window_expired",
] as const;
