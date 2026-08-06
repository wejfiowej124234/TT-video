"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { OpsPlaneAuthHints } from "@/components/admin/ops/OpsPlaneAuthHints";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {
  ADMIN_EMPTY_NEXT_WORKSPACE,
  type AdminEmptyNextLink,
} from "@/lib/admin/adminListEmptyStateNextLinks";
import {
  ADMIN_BTN_SECONDARY_CLASS,
  ADMIN_CONSOLE_SKELETON_BLOCK_CLASS,
  ADMIN_CONSOLE_SKELETON_LINE_CLASS,
  ADMIN_MOTION_SKELETON_CLASS,
} from "@/lib/adminUi";

export { OpsPlaneAuthHints } from "@/components/admin/ops/OpsPlaneAuthHints";

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

/**
 * B3-R025 / B3-R050 · chrome presentation
 * - `banner` (default): chrome above still-mounted children (no wipe)
 * - `replace`: early-return wipe of children (opt-in only)
 */
export type OpsPlaneChromePresentation = "banner" | "replace";

export type OpsPlaneFetchStatesProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessageKey?: string;
  loadingHintKey?: string;
  empty?: boolean;
  emptyMessageKey?: string;
  emptyHintKey?: string;
  /** B3-R050 · empty next-step links; default workspace hub. */
  emptyNextLinks?: AdminEmptyNextLink[];
  /**
   * B3-R025 · error chrome. Default `banner` keeps children mounted.
   * Pass `replace` only when the leaf must wipe the subtree on error.
   */
  errorPresentation?: OpsPlaneChromePresentation;
  /**
   * B3-R050 · empty chrome. Default `banner` keeps children (e.g. create forms).
   * Pass `replace` only when empty must wipe the subtree.
   */
  emptyPresentation?: OpsPlaneChromePresentation;
  skeleton?: boolean;
  children?: React.ReactNode;
};

function OpsPlaneErrorChrome(props: {
  error: string;
  kind: AdminFetchErrorKind;
  onRetry?: () => void;
  presentation: OpsPlaneChromePresentation;
  staleWhileError: boolean;
}) {
  const { t } = useTranslation();
  const { error, kind, onRetry, presentation, staleWhileError } = props;
  return (
    <div
      data-tt-ops-plane-error="1"
      data-tt-ops-plane-error-kind={kind}
      data-tt-ops-plane-error-presentation={presentation}
    >
      <OpsPlaneAuthHints errorKey={error} />
      <AdminListFetchError
        errorKind={kind}
        message={t(error)}
        staleWhileError={staleWhileError}
        showAuthHints={false}
      />
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

function OpsPlaneEmptyChrome(props: {
  messageKey: string;
  hintKey?: string;
  nextLinks: AdminEmptyNextLink[];
  presentation: OpsPlaneChromePresentation;
}) {
  const { messageKey, hintKey, nextLinks, presentation } = props;
  return (
    <div data-tt-ops-plane-empty="1" data-tt-ops-plane-empty-presentation={presentation}>
      <AdminListPageEmptyState messageKey={messageKey} hintKey={hintKey} nextLinks={nextLinks} />
    </div>
  );
}

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
    emptyNextLinks = [ADMIN_EMPTY_NEXT_WORKSPACE],
    errorPresentation = "banner",
    emptyPresentation = "banner",
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
    return (
      <AdminListLoadingStatus
        message={t(loadingMessageKey)}
        hint={loadingHintKey ? t(loadingHintKey) : undefined}
      />
    );
  }

  if (error) {
    const kind = inferErrorKind(error);
    const chrome = (
      <OpsPlaneErrorChrome
        error={error}
        kind={kind}
        onRetry={onRetry}
        presentation={errorPresentation}
        staleWhileError={errorPresentation === "banner"}
      />
    );
    if (errorPresentation === "replace") {
      return chrome;
    }
    return (
      <>
        {chrome}
        {children}
      </>
    );
  }

  if (empty) {
    const chrome = (
      <OpsPlaneEmptyChrome
        messageKey={emptyMessageKey}
        hintKey={emptyHintKey}
        nextLinks={emptyNextLinks}
        presentation={emptyPresentation}
      />
    );
    if (emptyPresentation === "replace") {
      return chrome;
    }
    return (
      <>
        {chrome}
        {children}
      </>
    );
  }

  return <>{children}</>;
}
