import { CONSOLE_ROLES_70, type ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";

/** ADM-U01 Shell 分组可见性（与 registry/admin-rbac-staging-probes.v1.yaml shell_groups 同源）。 */
export const ADM_U01_SHELL_GROUP_IDS = [
  "onboarding",
  "operations",
  "community",
  "finance",
  "governance",
  "more",
] as const;

export type AdmU01ShellGroupId = (typeof ADM_U01_SHELL_GROUP_IDS)[number];

export const ADM_U01_SHELL_GROUP_LABEL_KEYS: Record<AdmU01ShellGroupId, string> = {
  onboarding: "admin_shell_nav_group_onboarding",
  operations: "admin_shell_nav_group_operations",
  community: "admin_shell_nav_group_community",
  finance: "admin_shell_nav_group_finance",
  governance: "admin_shell_nav_group_governance",
  more: "admin_shell_nav_group_more",
};

export const ADM_U01_SHELL_GROUP_VISIBILITY: Record<
  AdmU01ShellGroupId,
  Record<ConsoleRole70, boolean>
> = {
  onboarding: {
    SuperAdmin: true,
    Ops: true,
    CS: true,
    Risk: true,
    Finance: true,
    Auditor: true,
  },
  operations: {
    SuperAdmin: true,
    Ops: true,
    CS: true,
    Risk: true,
    Finance: true,
    Auditor: true,
  },
  community: {
    SuperAdmin: true,
    Ops: true,
    CS: true,
    Risk: true,
    Finance: false,
    Auditor: true,
  },
  finance: {
    SuperAdmin: true,
    Ops: true,
    CS: false,
    Risk: false,
    Finance: true,
    Auditor: true,
  },
  governance: {
    SuperAdmin: true,
    Ops: true,
    CS: true,
    Risk: true,
    Finance: true,
    Auditor: true,
  },
  more: {
    SuperAdmin: true,
    Ops: true,
    CS: true,
    Risk: true,
    Finance: true,
    Auditor: true,
  },
};

export function admU01ShellGroupVisible(groupId: AdmU01ShellGroupId, role: ConsoleRole70): boolean {
  return ADM_U01_SHELL_GROUP_VISIBILITY[groupId][role];
}

/** 契约 / e2e 用：六角色 id 列表（与 CONSOLE_ROLES_70 同序）。 */
export const ADM_U01_ROLES = CONSOLE_ROLES_70;
