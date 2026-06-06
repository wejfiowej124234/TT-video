"use client";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { ADMIN_LIST_FETCH_ERROR_CLASS } from "@/lib/adminUi";

/** 列表页统一 API 失败展示（HON-03 · ADM-P1-06 stale-while-error 诚实）。 */
export function AdminListFetchError(props: {
  errorKind: AdminFetchErrorKind;
  message: string;
  className?: string;
  staleWhileError?: boolean;
}) {
  const { errorKind, message, className, staleWhileError = false } = props;

  return (
    <div
      data-tt-admin-list-fetch-error={errorKind}
      data-tt-admin-list-stale-while-error={staleWhileError ? "1" : undefined}
    >
      <AdminAlertError
        errorKind={errorKind}
        message={message}
        className={className ?? ADMIN_LIST_FETCH_ERROR_CLASS}
      />
    </div>
  );
}
