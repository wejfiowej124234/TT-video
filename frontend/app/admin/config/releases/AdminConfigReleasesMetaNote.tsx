"use client";

import { AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";

type Props = { meta: Record<string, unknown> | null };

export function AdminConfigReleasesMetaNote({ meta }: Props) {
  if (!meta?.note) return null;
  return <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>;
}
