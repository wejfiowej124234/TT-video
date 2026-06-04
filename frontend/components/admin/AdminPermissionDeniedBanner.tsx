"use client";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { adminPermissionDeniedMessageKey } from "@/lib/admin/adminPermissionDeniedMessageKey";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";

/** ①：无权限时展示诚实横幅（不替代 API 403）。 */
export function AdminPermissionDeniedBanner(props: {
  permission: AdminPermissionId;
  messageKey?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const messageKey = props.messageKey ?? adminPermissionDeniedMessageKey(props.permission);
  if (caps.loading || caps.capabilitiesUnavailable || !caps.permissionsLoaded) return null;
  if (caps.hasPermission(props.permission)) return null;

  return (
    <AdminNoticeBanner
      tone="readonly"
      size="md"
      className={props.className ?? "mt-4"}
      message={t(messageKey)}
      dataAttrs={{ "data-tt-admin-perm-denied": props.permission }}
    />
  );
}
