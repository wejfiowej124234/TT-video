"use client";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

import { AdminAlertError } from "@/components/admin/AdminAlertError";

/** 列表页统一 API 失败展示（HON-03）。 */
export function AdminListFetchError(props: {
  errorKind: AdminFetchErrorKind;
  message: string;
  className?: string;
}) {
  const { errorKind, message, className } = props;

  return (
    <div data-tt-admin-list-fetch-error={errorKind}>
      <AdminAlertError
        errorKind={errorKind}
        message={message}
        className={
          className ??
          "mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger"
        }
      />
    </div>
  );
}
