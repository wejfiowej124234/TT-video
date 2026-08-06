"use client";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import {
  OpsPlaneFetchStates,
  type OpsPlaneChromePresentation,
} from "@/components/admin/ops/OpsPlaneFetchStates";
import type { AdminEmptyNextLink } from "@/lib/admin/adminListEmptyStateNextLinks";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";

export type OpsPlanePageShellProps = {
  titleId: string;
  title: string;
  subtitle: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessageKey?: string;
  empty?: boolean;
  emptyMessageKey?: string;
  emptyHintKey?: string;
  emptyNextLinks?: AdminEmptyNextLink[];
  /** B3-R025 · default banner (children stay). Opt-in `replace` wipes subtree. */
  errorPresentation?: OpsPlaneChromePresentation;
  /** B3-R050 · default banner (children stay). Opt-in `replace` wipes subtree. */
  emptyPresentation?: OpsPlaneChromePresentation;
  writePermissionId?: AdminPermissionId;
  mainDataAttrs?: Record<string, string>;
  children: React.ReactNode;
};

/** CMS · Official OPS · Growth — shared chrome + fetch state machine. */
export function OpsPlanePageShell(props: OpsPlanePageShellProps) {
  const {
    titleId,
    title,
    subtitle,
    loading,
    error,
    onRetry,
    loadingMessageKey,
    empty,
    emptyMessageKey,
    emptyHintKey,
    emptyNextLinks,
    errorPresentation,
    emptyPresentation,
    writePermissionId,
    mainDataAttrs,
    children,
  } = props;

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={title}
      subtitle={subtitle}
      writePermissionId={writePermissionId}
      mainDataAttrs={mainDataAttrs}
    >
      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={onRetry}
        loadingMessageKey={loadingMessageKey}
        empty={empty}
        emptyMessageKey={emptyMessageKey}
        emptyHintKey={emptyHintKey}
        emptyNextLinks={emptyNextLinks}
        errorPresentation={errorPresentation}
        emptyPresentation={emptyPresentation}
      >
        {children}
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
