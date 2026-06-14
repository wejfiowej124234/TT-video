/**
 * L5 Consistency & System Integrity Audit · SSOT（① · 功能冻结）
 * 标准：同一业务对象在五角色全站须一致表达、一致状态、一致预期
 */
export const L5_CONSISTENCY_AUDIT_ID = "l5-consistency-system-integrity-audit-20260608" as const;

export type L5ConsistencyRole = "traveler" | "guide" | "merchant" | "admin" | "governance";

export type L5ConsistencyDimension =
  | "terminology"
  | "state_machine"
  | "amount"
  | "time"
  | "cta"
  | "navigation"
  | "permission"
  | "empty_state"
  | "error_state"
  | "data_display"
  | "cross_role";

export type L5ConsistencyFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  role: L5ConsistencyRole;
  dimension: L5ConsistencyDimension;
  route: string;
  title: string;
  status: "closed" | "open" | "deferred";
  phase: "—" | "②" | "③";
};

export const L5_CONSISTENCY_FINDINGS: readonly L5ConsistencyFinding[] = [
  { id: "CSI-P0-01", severity: "P0", role: "traveler", dimension: "amount", route: "/#results → /escrow/:id", title: "Preview vs order detail currency label drift (USDC vs 美元估算)", status: "closed", phase: "—" },
  { id: "CSI-P1-01", severity: "P1", role: "traveler", dimension: "terminology", route: "/escrow/:id", title: "escrow_meta_description still says 托管详情 vs page title 订单详情", status: "closed", phase: "—" },
  { id: "CSI-P1-02", severity: "P1", role: "traveler", dimension: "cta", route: "/pay", title: "pay_mockPay_ok / hint say 托管详情 not 订单详情", status: "closed", phase: "—" },
  { id: "CSI-P1-03", severity: "P1", role: "traveler", dimension: "navigation", route: "header", title: "header_payHub 支付与托管 vs pay_pageTitle 行程付款", status: "closed", phase: "—" },
  { id: "CSI-P1-04", severity: "P1", role: "traveler", dimension: "navigation", route: "/market", title: "market_bindGuide_back_escrow 返回订单页 vs orders_escrowDetail", status: "closed", phase: "—" },
  { id: "CSI-P1-05", severity: "P1", role: "traveler", dimension: "terminology", route: "/orders", title: "orders_clickCardHint / expect banner 托管详情 drift", status: "closed", phase: "—" },
  { id: "CSI-P1-06", severity: "P1", role: "traveler", dimension: "terminology", route: "/help", title: "help FAQ pay/escrow paths say 托管详情 / Open escrow", status: "closed", phase: "—" },
  { id: "CSI-P1-07", severity: "P1", role: "traveler", dimension: "amount", route: "/market", title: "OrderCard shows USDC while landing preview shows 美元估算", status: "closed", phase: "—" },
  { id: "CSI-P1-08", severity: "P1", role: "traveler", dimension: "cta", route: "/escrow/:id/rate", title: "rate_openEscrowToRelease 托管详情 CTA drift", status: "closed", phase: "—" },
  { id: "CSI-P1-09", severity: "P1", role: "admin", dimension: "terminology", route: "/admin/orders", title: "admin escrow row aria 订单托管页 vs consumer 订单详情", status: "closed", phase: "—" },
  { id: "CSI-P1-10", severity: "P1", role: "guide", dimension: "cross_role", route: "/market → traveler pay", title: "market_acceptSuccess handoff already aligned to 订单详情 (regression guard)", status: "closed", phase: "—" },
  { id: "CSI-P2-01", severity: "P2", role: "traveler", dimension: "navigation", route: "/escrow/:id", title: "/escrow/ URL alias vs consumer 订单详情 naming", status: "open", phase: "②" },
  { id: "CSI-P2-02", severity: "P2", role: "admin", dimension: "state_machine", route: "/admin/orders", title: "admin_orders_state_* vs order_status_* cross-view label parity", status: "open", phase: "②" },
  { id: "CSI-P2-03", severity: "P2", role: "traveler", dimension: "terminology", route: "/orders", title: "orders_meta_description 托管状态 vs 订单状态", status: "open", phase: "②" },
  { id: "CSI-P2-04", severity: "P2", role: "governance", dimension: "terminology", route: "/traveltrust", title: "Brand pulse pages 订单托管/USDC narrative vs consumer quote label", status: "deferred", phase: "③" },
  { id: "CSI-P2-05", severity: "P2", role: "admin", dimension: "terminology", route: "/admin/orders", title: "Admin list hint Escrow 详情 jargon", status: "open", phase: "②" },
] as const;

export const L5_CONSISTENCY_OPEN_P0 = L5_CONSISTENCY_FINDINGS.filter((f) => f.severity === "P0" && f.status === "open");
export const L5_CONSISTENCY_OPEN_P1 = L5_CONSISTENCY_FINDINGS.filter((f) => f.severity === "P1" && f.status === "open");

/** Consumer order-detail surfaces must not drift back to escrow-only naming */
export const L5_CONSISTENCY_BANNED_ORDER_DETAIL_DRIFT =
  /(?<![订单])托管详情|打开托管页|Escrow details, amount|Open escrow details and refresh|Pay & escrow(?! hub)|open escrow details;/i;

/** Keys audited for cross-surface terminology / CTA alignment */
export const L5_CONSISTENCY_LOCALE_KEYS = [
  "escrow_meta_description",
  "escrow_meta_title",
  "escrow_breadcrumb_current",
  "orders_escrowDetail",
  "orders_viewDetail",
  "landing_view_order_detail",
  "pay_pageTitle",
  "header_payHub",
  "pay_ctaEscrow",
  "pay_mockPay_ok",
  "pay_mockPay_hint",
  "market_bindGuide_back_escrow",
  "market_acceptSuccess",
  "orders_clickCardHint",
  "orders_list_expectNewOrder_banner",
  "help_faqPayA",
  "help_faqPayDeepLink",
  "help_faqEscrowQ",
  "help_faqEscrowA",
  "rate_openEscrowToRelease",
  "escrow_detail_relatedNav_aria",
  "traveler_quote_currency",
  "admin_orders_escrow_row_aria",
] as const;

/** Pay / order CTAs that must reference order details (not escrow-only) */
export const L5_CONSISTENCY_ORDER_DETAIL_CTA_KEYS = [
  "pay_ctaEscrow",
  "pay_ctaEscrowPrimary",
  "orders_escrowDetail",
  "orders_viewDetail",
  "landing_view_order_detail",
  "market_bindGuide_back_escrow",
] as const;

export const L5_CONSISTENCY_CONSUMER_AMOUNT_SURFACES = [
  "components/landing/ItineraryResultsSection.tsx",
  "components/escrow/EscrowDetail/QuoteSummaryCard.tsx",
  "components/escrow/EscrowDetail/index.tsx",
  "components/market/OrderCard.tsx",
] as const;
