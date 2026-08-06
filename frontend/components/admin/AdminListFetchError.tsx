"use client";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { OpsPlaneAuthHints } from "@/components/admin/ops/OpsPlaneAuthHints";
import { ADMIN_LIST_FETCH_ERROR_CLASS } from "@/lib/adminUi";

/** 列表页统一 API 失败展示（HON-03 · ADM-P1-06 stale-while-error · Cut B R057 auth hints）。 */
export function AdminListFetchError(props: {
  errorKind: AdminFetchErrorKind;
  message: string;
  className?: string;
  staleWhileError?: boolean;
  /** Raw error key / kind string for OpsPlaneAuthHints (403/2FA/approval). */
  errorKey?: string | null;
  /** When false, skip hints (OpsPlane chrome already renders OpsPlaneAuthHints). Default true. */
  showAuthHints?: boolean;
}) {
  const {
    errorKind,
    message,
    className,
    staleWhileError = false,
    errorKey,
    showAuthHints = true,
  } = props;
  const hintKey = errorKey?.trim() || errorKind;

  return (
    <div
      data-tt-admin-list-fetch-error={errorKind}
      data-tt-admin-list-stale-while-error={staleWhileError ? "1" : undefined}
      data-tt-admin-list-fetch-auth-hints={showAuthHints ? "1" : "0"}
    >
      {showAuthHints ? <OpsPlaneAuthHints errorKey={hintKey} /> : null}
      <AdminAlertError
        errorKind={errorKind}
        message={message}
        className={className ?? ADMIN_LIST_FETCH_ERROR_CLASS}
      />
    </div>
  );
}
