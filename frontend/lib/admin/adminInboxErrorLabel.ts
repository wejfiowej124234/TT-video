import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

export function adminInboxErrorLabelKey(kind: AdminFetchErrorKind | null): string | null {
  if (!kind) return null;
  switch (kind) {
    case "login_required":
      return "admin_home_inbox_err_login";
    case "admin_required":
    case "forbidden":
      return "admin_home_inbox_err_forbidden";
    case "not_implemented":
    case "admin_db_required":
      return "admin_home_inbox_err_chain_off";
    case "user_not_found":
      return "admin_home_inbox_err_session";
    default:
      return "admin_home_inbox_err_generic";
  }
}
