"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { shouldShowAdminCapabilityStrip } from "@/lib/admin/adminCapabilityStripVisibility";
import { useAdminApprovePermissionHint } from "@/lib/admin/adminApprovePermissionHint";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { CONSOLE_ROLE_70_LABEL_KEYS } from "@/lib/admin/adminRole70Matrix";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { useAdminHomeInboxFocusMode } from "@/lib/admin/useAdminHomeInboxFocusMode";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";
import { ADMIN_CAPABILITY_STRIP_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** ① 发布级：能力条读取 `GET /api/v1/admin/capabilities` 真值；健康审批人默认隐藏。 */
export function AdminActorCapabilityStrip() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const caps = useAdminCapabilities();
  const actor = useAdminShellActor();
  const { previewRole, dbRole } = useAdminEffectiveShellRole();
  const { showShellBanner } = useAdminApprovePermissionHint();
  const homeInboxFocus = useAdminHomeInboxFocusMode();
  const onWorkspace = pathname === "/admin";
  const homeShellPreviewBannerActive = Boolean(previewRole) && onWorkspace && !homeInboxFocus;

  const canApprove = caps.permissionsLoaded && caps.hasPermission(ADMIN_PERM.APPROVE);
  const maintainerUi = isAdminMaintainerUi(actor.role);
  const visible = shouldShowAdminCapabilityStrip({
    permissionsLoaded: caps.permissionsLoaded,
    capabilitiesUnavailable: caps.capabilitiesUnavailable,
    loading: caps.loading,
    canApprove,
    maintainerUi,
    shellPreviewActive: Boolean(previewRole),
    homeShellPreviewBannerActive,
    homeInboxFocus,
    onWorkspace,
  });

  if (!visible) {
    return (
      <div
        className="sr-only"
        data-tt-admin-capability-strip="1"
        data-tt-admin-capability-strip-suppressed="1"
        data-tt-admin-capabilities-loaded={caps.permissionsLoaded ? "1" : undefined}
        aria-hidden
      />
    );
  }

  const accountRoleLabel = actor.roleLabelKey
    ? t(actor.roleLabelKey)
    : caps.role === "super_admin"
      ? t("admin_shell_role_super_admin")
      : caps.role === "admin"
        ? t("admin_shell_role_admin")
        : t("admin_capability_strip_actor_unknown");

  const effectiveConsoleLabel = dbRole
    ? t(CONSOLE_ROLE_70_LABEL_KEYS[dbRole])
    : caps.consoleRole70
      ? t(CONSOLE_ROLE_70_LABEL_KEYS[caps.consoleRole70])
      : accountRoleLabel;

  const statusLine = caps.loading
    ? t("admin_capability_strip_loading")
    : caps.errorCode === "http_401" || caps.errorCode === "unauthorized"
      ? t("admin_capability_strip_session_expired")
      : caps.errorCode === "login_required"
        ? t("admin_capability_strip_login_required")
      : caps.errorCode === "admin_capabilities_route_missing"
        ? t("admin_capability_strip_api_missing")
        : caps.error
          ? t("admin_capability_strip_load_failed")
          : previewRole
            ? t("admin_capability_strip_summary_preview", {
                preview: t(CONSOLE_ROLE_70_LABEL_KEYS[previewRole]),
                account: accountRoleLabel,
              })
            : caps.consoleRole70
              ? t("admin_capability_strip_summary_role", {
                  role: t(CONSOLE_ROLE_70_LABEL_KEYS[caps.consoleRole70]),
                })
              : t("admin_capability_strip_summary_role", { role: effectiveConsoleLabel });

  const summarySuffix =
    caps.permissionsLoaded && !caps.capabilitiesUnavailable && !showShellBanner
      ? canApprove
        ? t("admin_capability_strip_can_approve")
        : t("admin_capability_strip_no_approve_short")
      : null;

  return (
    <details
      className={ADMIN_CAPABILITY_STRIP_CLASS}
      data-tt-admin-capability-strip="1"
      data-tt-admin-capability-strip-collapsible="1"
      data-tt-admin-capability-strip-preview={previewRole ?? undefined}
      data-tt-admin-capabilities-loaded={caps.permissionsLoaded ? "1" : undefined}
      data-tt-admin-capability-error={caps.capabilitiesUnavailable ? caps.errorCode ?? "1" : undefined}
    >
      <summary className="mx-auto flex max-w-6xl cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-meta text-ink-600 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-ink-700">
          {statusLine}
          {summarySuffix ? (
            <span className="font-normal text-ink-600"> · {summarySuffix}</span>
          ) : null}
        </span>
        <span className="ml-auto text-ink-600 underline decoration-dotted underline-offset-2 group-open:hidden">
          {t("admin_capability_strip_expand")}
        </span>
        <span className="ml-auto hidden text-ink-500 group-open:inline">
          {t("admin_capability_strip_collapse")}
        </span>
      </summary>

      <div
        className="mx-auto max-w-6xl space-y-1 px-4 pb-2 text-meta text-ink-600 sm:px-6"
        role="status"
      >
        <p className="text-ink-500" data-tt-admin-email-session-hint="1">
          {t("admin_capability_strip_email_session_hint")}
        </p>
        {previewRole ? (
          <p className="text-ink-600" data-tt-admin-capability-strip-preview-note="1">
            {t("admin_capability_strip_preview_caps_note")}
          </p>
        ) : null}
        {caps.permissionsLoaded && !caps.capabilitiesUnavailable ? (
          <p className="text-ink-500" data-tt-admin-permission-model-hint="1">
            {t("admin_capability_strip_permission_model_hint")}
          </p>
        ) : null}
        {caps.matrixVersion && caps.permissionsLoaded ? (
          <p className="font-mono text-ink-400" title={caps.matrixVersion}>
            {t("admin_capability_strip_matrix_details")}: {caps.matrixVersion}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          {caps.capabilitiesUnavailable ? (
            caps.errorCode === "login_required" ||
            caps.errorCode === "http_401" ||
            caps.errorCode === "unauthorized" ? (
              <Link
                href={`/auth/login?returnUrl=${encodeURIComponent(pathname || "/admin")}`}
                className={adminPageNavLinkClass()}
              >
                {t("admin_capability_strip_login_link")}
              </Link>
            ) : (
              <button type="button" onClick={() => caps.reload()} className={adminPageNavLinkClass()}>
                {t("admin_capability_strip_retry")}
              </button>
            )
          ) : null}
          <Link
            href="/admin/permissions"
            className={adminPageNavLinkClass()}
            data-tt-admin-capability-strip-permissions-link="1"
          >
            {t("admin_permissions_link")}
          </Link>
        </div>
      </div>
    </details>
  );
}
