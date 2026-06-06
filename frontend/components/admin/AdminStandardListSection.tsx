"use client";

import type { ReactNode } from "react";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

/** ① · ADM-P1-06：错误时保留 stale rows + 显式标记（非互斥隐藏表体）。 */
export function AdminStandardListSection(props: {
  loading: boolean;
  refreshing?: boolean;
  error: AdminFetchErrorKind | null;
  staleWhileError?: boolean;
  itemsLength: number;
  loadingMessage: string;
  errorMessage: string;
  empty: ReactNode;
  children: ReactNode;
  className?: string;
  "data-tt-admin-list-refreshing"?: string;
  "aria-live"?: "polite" | "off";
}) {
  const {
    loading,
    error,
    staleWhileError = false,
    itemsLength,
    loadingMessage,
    errorMessage,
    empty,
    children,
    className,
    ...rest
  } = props;

  const showStale = Boolean(error && (staleWhileError || itemsLength > 0));

  return (
    <section className={className} aria-live={rest["aria-live"] ?? "polite"} {...rest}>
      {loading && itemsLength === 0 ? (
        <AdminListLoadingStatus message={loadingMessage} className="text-body text-ink-600" />
      ) : null}
      {error ? (
        <AdminListFetchError
          errorKind={error}
          message={errorMessage}
          staleWhileError={showStale}
        />
      ) : null}
      {!loading && itemsLength === 0 && !error ? empty : null}
      {itemsLength > 0 ? children : null}
    </section>
  );
}
