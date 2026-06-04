"use client";

import { AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type Props = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  meta: Record<string, unknown> | null;
};

export function AdminMediaSignedUrlTokensMetaNote({ loading, error, meta }: Props) {
  if (loading || error || !meta?.note) return null;
  return <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>;
}
