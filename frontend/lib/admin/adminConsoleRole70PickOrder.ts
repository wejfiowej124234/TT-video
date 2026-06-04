import { CONSOLE_ROLES_70, type ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";

/** RBAC-04 · 六角色快选：当前 DB/控制台角色置顶（其余保持 70 序）。 */
export function orderConsoleRoles70WithCurrentFirst(
  currentRole: ConsoleRole70 | null | undefined,
): ConsoleRole70[] {
  if (!currentRole) return [...CONSOLE_ROLES_70];
  return [currentRole, ...CONSOLE_ROLES_70.filter((roleId) => roleId !== currentRole)];
}
