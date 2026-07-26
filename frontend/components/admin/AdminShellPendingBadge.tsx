"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  adminShellPendingBadgeVisible,
  type AdminShellPendingBadgePlacement,
} from "@/lib/admin/adminShellPendingBadgePolicy";
import {
  ADMIN_PENDING_COUNT_BADGE_CLASS,
  ADMIN_PENDING_COUNT_BADGE_SECONDARY_CLASS,
} from "@/lib/adminUi";

export type AdminShellPendingBadgeLegacyMarker = "nav" | "sidebar" | "hub";

export function AdminShellPendingBadge(props: {
  count: number;
  label: string;
  placement: AdminShellPendingBadgePlacement;
  sidebarLayoutActive: boolean;
  inboxKey: string;
  legacyMarker?: AdminShellPendingBadgeLegacyMarker;
  suppressTopInboxHubOnWorkspace?: boolean;
  suppressSidebarLeafOnWorkspaceInboxFocus?: boolean;
}) {
  const { t } = useTranslation();
  const {
    count,
    label,
    placement,
    sidebarLayoutActive,
    inboxKey,
    legacyMarker,
    suppressTopInboxHubOnWorkspace,
    suppressSidebarLeafOnWorkspaceInboxFocus,
  } = props;

  if (
    !adminShellPendingBadgeVisible({
      placement,
      sidebarLayoutActive,
      count,
      suppressTopInboxHubOnWorkspace,
      suppressSidebarLeafOnWorkspaceInboxFocus,
    })
  ) {
    return null;
  }

  const legacyAttrs =
    legacyMarker === "nav"
      ? { "data-tt-admin-shell-nav-pending": inboxKey }
      : legacyMarker === "sidebar"
        ? { "data-tt-admin-shell-sidebar-pending": inboxKey }
        : legacyMarker === "hub"
          ? { "data-tt-admin-shell-inbox-hub-pending": inboxKey }
          : {};

  const ariaKey =
    legacyMarker === "sidebar"
      ? "admin_shell_sidebar_pending_aria"
      : legacyMarker === "hub"
        ? "admin_shell_inbox_hub_pending_aria"
        : "admin_shell_nav_pending_aria";

  const ariaLabel =
    legacyMarker === "hub"
      ? t(ariaKey, { count })
      : t(ariaKey, { label, count });

  const badgeClass =
    placement === "top_inbox_hub"
      ? ADMIN_PENDING_COUNT_BADGE_SECONDARY_CLASS
      : ADMIN_PENDING_COUNT_BADGE_CLASS;

  return (
    <span
      className={badgeClass}
      data-tt-admin-shell-pending-badge="1"
      data-tt-admin-shell-pending-placement={placement}
      data-tt-admin-shell-pending-weight={placement === "top_inbox_hub" ? "secondary" : "primary"}
      {...legacyAttrs}
      aria-label={ariaLabel}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
