"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { useAdminApprovePermissionHint } from "@/lib/admin/adminApprovePermissionHint";
import {
  ADMIN_ATTENTION_STRIP_CLASS,
  ADMIN_ATTENTION_STRIP_TEXT_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  adminErrorSecondaryBtnClass,
  TT_ADMIN_LAYOUT_GUTTER,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 无 admin.approve 时顶栏下唯一琥珀条（可关闭 · 与首页待办区互斥）。 */
export function AdminShellApproveBanner() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const { showShellBanner, dismiss } = useAdminApprovePermissionHint();

  if (!pathname.startsWith("/admin")) return null;
  if (!showShellBanner) return null;

  return (
    <div
      className={ADMIN_ATTENTION_STRIP_CLASS}
      role="status"
      data-tt-admin-shell-approve-banner="1"
      data-tt-admin-approve-hint-unified="1"
    >
      <div
        className={`${TT_ADMIN_LAYOUT_GUTTER} flex flex-wrap items-center justify-between gap-2 py-2 ${ADMIN_ATTENTION_STRIP_TEXT_CLASS}`}
      >
        <p className="min-w-0 flex-1">{t("admin_shell_approve_banner_lead")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/permissions#admin-shell-preview"
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] px-3 text-small font-semibold ${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
          >
            {t("admin_shell_approve_banner_cta")}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] px-3 text-small font-medium ${adminErrorSecondaryBtnClass} ${travelFocusRingOffset2Classes}`}
            data-tt-admin-approve-banner-dismiss="1"
          >
            {t("admin_shell_approve_banner_dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
