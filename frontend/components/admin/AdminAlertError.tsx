"use client";

import Link from "next/link";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { ADMIN_LINK_FOCUS_CLASS, adminTableInlineLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const BASE_CLASS =
  "rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-danger";
const COMPACT_CLASS =
  "rounded-[var(--radius-sm)] border border-danger/20 bg-danger/5 p-2 text-small text-danger";

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
      className={className ?? (compact ? COMPACT_CLASS : `${BASE_CLASS} text-body`)}
      role="alert"
      data-tt-admin-alert-error={errorKind ?? "validation"}
    >
      <p>{message}</p>
      {showLogin ? (
        <p className="mt-2">
          <Link
            href="/auth/login"
            className={`${adminTableInlineLinkClass()}`}
          >
            → /auth/login
          </Link>
        </p>
      ) : null}
    </div>
  );
}
