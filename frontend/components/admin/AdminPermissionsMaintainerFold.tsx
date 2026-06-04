"use client";

import type { ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type Props = {
  children: ReactNode;
};

/** ②/③ 预备与 backlog 表：运营默认折叠，维护者直出。 */
export function AdminPermissionsMaintainerFold({ children }: Props) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const maintainer = isAdminMaintainerUi(caps.role);

  if (maintainer) {
    return (
      <div data-tt-admin-permissions-maintainer-fold="open">{children}</div>
    );
  }

  return (
    <details
      className="mt-6 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/40 p-3"
      data-tt-admin-permissions-maintainer-fold="collapsed"
    >
      <summary
        className={`cursor-pointer list-none text-small font-medium text-ink-800 [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
      >
        {t("admin_permissions_maintainer_fold_summary")}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
