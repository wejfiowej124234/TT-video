import { meRoleFromGetMe } from "@/lib/meRole";

const ADMIN_ACTOR_ROLES = new Set(["admin", "super_admin"]);

/** 70 / `require_admin_actor`：与 API `admin` | `super_admin` 一致。 */
export function isAdminActorRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ACTOR_ROLES.has(role.trim().toLowerCase());
}

export function isSuperAdminActorRole(role: string | null | undefined): boolean {
  return (role ?? "").trim().toLowerCase() === "super_admin";
}

export function adminActorRoleFromMe(me: unknown): string | null {
  return meRoleFromGetMe(me);
}

export function adminActorLabelKey(role: string | null | undefined): "admin_shell_role_super_admin" | "admin_shell_role_admin" | null {
  if (!isAdminActorRole(role)) return null;
  return isSuperAdminActorRole(role) ? "admin_shell_role_super_admin" : "admin_shell_role_admin";
}
