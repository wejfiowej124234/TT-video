/**
 * TravelTrust Multi-Dimensional L5 Audit Sprint · Findings SSOT（① · 功能冻结）
 * 五角色：Traveler · Guide · Merchant · Admin · Governance
 * 维度：消费者/运营/IA/文案/CTA/信任/空态/错误/加载/表单/订单/市场/社区/Growth/支付/移动/响应式/视觉/可访问/跨浏览器/数据/状态/异常/认知/任务完成
 */
export const L5_MULTI_DIM_PROGRAM_ID = "l5-five-role-audit-sprint-20260608" as const;

export type L5FindingSeverity = "P0" | "P1" | "P2";
export type L5FindingStatus = "closed" | "open" | "deferred";
export type L5FindingPhase = "—" | "②" | "③";

export type L5AuditRole = "traveler" | "guide" | "merchant" | "admin" | "governance";

export type L5FindingDimension =
  | "consumer_ux"
  | "operator_ux"
  | "five_role_loop"
  | "information_architecture"
  | "copy_terminology"
  | "cta_paths"
  | "trust_proof"
  | "empty_states"
  | "error_messages"
  | "loading_states"
  | "form_experience"
  | "order_flow"
  | "market_flow"
  | "community_flow"
  | "growth_flow"
  | "payment_flow"
  | "mobile"
  | "responsive_layout"
  | "visual_hierarchy"
  | "accessibility"
  | "cross_browser"
  | "data_display"
  | "state_feedback"
  | "error_recovery"
  | "cognitive_load"
  | "task_completion"
  | "security_feel"
  | "web3_hidden"
  | "ops_usability"
  | "growth_referral"
  | "full_chain";

export type L5Finding = {
  id: string;
  severity: L5FindingSeverity;
  dimension: L5FindingDimension;
  role: L5AuditRole;
  route: string;
  title: string;
  status: L5FindingStatus;
  phase: L5FindingPhase;
};

/** 机读登记 · 与 evidence/L5-MULTI-DIMENSIONAL-EXCELLENCE-FINDINGS-MATRIX.md 同步 */
export const L5_MULTI_DIMENSIONAL_FINDINGS: readonly L5Finding[] = [
  { id: "MD-P0-01", severity: "P0", dimension: "consumer_ux", role: "traveler", route: "/#results", title: "ItineraryResultsSection stablecoinPair ReferenceError", status: "closed", phase: "—" },
  { id: "MD-P0-02", severity: "P0", dimension: "loading_states", role: "traveler", route: "/", title: "GET / 500 corrupt .next cache", status: "closed", phase: "—" },
  { id: "MD-P0-03", severity: "P0", dimension: "consumer_ux", role: "traveler", route: "/", title: "Draft cap 409 silent + stale session cache", status: "closed", phase: "—" },
  { id: "MD-P0-04", severity: "P0", dimension: "order_flow", role: "traveler", route: "/orders", title: "orders list filterOrders ReferenceError", status: "closed", phase: "—" },
  { id: "MD-P0-05", severity: "P0", dimension: "full_chain", role: "traveler", route: "/*", title: "GET /meta/build 404 missing Next rewrite", status: "closed", phase: "—" },
  { id: "MD-P1-01", severity: "P1", dimension: "copy_terminology", role: "traveler", route: "/market", title: "market_meta_description Escrow/Web3 jargon", status: "closed", phase: "—" },
  { id: "MD-P1-02", severity: "P1", dimension: "payment_flow", role: "traveler", route: "/pay", title: "Pay hub Deposit/Escrow/链上 consumer strings", status: "closed", phase: "—" },
  { id: "MD-P1-03", severity: "P1", dimension: "web3_hidden", role: "traveler", route: "/orders", title: "Draft order cards show contract address", status: "closed", phase: "—" },
  { id: "MD-P1-04", severity: "P1", dimension: "data_display", role: "traveler", route: "/", title: "Landing preview stale localStorage after cancel", status: "closed", phase: "—" },
  { id: "MD-P1-05", severity: "P1", dimension: "full_chain", role: "traveler", route: "/ → /escrow", title: "Traveler journey consumer copy sweep", status: "closed", phase: "—" },
  { id: "MD-P1-06", severity: "P1", dimension: "copy_terminology", role: "traveler", route: "/escrow/:id", title: "Draft trust strip shows ① 本地 / USDC demo jargon", status: "closed", phase: "—" },
  { id: "MD-P1-07", severity: "P1", dimension: "data_display", role: "traveler", route: "/#results", title: "Preview card total price dash when order.amount exists", status: "closed", phase: "—" },
  { id: "MD-P1-08", severity: "P1", dimension: "copy_terminology", role: "traveler", route: "/escrow/:id", title: "itin_dayCostPlaceholder dev-speak 待按日拆分", status: "closed", phase: "—" },
  { id: "MD-P1-09", severity: "P1", dimension: "information_architecture", role: "traveler", route: "/*", title: "Nav/back links label Web3 Travel not consumer task", status: "closed", phase: "—" },
  { id: "MD-P1-10", severity: "P1", dimension: "trust_proof", role: "traveler", route: "/*", title: "Footer/meta 去中心化 protocol jargon", status: "closed", phase: "—" },
  { id: "MD-P2-01", severity: "P2", dimension: "cta_paths", role: "traveler", route: "/escrow/:id", title: "URL path says escrow not order", status: "open", phase: "②" },
  { id: "MD-P2-02", severity: "P2", dimension: "visual_hierarchy", role: "traveler", route: "/market", title: "PES conversion rail structural chrome", status: "deferred", phase: "②" },
  { id: "MD-P2-03", severity: "P2", dimension: "web3_hidden", role: "traveler", route: "/pay", title: "Mock pay panel visible in chain-off dev", status: "deferred", phase: "③" },
  { id: "MD-P2-04", severity: "P2", dimension: "growth_referral", role: "traveler", route: "/me/referrals", title: "Referral consumer onboarding copy audit", status: "open", phase: "②" },
  { id: "MD-P2-05", severity: "P2", dimension: "ops_usability", role: "admin", route: "/admin", title: "ADM-U01 six-role staging matrix", status: "open", phase: "②" },
  { id: "MD-P2-06", severity: "P2", dimension: "cross_browser", role: "traveler", route: "/*", title: "Safari iOS wallet connect edge cases", status: "open", phase: "②" },
  { id: "MD-P2-07", severity: "P2", dimension: "loading_states", role: "traveler", route: "/", title: "Home first compile 30s+ cold start", status: "open", phase: "②" },
  { id: "MD-P2-08", severity: "P2", dimension: "five_role_loop", role: "guide", route: "/guide", title: "Guide accept → pay handoff copy parity", status: "open", phase: "②" },
  { id: "MD-P2-09", severity: "P2", dimension: "data_display", role: "traveler", route: "/escrow/:id", title: "Quote sidebar shows USDC not 美元估算 consumer label", status: "open", phase: "②" },
  { id: "MD-P2-10", severity: "P2", dimension: "information_architecture", role: "traveler", route: "/*", title: "Footer tech column 费路由/Polygon badges on consumer paths", status: "open", phase: "②" },
  { id: "MD-P2-11", severity: "P2", dimension: "copy_terminology", role: "traveler", route: "/market", title: "market_web3Guide label still Web3 向导", status: "open", phase: "②" },
  { id: "MD-P2-12", severity: "P2", dimension: "copy_terminology", role: "governance", route: "/traveltrust", title: "/traveltrust cinematic Web3 brand narrative (intentional)", status: "deferred", phase: "②" },
  { id: "MD-P2-13", severity: "P2", dimension: "market_flow", role: "merchant", route: "/market/provider", title: "Merchant studio escrow ack copy Escrow contract terms", status: "open", phase: "②" },
  { id: "MD-P2-14", severity: "P2", dimension: "community_flow", role: "traveler", route: "/community", title: "Community empty/loading states parity with orders L5", status: "open", phase: "②" },
  { id: "MD-P1-11", severity: "P1", dimension: "market_flow", role: "traveler", route: "/guides/:id", title: "Guide profile page cyan/PII/e2e bio stitched vs market L5", status: "closed", phase: "—" },
  { id: "MD-P1-12", severity: "P1", dimension: "data_display", role: "traveler", route: "/market", title: "Guide drawer raw zh language + specialty without hint", status: "closed", phase: "—" },
] as const;

export const L5_MULTI_DIM_OPEN_P0 = L5_MULTI_DIMENSIONAL_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);

export const L5_MULTI_DIM_OPEN_P1 = L5_MULTI_DIMENSIONAL_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);

export const L5_FIVE_ROLE_AUDIT_ROLES: readonly L5AuditRole[] = [
  "traveler",
  "guide",
  "merchant",
  "admin",
  "governance",
] as const;
