import { adminApiErrorUserText } from "@/lib/adminFetchDisplay";
import {
  USERS_EMAIL_FILTER_MAX,
  clampUserOffset,
} from "@/lib/admin/usersSearchSuspendL5";

export const TARGET_ROLES = ["tourist", "guide", "arbitrator", "admin", "super_admin"] as const;
export const ROLE_FILTER_MAX = 32;
/** @deprecated Owner DELETE KYC — kept only so stale URLs strip cleanly */
export const KYC_FILTER_MAX = 32;
export const EMAIL_FILTER_MAX = USERS_EMAIL_FILTER_MAX;

export function defaultTargetRole(current: string): string {
  const c = current.trim();
  const alt = TARGET_ROLES.find((r) => r !== c);
  return alt ?? TARGET_ROLES[0];
}

export function roleChangeErrText(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "invalid_user_id":
      return t("admin_users_roleErrInvalidUser");
    case "unsupported_target_role":
      return t("admin_users_roleErrUnsupportedRole");
    case "target_user_not_found":
      return t("admin_users_roleErrTargetNotFound");
    case "role_unchanged":
      return t("admin_users_roleErrUnchanged");
    case "admin_role_change_request_failed":
      return t("admin_users_roleErrPersist");
    case "admin_db_required":
      return t("admin_users_roleErrDb");
    default:
      return adminApiErrorUserText(code, t);
  }
}

export function clampUserLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export type UsersListQuery = {
  limit: number;
  offset: number;
  role: string;
  email: string;
};

export function parseUsersListQuery(sp: URLSearchParams): UsersListQuery {
  const limit = clampUserLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const offset = clampUserOffset(Number.parseInt(sp.get("offset") ?? "0", 10));
  const role = (sp.get("role") ?? "").trim().slice(0, ROLE_FILTER_MAX);
  const email = (sp.get("email") ?? "").trim().slice(0, EMAIL_FILTER_MAX);
  // Ignore legacy `kyc_status` query (Owner DELETE KYC — V65-PROD-003 G057).
  void sp.get("kyc_status");
  return { limit, offset, role, email };
}

export function buildUsersListPath(q: UsersListQuery): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampUserLimit(q.limit)));
  const off = clampUserOffset(q.offset);
  if (off > 0) sp.set("offset", String(off));
  const r = q.role.trim().slice(0, ROLE_FILTER_MAX);
  if (r) sp.set("role", r);
  const e = q.email.trim().slice(0, EMAIL_FILTER_MAX);
  if (e) sp.set("email", e);
  return `/admin/users?${sp.toString()}`;
}
