"use client";

import { AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type Props = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  note: string | null;
};

export function AdminApprovalsMetaNote({ loading, error, note }: Props) {
  if (loading || error || !note) return null;
  return <AdminMetaNoteLink className="mt-3">{note}</AdminMetaNoteLink>;
}
