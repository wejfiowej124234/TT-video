/** 70 六角色 · ① 预备矩阵（展示 SSOT；生效权限以 `GET /api/v1/admin/capabilities` 为准）。 */

export const CONSOLE_ROLES_70 = [
  "SuperAdmin",
  "Ops",
  "CS",
  "Risk",
  "Finance",
  "Auditor",
] as const;

export type ConsoleRole70 = (typeof CONSOLE_ROLES_70)[number];

export const CONSOLE_ROLE_70_LABEL_KEYS: Record<ConsoleRole70, string> = {
  SuperAdmin: "admin_role70_super",
  Ops: "admin_role70_ops",
  CS: "admin_role70_cs",
  Risk: "admin_role70_risk",
  Finance: "admin_role70_finance",
  Auditor: "admin_role70_auditor",
};

export type AdminPhase2PrepFlags = {
  admin_console_role_db?: boolean;
  permission_center_edit?: boolean;
  console_role_approval_wired?: boolean;
  audit_logs_persist?: boolean;
  adm_u02_local_ready?: boolean;
  totp_verification_wired?: boolean;
  enforce_2fa?: boolean;
  staging_admin_matrix_go?: boolean;
  production_admin_go?: boolean;
  console_role_direct_allowed?: boolean;
  implementation_note?: string;
};
