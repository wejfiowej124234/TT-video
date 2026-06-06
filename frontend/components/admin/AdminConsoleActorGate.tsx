"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_CONSOLE_ACTOR_GATE_MARKER,
  ADMIN_UI_RBAC_ADVISORY_MARKER,
} from "@/lib/admin/adminUiRbacAdvisory";
import { isAdminConsoleAccessDeniedErrorCode } from "@/lib/admin/adminConsoleAccessCookie";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { ADMIN_BTN_GHOST_DARK_CLASS, ADMIN_DARK_GLASS_PANEL_CLASS, TT_ADMIN_ZONE_ROOT } from "@/lib/adminUi";

/** ① · ADM-P0-01/03：非 admin 登录用户 · capabilities 403 全屏拒入（API 真闸 SSOT）。 */
export function AdminConsoleActorGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();

  const denied =
    !caps.loading &&
    caps.error &&
    (caps.errorCode === "login_required" ||
      isAdminConsoleAccessDeniedErrorCode(caps.errorCode));

  if (!denied) return <>{children}</>;

  const loginRequired = caps.errorCode === "login_required";

  return (
    <div
      className={`${TT_ADMIN_ZONE_ROOT} flex min-h-screen flex-col items-center justify-center px-4 py-16`}
      {...{ [ADMIN_CONSOLE_ACTOR_GATE_MARKER]: "1" }}
      {...{ [ADMIN_UI_RBAC_ADVISORY_MARKER]: "hard-gate" }}
    >
      <div className={`${ADMIN_DARK_GLASS_PANEL_CLASS} max-w-lg space-y-4 p-8 text-center`}>
        <h1 className="text-h2 font-semibold text-slate-100">
          {loginRequired ? t("admin_console_gate_login_title") : t("admin_console_gate_forbidden_title")}
        </h1>
        <p className="text-body text-slate-300">
          {loginRequired ? t("admin_console_gate_login_body") : t("admin_console_gate_forbidden_body")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {loginRequired ? (
            <Link href="/auth/login?returnUrl=%2Fadmin" className={ADMIN_BTN_GHOST_DARK_CLASS}>
              {t("admin_console_gate_login_cta")}
            </Link>
          ) : (
            <Link href="/market" className={ADMIN_BTN_GHOST_DARK_CLASS}>
              {t("admin_console_gate_forbidden_cta")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
