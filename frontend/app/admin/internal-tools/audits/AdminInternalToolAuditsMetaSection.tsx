"use client";

import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type AdminInternalToolAuditsMetaSectionProps = {
  meta: Record<string, unknown> | null;
  loading: boolean;
  error: AdminFetchErrorKind | null;
};

export function AdminInternalToolAuditsMetaSection({ meta, loading, error }: AdminInternalToolAuditsMetaSectionProps) {
  return (
    <>
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      {meta?.note ? <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink> : null}
    </>
  );
}
