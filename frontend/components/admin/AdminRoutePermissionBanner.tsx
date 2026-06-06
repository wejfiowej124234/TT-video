"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { adminPermissionForPathname } from "@/lib/admin/adminRoutePermission";
import { adminPermDeniedMessageKey } from "@/lib/admin/adminPermDeniedMessageKey";

import { ADMIN_ATTENTION_CALLOUT_CLASS, ADMIN_ROUTE_PERM_BANNER_WRAP_CLASS,
  ADMIN_ROUTE_PERM_BANNER_BORDER_CLASS,} from "@/lib/adminUi";

const BANNER_CLASS = `${ADMIN_ROUTE_PERM_BANNER_WRAP_CLASS} ${ADMIN_ATTENTION_CALLOUT_CLASS}`;

/** 子页缺省权限横幅：页内已有 `data-tt-admin-perm-denied` 时不重复。 */
export function AdminRoutePermissionBanner() {
  const pathname = usePathname() ?? "";
  const [hideInlineDuplicate, setHideInlineDuplicate] = useState(true);

  useEffect(() => {
    const tick = () => {
      setHideInlineDuplicate(
        typeof document !== "undefined" &&
          document.querySelector("[data-tt-admin-perm-denied]") !== null,
      );
    };
    tick();
    const id = window.setTimeout(tick, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const permission = adminPermissionForPathname(pathname);
  if (!permission || hideInlineDuplicate) return null;

  return (
    <div
      data-tt-admin-route-perm-banner="1"
      {...{ "data-tt-admin-ui-rbac-advisory": "banner" }}
      className={`${ADMIN_ROUTE_PERM_BANNER_BORDER_CLASS}`}
    >
      <AdminPermissionDeniedBanner
        permission={permission}
        messageKey={adminPermDeniedMessageKey(permission)}
        className={BANNER_CLASS}
      />
    </div>
  );
}
