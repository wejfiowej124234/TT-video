import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";

export const OPERATOR_GUIDE_FLOW_LINKS = [
  { href: "/admin/inbox", key: "admin_operator_flow_inbox" },
  { href: ADMIN_INBOX_QUEUE_HREFS.provider, key: "admin_operator_flow_provider" },
  { href: ADMIN_INBOX_QUEUE_HREFS.steward, key: "admin_operator_flow_steward" },
  { href: ADMIN_INBOX_QUEUE_HREFS.approvals, key: "admin_operator_flow_approvals" },
  { href: ADMIN_INBOX_QUEUE_HREFS.reports, key: "admin_operator_flow_reports" },
  { href: "/admin/permissions", key: "admin_operator_flow_permissions" },
] as const;

export { OPERATOR_GUIDE_PHASE2_PREP_COMMANDS } from "@/lib/admin/adminPhase2LocalPrepCommands";

/** ① 角色/资金预备动线（非 ② Staging GO）。 */
export const OPERATOR_GUIDE_ROLE_PREP_LINKS = [
  { href: "/admin/permissions#admin-shell-preview", key: "admin_operator_flow_shell_preview" },
  { href: "/admin/permissions#admin-adm-u01-local-prep", key: "admin_operator_flow_adm_u01_prep" },
  { href: "/admin/permissions#admin-console-role-self-assign", key: "admin_operator_flow_self_role" },
  { href: "/admin/permissions#admin-phase2-remaining-backlog", key: "admin_operator_flow_phase2_backlog" },
  { href: "/admin/finance-suite", key: "admin_operator_flow_finance_suite" },
] as const;
