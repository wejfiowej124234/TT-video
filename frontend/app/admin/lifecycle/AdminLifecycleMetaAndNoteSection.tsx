"use client";

import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type AdminLifecycleMetaAndNoteSectionProps = {
  meta: Record<string, unknown> | null;
  loading: boolean;
  error: AdminFetchErrorKind | null;
};

export function AdminLifecycleMetaAndNoteSection({ meta, loading, error }: AdminLifecycleMetaAndNoteSectionProps) {
  return (
    <>
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}
    </>
  );
}
