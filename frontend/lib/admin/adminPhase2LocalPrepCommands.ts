import type { AdminPhase2RemainingBacklogId } from "@/lib/admin/adminPhase2RemainingBacklog";

/** CI-02 / 六项 backlog · ① 本地预备命令 SSOT（与 locale `admin_phase2_backlog_cmd_*` 同源）。 */
export const ADMIN_PHASE2_LOCAL_PREP_COMMANDS: Record<AdminPhase2RemainingBacklogId, string> = {
  "ADM-UX-IA-06":
    "ADM_U01_DB_ROLE_PREP=1 bash scripts/dev/run-admin-adm-u01-db-role-local-prep.sh",
  "ADM-UX-ONB-04":
    "bash scripts/dev/smoke-admin-pages-local.sh  # + /admin/onboarding/payment-events",
  "ADM-UX-RBAC-05": "ADM_U01_LOCAL_PREP=1 bash scripts/dev/run-admin-adm-u01-local-prep.sh",
  "ADM-UX-RBAC-06": "ADM_U02_LOCAL_PREP=1 bash scripts/dev/run-admin-adm-u02-local-prep.sh",
  "ADM-UX-FIN-02":
    "node scripts/dev/run-admin-l5-green.mjs  # + /admin/finance-suite partial depth",
  "ADM-UX-CI-02": "bash scripts/dev/run-admin-remaining-local-prep.sh",
};

/** 权限页快捷预备（② 开工前三条 · 非 staging GO）。 */
export const ADMIN_PHASE2_RUNBOOK_QUICK_COMMANDS = [
  {
    id: "l5-green",
    titleKey: "admin_phase2_runbook_l5_green",
    command: "node scripts/dev/run-admin-l5-green.mjs",
  },
  {
    id: "remaining-prep",
    titleKey: "admin_phase2_runbook_remaining_prep",
    command: "bash scripts/dev/run-admin-remaining-local-prep.sh",
  },
  {
    id: "adm-u01",
    titleKey: "admin_phase2_runbook_adm_u01",
    command: "ADM_U01_LOCAL_PREP=1 bash scripts/dev/run-admin-adm-u01-local-prep.sh",
  },
  {
    id: "closure-skeleton",
    titleKey: "admin_phase2_runbook_closure_skeleton",
    command: "bash scripts/dev/generate-phase2-admin-closure-skeleton.sh",
  },
] as const;

export function adminPhase2LocalPrepCommand(id: AdminPhase2RemainingBacklogId): string {
  return ADMIN_PHASE2_LOCAL_PREP_COMMANDS[id];
}

/** ADM-U01 · ① Shell 矩阵本地预备（session 预览 vs DB 控制台角色 · 非 ② staging）。 */
export const ADMIN_ADM_U01_SHELL_PREP_FLOWS = [
  {
    id: "session-preview",
    titleKey: "admin_adm_u01_prep_session_title",
    descKey: "admin_adm_u01_prep_session_desc",
    command: "ADM_U01_LOCAL_PREP=1 bash scripts/dev/run-admin-adm-u01-local-prep.sh",
    evidencePath: "evidence/GO_local_admin_workspace_closure/adm-u01-local-prep/",
    backlogIds: ["ADM-UX-RBAC-05"] as const,
  },
  {
    id: "db-console-role",
    titleKey: "admin_adm_u01_prep_db_title",
    descKey: "admin_adm_u01_prep_db_desc",
    command:
      "ADM_U01_DB_ROLE_PREP=1 bash scripts/dev/run-admin-adm-u01-db-role-local-prep.sh",
    evidencePath:
      "evidence/GO_local_admin_workspace_closure/adm-u01-db-role-local-prep/playwright-db-role-shell-matrix.json",
    backlogIds: ["ADM-UX-IA-06"] as const,
  },
] as const;

/** ② 仅文档列出（① 不得宣称已跑通）。 */
export const ADMIN_PHASE2_STAGING_ONLY_COMMANDS = [
  "bash scripts/dev/record-phase2-admin-adm-u01-then-u02.sh",
] as const;

/** 操作手册 Phase② 预备命令列表（SSOT · 与 UI 复制同源）。 */
export const OPERATOR_GUIDE_PHASE2_PREP_COMMANDS = [
  "bash scripts/dev/run-admin-remaining-local-prep.sh",
  "bash scripts/dev/run-admin-phase2-prep-skeleton-local.sh",
  "ADM_U02_UI_PREP=1 bash scripts/dev/run-admin-adm-u02-local-prep.sh",
  ...ADMIN_PHASE2_RUNBOOK_QUICK_COMMANDS.map((row) => row.command),
  ...ADMIN_ADM_U01_SHELL_PREP_FLOWS.map((row) => row.command),
  ...ADMIN_PHASE2_STAGING_ONLY_COMMANDS,
] as const;
