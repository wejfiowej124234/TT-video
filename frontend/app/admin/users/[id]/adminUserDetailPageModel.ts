export type AdminUserDetailRes = {
  status?: string;
  error?: string;
  user?: Record<string, unknown>;
  meta?: unknown;
};

export const ADMIN_USER_OUTBOUND_URL_KEYS = new Set(["avatar_url"]);

export function fmtUserDetailValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export const USER_DETAIL_ROW_DEFS: { key: string; labelKey: string }[] = [
  { key: "id", labelKey: "admin_user_detail_id" },
  { key: "email", labelKey: "admin_users_colEmail" },
  { key: "role", labelKey: "admin_users_colRole" },
  { key: "kyc_status", labelKey: "admin_users_colKyc" },
  { key: "nickname", labelKey: "admin_user_detail_nickname" },
  { key: "avatar_url", labelKey: "admin_user_detail_avatarUrl" },
  { key: "default_wallet_address", labelKey: "admin_user_detail_wallet" },
  { key: "created_at", labelKey: "admin_users_colCreated" },
  { key: "updated_at", labelKey: "admin_user_detail_updatedAt" },
];
