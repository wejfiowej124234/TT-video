"use client";

import { AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";

import type { AdminSecretsMetadataPageViewModel } from "./useAdminSecretsMetadataPage";

type Props = Pick<AdminSecretsMetadataPageViewModel, "meta">;

export function AdminSecretsMetadataMetaNote({ meta }: Props) {
  if (meta?.policy == null && meta?.note == null) {
    return null;
  }

  return (
    <AdminMetaNoteLink className="mt-4">
      <div className="space-y-1">
        {meta.policy != null ? <p>{String(meta.policy)}</p> : null}
        {meta.note != null ? <p>{String(meta.note)}</p> : null}
      </div>
    </AdminMetaNoteLink>
  );
}
