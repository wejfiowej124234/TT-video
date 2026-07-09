import { adminActorRoleFromMe, isSuperAdminActorRole } from "@/lib/admin/adminActorFromMe";

/**
 * Business immutable C2 · seed Step 6b2 SuperAdmin dev shortcut.
 * SSOT: registry/test-accounts-business-immutable.v1.yaml (C2 · tourist@test.com)
 * ≠ ADM-U01 six-role console personas.
 */
export const ADMIN_BUSINESS_SUPERADMIN_SHORTCUT_EMAILS = new Set([
  "tourist@test.com",
]);

export function meEmailFromGetMe(me: unknown): string | null {
  if (!me || typeof me !== "object") return null;
  const email = (me as { user?: { email?: string } }).user?.email;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

export function isAdminBusinessSuperAdminShortcut(me: unknown): boolean {
  if (!isSuperAdminActorRole(adminActorRoleFromMe(me))) return false;
  const email = meEmailFromGetMe(me);
  return email !== null && ADMIN_BUSINESS_SUPERADMIN_SHORTCUT_EMAILS.has(email);
}
