"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { isSuperAdminActorRole } from "@/lib/admin/adminActorFromMe";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { ADMIN_SUPER_HINT_BANNER_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 非 super_admin 但需 super 权限时的明示引导（IA-04）。 */
export function AdminSuperAdminHintBanner(props: {
  permission: typeof ADMIN_PERM.APPROVE;
  messageKey: string;
  permissionsHref?: string;
}) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const needsSuper =
    caps.permissionsLoaded &&
    caps.hasPermission(props.permission) === false &&
    caps.role === "admin";
  const isAdminNotSuper =
    caps.permissionsLoaded && caps.role === "admin" && !isSuperAdminActorRole(caps.role);

  if (!isAdminNotSuper && !needsSuper) return null;

  return (
    <p
      className={ADMIN_SUPER_HINT_BANNER_CLASS}
      role="status"
      data-tt-admin-super-hint="1"
    >
      {t(props.messageKey)}{" "}
      <Link
        href={props.permissionsHref ?? "/admin/permissions"}
        className={adminPageNavLinkClass()}
      >
        {t("admin_super_hint_permissions_link")}
      </Link>
    </p>
  );
}
