"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsPlanePermissionBanners } from "@/components/admin/ops/AdminOpsPlanePermissionBanners";
import { OpsPlanePageShell } from "@/components/admin/ops/OpsPlanePageShell";
import {
  ADMIN_ENTERPRISE_CONTENT_STATUS_CONTRAST_CLASS,
  ADMIN_ENTERPRISE_HARDENING_MARKERS,
  adminEnterpriseContentStatusContrastTone,
} from "@/lib/admin/adminEnterpriseHardeningContract";
import { ADMIN_PERM, type AdminPermissionId } from "@/lib/admin/adminPermissionIds";

type Props = {
  titleId: string;
  titleKey: string;
  subtitleKey: string;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessageKey?: string;
  readPermission?: AdminPermissionId;
  writePermission?: AdminPermissionId;
  publishPermission?: AdminPermissionId;
  mainDataAttrs?: Record<string, string>;
  children: React.ReactNode;
};

export function AdminContentPageShell({
  titleId,
  titleKey,
  subtitleKey,
  loading,
  error,
  onRetry,
  empty,
  emptyMessageKey,
  readPermission = ADMIN_PERM.CONTENT_READ,
  writePermission = ADMIN_PERM.CONTENT_WRITE,
  publishPermission = ADMIN_PERM.CONTENT_PUBLISH,
  mainDataAttrs,
  children,
}: Props) {
  const { t } = useTranslation();
  return (
    <OpsPlanePageShell
      titleId={titleId}
      title={t(titleKey)}
      subtitle={t(subtitleKey)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      loadingMessageKey="admin_content_loading"
      empty={empty}
      emptyMessageKey={emptyMessageKey}
      writePermissionId={writePermission}
      mainDataAttrs={mainDataAttrs}
    >
      <AdminOpsPlanePermissionBanners
        read={readPermission}
        write={writePermission}
        publish={publishPermission}
      />
      {children}
    </OpsPlanePageShell>
  );
}

export function AdminContentStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const key = `admin_content_status_${status}` as const;
  const tone = adminEnterpriseContentStatusContrastTone(status);
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded px-2 py-0.5 text-body-xs ${ADMIN_ENTERPRISE_CONTENT_STATUS_CONTRAST_CLASS[tone]}`}
      data-tt-content-status={status}
      {...{ [ADMIN_ENTERPRISE_HARDENING_MARKERS.contentStatusContrast]: tone }}
    >
      {t(key)}
    </span>
  );
}
