/**
 * L5 Cross-Role Reality Audit Program · 五角色真实任务 SSOT（① · 功能冻结）
 * 标准：功能存在 ≠ 通过；须「无需培训即可完成核心任务」
 */
export const L5_CROSS_ROLE_REALITY_AUDIT_ID = "l5-cross-role-reality-audit-20260608" as const;

export type L5CrossRoleId = "traveler" | "guide" | "merchant" | "admin" | "governance";

export type L5CrossRoleCoreTask = {
  role: L5CrossRoleId;
  /** 注册 → 发现 → 决策 → 执行 → 完成 → 回访 */
  phases: readonly {
    phase: "register" | "discover" | "decide" | "execute" | "complete" | "return";
    route: string;
    probeKeys: readonly string[];
  }[];
};

export const L5_CROSS_ROLE_CORE_TASKS: readonly L5CrossRoleCoreTask[] = [
  {
    role: "traveler",
    phases: [
      { phase: "register", route: "/auth/register", probeKeys: ["auth_register_meta_description"] },
      { phase: "discover", route: "/", probeKeys: ["landing_hero_title", "landing_btn_generate"] },
      { phase: "decide", route: "/#landing-results", probeKeys: ["landing_results_next_step"] },
      { phase: "execute", route: "/escrow/:id", probeKeys: ["escrow_draftNextStep_save", "market_bindGuide_banner"] },
      { phase: "complete", route: "/pay", probeKeys: ["pay_pageTitle", "pay_disclaimer"] },
      { phase: "return", route: "/orders", probeKeys: ["orders_myOrders", "orders_desc"] },
    ],
  },
  {
    role: "guide",
    phases: [
      { phase: "register", route: "/guide/register", probeKeys: ["guideRegister_title", "guide_dashboard_cta_register"] },
      {
        phase: "discover",
        route: "/guide",
        probeKeys: ["guide_dashboard_title", "guide_workbench_inbox_title", "guide_workbench_enter_order"],
      },
      { phase: "execute", route: "/market", probeKeys: ["header_market", "market_acceptSuccess"] },
      { phase: "return", route: "/orders", probeKeys: ["nav_orders"] },
    ],
  },
  {
    role: "merchant",
    phases: [
      { phase: "discover", route: "/me/identities", probeKeys: ["me_identities_hub_title", "me_identities_card_provider_desc"] },
      { phase: "register", route: "/provider/register", probeKeys: ["providerRegister_title", "providerRegister_eyebrow"] },
      { phase: "execute", route: "/me/onboarding", probeKeys: ["me_identities_card_cta_complete_payment"] },
    ],
  },
  {
    role: "admin",
    phases: [
      { phase: "discover", route: "/admin", probeKeys: ["admin_workspace_title", "admin_home_guide_step1"] },
      { phase: "execute", route: "/admin", probeKeys: ["admin_home_inbox_title", "admin_home_inbox_cta_process"] },
    ],
  },
  {
    role: "governance",
    phases: [
      { phase: "discover", route: "/governance", probeKeys: ["governance_title", "governance_desc"] },
      { phase: "decide", route: "/governance/proposals", probeKeys: ["governance_proposals_title"] },
      { phase: "execute", route: "/governance/delegate", probeKeys: ["governance_delegate_nav"] },
    ],
  },
] as const;

export type L5CrossRoleFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  role: L5CrossRoleId;
  route: string;
  title: string;
  status: "closed" | "open" | "deferred";
  phase: "—" | "②" | "③";
};

/** 与 evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md 同步 */
export const L5_CROSS_ROLE_REALITY_FINDINGS: readonly L5CrossRoleFinding[] = [
  { id: "CRRA-P0-01", severity: "P0", role: "traveler", route: "/#results", title: "Preview crash stablecoinPair", status: "closed", phase: "—" },
  { id: "CRRA-P0-02", severity: "P0", role: "traveler", route: "/orders", title: "Orders list ReferenceError", status: "closed", phase: "—" },
  { id: "CRRA-P1-01", severity: "P1", role: "governance", route: "/governance", title: "Hub desc says placeholder + 13-1 doc refs", status: "closed", phase: "—" },
  { id: "CRRA-P1-02", severity: "P1", role: "governance", route: "/governance", title: "B-428 runbook path visible to first-time visitor", status: "closed", phase: "—" },
  { id: "CRRA-P1-03", severity: "P1", role: "guide", route: "/market", title: "Accept success copy 托管 jargon no traveler pay handoff", status: "closed", phase: "—" },
  { id: "CRRA-P1-04", severity: "P1", role: "traveler", route: "/me/identities", title: "Role hub 五槽/DID/onboarding dev speak", status: "closed", phase: "—" },
  { id: "CRRA-P1-05", severity: "P1", role: "merchant", route: "/provider/register", title: "Provider · USDC eyebrow blocks untrained merchant", status: "closed", phase: "—" },
  { id: "CRRA-P1-06", severity: "P1", role: "traveler", route: "/#results", title: "Preview card total dash when order.amount present", status: "closed", phase: "—" },
  { id: "CRRA-P2-01", severity: "P2", role: "traveler", route: "/escrow/:id", title: "Quote sidebar USDC label vs 美元估算", status: "open", phase: "②" },
  { id: "CRRA-P2-02", severity: "P2", role: "guide", route: "/guide", title: "Accept → pay handoff in-app notification parity", status: "open", phase: "②" },
  { id: "CRRA-P2-03", severity: "P2", role: "traveler", route: "/me/referrals", title: "Growth referral first-task clarity", status: "open", phase: "②" },
  { id: "CRRA-P2-04", severity: "P2", role: "admin", route: "/admin", title: "ADM-U01 six-role staging matrix", status: "open", phase: "②" },
  { id: "CRRA-P2-05", severity: "P2", role: "traveler", route: "/*", title: "Footer tech column fee routes on consumer paths", status: "open", phase: "②" },
] as const;

export const L5_CROSS_ROLE_OPEN_P0 = L5_CROSS_ROLE_REALITY_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);

export const L5_CROSS_ROLE_OPEN_P1 = L5_CROSS_ROLE_REALITY_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);

/** Governance / role-hub keys must not expose runbook paths or placeholder admissions */
export const L5_CROSS_ROLE_BANNED_REALITY_COPY =
  /功能占位|placeholder|13-1|B-428|docs\/runbook|Timelock|五槽分轨|链上 DID|Provider ·|① 本地/i;

export const L5_CROSS_ROLE_REALITY_LOCALE_KEYS = [
  "governance_desc",
  "governance_b428_closeloop_doc_pointer",
  "governance_hub_target_notice",
  "market_acceptSuccess",
  "me_identities_hub_eyebrow",
  "me_identities_hub_subtitle",
  "me_identities_card_guide_desc",
  "me_identities_card_traveler_desc",
  "providerRegister_eyebrow",
  "providerRegister_intro",
] as const;
