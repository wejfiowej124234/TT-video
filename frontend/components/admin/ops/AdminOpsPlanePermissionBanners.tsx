"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";

type Props = {
  read?: AdminPermissionId;
  write?: AdminPermissionId;
  publish?: AdminPermissionId;
  fraud?: AdminPermissionId;
};

/** CMS · Official · Growth — 写/发布权限诚实横幅（UI 顾问 · API 仍为真边界）。 */
export function AdminOpsPlanePermissionBanners({ read, write, publish, fraud }: Props) {
  return (
    <div className="space-y-2" data-tt-admin-ops-plane-perm-banners="1">
      {read ? <AdminPermissionDeniedBanner permission={read} /> : null}
      {write ? <AdminPermissionDeniedBanner permission={write} /> : null}
      {publish ? <AdminPermissionDeniedBanner permission={publish} /> : null}
      {fraud ? <AdminPermissionDeniedBanner permission={fraud} /> : null}
    </div>
  );
}
