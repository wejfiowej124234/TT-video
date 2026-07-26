"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {
  ADMIN_BTN_SECONDARY_CLASS,
  ADMIN_CONSOLE_SKELETON_BLOCK_CLASS,
  ADMIN_CONSOLE_SKELETON_LINE_CLASS,
  ADMIN_MOTION_SKELETON_CLASS,
} from "@/lib/adminUi";

/** Batch-10 W14 · HU-266：按错误串区分 403/503/缺表/失败，禁单一「加载失败」。 */
export function inferErrorKind(errorKey: string | null | undefined): AdminFetchErrorKind {
  const k = (errorKey ?? "").toLowerCase();
  if (k.includes("2fa") || k.includes("totp")) return "admin_permission_denied";
  if (k.includes("forbidden") || k.includes("perm") || k.includes("denied") || k.includes("403"))
    return "forbidden";
  if (k.includes("login") || k.includes("unauthorized") || k.includes("401")) return "login_required";
  if (k.includes("approval")) return "invalid_request";
  if (k.includes("not_found") || k.includes("404") || k.includes("missing_table") || k.includes("undefined_table"))
    return "not_found";
  if (
    k.includes("503") ||
    k.includes("502") ||
    k.includes("504") ||
    k.includes("unavailable") ||
    k.includes("timeout") ||
    k.includes("server_error") ||
    k.includes("500") ||
    k.includes("query_failed") ||
    k.includes("db_required")
  )
    return "server_error";
  if (k.includes("admin_db")) return "admin_db_required";
  return "failed";
}

/** Permission / 2FA / approval hints for ops-plane API errors (157 backend · FE honest). */
export function OpsPlaneAuthHints(props: { errorKey?: string | null }) {
  const { t } = useTranslation();
  const key = props.errorKey ?? "";
  if (!key) return null;
  const lower = key.toLowerCase();
  let hintKey: string | null = null;
  if (lower.includes("2fa") || lower.includes("totp")) hintKey = "ops_plane_hint_2fa";
  else if (lower.includes("forbidden") || lower.includes("perm") || lower.includes("denied") || lower.includes("403"))
    hintKey = "ops_plane_hint_permission";
  else if (lower.includes("approval")) hintKey = "ops_plane_hint_approval";
  else if (lower.includes("503") || lower.includes("unavailable") || lower.includes("timeout"))
    hintKey = "ops_plane_hint_unavailable";
  else if (lower.includes("missing_table") || lower.includes("undefined_table") || lower.includes("404"))
    hintKey = "ops_plane_hint_missing_resource";
  if (!hintKey) return null;
  return (
    <p className="mb-2 text-small text-ink-500" data-tt-ops-plane-auth-hint="1" role="note">
      {t(hintKey)}
    </p>
  );
}

export type OpsPlaneFetchStatesProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessageKey?: string;
  loadingHintKey?: string;
  empty?: boolean;
  emptyMessageKey?: string;
  emptyHintKey?: string;
  skeleton?: boolean;
  children?: React.ReactNode;
};

/** Unified loading · skeleton · empty · error · retry for CMS / Official / Growth ops planes. */
export function OpsPlaneFetchStates(props: OpsPlaneFetchStatesProps) {
  const { t } = useTranslation();
  const {
    loading,
    error,
    onRetry,
    loadingMessageKey = "ops_plane_loading",
    loadingHintKey,
    empty,
    emptyMessageKey = "ops_plane_empty",
    emptyHintKey,
    skeleton = true,
    children,
  } = props;

  if (loading) {
    if (skeleton) {
      return (
        <div
          className="mt-4 space-y-3"
          role="status"
          aria-live="polite"
          data-tt-ops-plane-loading="1"
          data-tt-ops-plane-skeleton="1"
          data-tt-admin-console-skeleton="1"
        >
          <div className={`h-4 w-2/5 rounded ${ADMIN_MOTION_SKELETON_CLASS} ${ADMIN_CONSOLE_SKELETON_LINE_CLASS}`} />
          <div className={`h-24 rounded-lg ${ADMIN_MOTION_SKELETON_CLASS} ${ADMIN_CONSOLE_SKELETON_BLOCK_CLASS}`} />
          <p className="text-body-s text-ink-500">{t(loadingMessageKey)}</p>
        </div>
      );
    }
    return <AdminListLoadingStatus message={t(loadingMessageKey)} hint={loadingHintKey ? t(loadingHintKey) : undefined} />;
  }

  if (error) {
    const kind = inferErrorKind(error);
    return (
      <div data-tt-ops-plane-error="1" data-tt-ops-plane-error-kind={kind}>
        <OpsPlaneAuthHints errorKey={error} />
        <AdminListFetchError errorKind={kind} message={t(error)} />
        {onRetry ? (
          <button
            type="button"
            className={`mt-3 ${ADMIN_BTN_SECONDARY_CLASS}`}
            data-tt-ops-plane-retry="1"
            onClick={() => void onRetry()}
          >
            {t("ops_plane_retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return <AdminListPageEmptyState messageKey={emptyMessageKey} hintKey={emptyHintKey} />;
  }

  return <>{children}</>;
}
