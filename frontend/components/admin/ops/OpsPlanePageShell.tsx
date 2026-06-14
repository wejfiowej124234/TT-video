"use client";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";

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
    children,
  } = props;

  return (
    <AdminDetailPageChrome titleId={titleId} title={title} subtitle={subtitle}>
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
