/** 登录页 · 治理 SSOT 修补进度清单（① 本地只读 · 与 locale item_* 键同步） */
export type AuthLoginGovernanceRemediationStatus = "done" | "in_progress" | "pending";

export type AuthLoginGovernanceRemediationItem = {
  id: string;
  localeKey: string;
  status: AuthLoginGovernanceRemediationStatus;
};

export const AUTH_LOGIN_GOVERNANCE_REMEDIATION_ITEMS: AuthLoginGovernanceRemediationItem[] = [
  { id: "ui_pro_rata_copy", localeKey: "auth_login_governance_remediation_item_ui_pro_rata_copy", status: "done" },
  {
    id: "params_treasury_policy_section",
    localeKey: "auth_login_governance_remediation_item_params_treasury_policy_section",
    status: "done",
  },
  {
    id: "p4_governance_options",
    localeKey: "auth_login_governance_remediation_item_p4_governance_options",
    status: "done",
  },
  {
    id: "public_sale_rounds",
    localeKey: "auth_login_governance_remediation_item_public_sale_rounds",
    status: "done",
  },
  { id: "seat_exit_ssot", localeKey: "auth_login_governance_remediation_item_seat_exit_ssot", status: "done" },
  {
    id: "legal_08_4_crossref",
    localeKey: "auth_login_governance_remediation_item_legal_08_4_crossref",
    status: "done",
  },
  {
    id: "tokenomics_freeze_gov",
    localeKey: "auth_login_governance_remediation_item_tokenomics_freeze_gov",
    status: "done",
  },
  {
    id: "legal_signoff_items",
    localeKey: "auth_login_governance_remediation_item_legal_signoff_items",
    status: "in_progress",
  },
  {
    id: "accruals_wording",
    localeKey: "auth_login_governance_remediation_item_accruals_wording",
    status: "done",
  },
  {
    id: "onchain_treasury_buyback",
    localeKey: "auth_login_governance_remediation_item_onchain_treasury_buyback",
    status: "pending",
  },
  {
    id: "onchain_primary_market",
    localeKey: "auth_login_governance_remediation_item_onchain_primary_market",
    status: "pending",
  },
  {
    id: "kyc_aml_public_sale",
    localeKey: "auth_login_governance_remediation_item_kyc_aml_public_sale",
    status: "pending",
  },
];

export function authLoginGovernanceRemediationProgressSummary(
  items: AuthLoginGovernanceRemediationItem[] = AUTH_LOGIN_GOVERNANCE_REMEDIATION_ITEMS,
) {
  const total = items.length;
  const done = items.filter((item) => item.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}
