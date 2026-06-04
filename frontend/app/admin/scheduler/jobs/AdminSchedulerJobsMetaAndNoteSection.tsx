"use client";

import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type AdminSchedulerJobsMetaAndNoteSectionProps = {
  meta: Record<string, unknown> | null;
  loading: boolean;
  error: AdminFetchErrorKind | null;
};

export function AdminSchedulerJobsMetaAndNoteSection({
  meta,
  loading,
  error,
}: AdminSchedulerJobsMetaAndNoteSectionProps) {
  return (
    <>
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}
    </>
  );
}
