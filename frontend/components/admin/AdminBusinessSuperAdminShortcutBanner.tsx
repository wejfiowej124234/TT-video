"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** C2 Business account · SuperAdmin seed shortcut — not ADM-U01 matrix GO. */
export function AdminBusinessSuperAdminShortcutBanner() {
  const { t } = useTranslation();
  const actor = useAdminShellActor();

  if (actor.loading || !actor.isBusinessSuperAdminShortcut) return null;

  return (
    <div
      className="border-b border-amber-500/30 bg-amber-950/20"
      data-tt-admin-business-superadmin-shortcut="1"
      data-tt-admin-business-account-id="C2"
    >
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
        <AdminNoticeBanner
          tone="warning"
          size="lg"
          message={
            <span className="block space-y-1">
              <span className="block font-semibold">{t("admin_business_superadmin_shortcut_title")}</span>
              <span className="block">{t("admin_business_superadmin_shortcut_body")}</span>
              <Link
                href="/admin/operator-guide#admin-operator-guide-role-prep"
                className={`${adminPageNavLinkClass()} mt-1 inline-block`}
              >
                {t("admin_business_superadmin_shortcut_guide_link")}
              </Link>
            </span>
          }
          dataAttrs={{ "data-tt-admin-business-superadmin-shortcut-banner": "1" }}
        />
      </div>
    </div>
  );
}
