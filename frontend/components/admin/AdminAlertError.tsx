"use client";

import Link from "next/link";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {
  ADMIN_ALERT_ERROR_CLASS,
  ADMIN_ALERT_ERROR_COMPACT_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

/** 统一告警块：列表 fetch / 表单校验 / 写操作失败（HON-03）。 */
export function AdminAlertError(props: {
  message: string;
  errorKind?: AdminFetchErrorKind | null;
  className?: string;
  id?: string;
  compact?: boolean;
}) {
  const { message, errorKind, className, id, compact } = props;
  const showLogin = errorKind === "login_required";

  return (
    <div
      id={id}
      className={className ?? (compact ? ADMIN_ALERT_ERROR_COMPACT_CLASS : `${ADMIN_ALERT_ERROR_CLASS} text-body`)}
      role="alert"
      data-tt-admin-alert-error={errorKind ?? "validation"}
    >
      <p>{message}</p>
      {showLogin ? (
        <p className="mt-2">
          <Link href="/auth/login" className={adminTableInlineLinkClass()}>
            → /auth/login
          </Link>
        </p>
      ) : null}
    </div>
  );
}
