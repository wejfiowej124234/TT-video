"use client";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
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
      >
        {children}
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
