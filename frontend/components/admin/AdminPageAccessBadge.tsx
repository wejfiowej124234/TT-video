"use client";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { ADMIN_PAGE_ACCESS_READONLY_BADGE_CLASS, ADMIN_PAGE_ACCESS_WRITABLE_BADGE_CLASS } from "@/lib/adminUi";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

/** 子页顶栏：只读 / 可写（VIS-03）。 */
export function AdminPageAccessBadge(props: { writePermissionId?: AdminPermissionId }) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const writePerm = props.writePermissionId;
  // Batch-13 FO10 · 无写权限位（只读页）→ 只读徽章；禁「未声明=可写」假徽章
  const canWrite = Boolean(
    writePerm && caps.permissionsLoaded && caps.hasPermission(writePerm),
  );

  if (!caps.permissionsLoaded) return null;

  const label = canWrite ? t("admin_access_badge_write") : t("admin_access_badge_readonly");
  const tone = canWrite ? ADMIN_PAGE_ACCESS_WRITABLE_BADGE_CLASS : ADMIN_PAGE_ACCESS_READONLY_BADGE_CLASS;

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-meta font-medium ${tone}`}
      data-tt-admin-access-badge={canWrite ? "write" : "readonly"}
    >
      {label}
    </span>
  );
}
