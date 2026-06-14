"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { adminPageNavLinkClass } from "@/lib/adminUi";

function inferErrorKind(errorKey: string | null | undefined): AdminFetchErrorKind {
  const k = (errorKey ?? "").toLowerCase();
  if (k.includes("2fa") || k.includes("totp")) return "admin_permission_denied";
  if (k.includes("forbidden") || k.includes("perm") || k.includes("denied")) return "forbidden";
  if (k.includes("approval")) return "invalid_request";
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
  else if (lower.includes("forbidden") || lower.includes("perm") || lower.includes("denied"))
    hintKey = "ops_plane_hint_permission";
  else if (lower.includes("approval")) hintKey = "ops_plane_hint_approval";
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
        >
          <div className="h-4 w-2/5 animate-pulse rounded bg-ink-100" />
          <div className="h-24 animate-pulse rounded-lg bg-ink-50" />
          <p className="text-body-s text-ink-500">{t(loadingMessageKey)}</p>
        </div>
      );
    }
    return <AdminListLoadingStatus message={t(loadingMessageKey)} hint={loadingHintKey ? t(loadingHintKey) : undefined} />;
  }

  if (error) {
    return (
      <div data-tt-ops-plane-error="1">
        <OpsPlaneAuthHints errorKey={error} />
        <AdminListFetchError errorKind={inferErrorKind(error)} message={t(error)} />
        {onRetry ? (
          <button
            type="button"
            className={`mt-3 ${adminPageNavLinkClass()}`}
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
