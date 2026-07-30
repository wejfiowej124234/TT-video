import { describe, expect, it } from "vitest";

import {
  adminHomeInboxFocusLayoutActive,
  adminHomeKpiFoldDefaultOpen,
  adminHomeSystemOverviewDefaultOpen,
  adminShellCommandPaletteTriggerVisible,
  adminShellDeployEnvBadgeQuiet,
  adminShellNavGroupDefaultOpen,
  adminShellPreviewBadgeVisible,
  adminShellRolePerspectiveSwitcherVisible,
  adminHomeMaintainerFoldVisible,
  adminShellWorkspaceOpsChromeDemoted,
  TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK,
} from "./adminShellUxPolicy";
import { writeAdminHomeInboxPendingTotalCache } from "./adminHomeInboxPendingTotalCache";

describe("adminShellUxPolicy", () => {
  it("Product Baseline · Inbox Focus always-on (no pending/loading flash)", () => {
    expect(
      adminHomeInboxFocusLayoutActive({
        pendingTotal: null,
        inboxLoading: true,
        permissionsLoaded: true,
        inboxError: false,
      }),
    ).toBe(true);
    writeAdminHomeInboxPendingTotalCache(0);
    expect(
      adminHomeInboxFocusLayoutActive({
        pendingTotal: null,
        inboxLoading: true,
        permissionsLoaded: true,
        inboxError: false,
      }),
    ).toBe(true);
    writeAdminHomeInboxPendingTotalCache(78);
    expect(
      adminHomeInboxFocusLayoutActive({
        pendingTotal: 0,
        inboxLoading: false,
        permissionsLoaded: true,
        inboxError: false,
      }),
    ).toBe(true);
  });

  it("Product Baseline · system overview auxiliary (always collapsed default)", () => {
    expect(adminHomeSystemOverviewDefaultOpen(0)).toBe(false);
    expect(adminHomeSystemOverviewDefaultOpen(null)).toBe(false);
    expect(adminHomeSystemOverviewDefaultOpen(78)).toBe(false);
  });

  it("hides role perspective and command palette on workspace when pending (non-maintainer)", () => {
    const input = { maintainerUi: false, onWorkspace: true, pendingTotal: 78 };
    expect(adminShellRolePerspectiveSwitcherVisible(input)).toBe(false);
    expect(adminShellCommandPaletteTriggerVisible(input)).toBe(false);
    expect(adminShellPreviewBadgeVisible(input)).toBe(false);
  });

  it("Product Baseline · preview badge demoted on workspace for non-maintainer (any pending)", () => {
    expect(
      adminShellPreviewBadgeVisible({
        maintainerUi: false,
        onWorkspace: true,
        pendingTotal: 0,
      }),
    ).toBe(false);
    expect(
      adminShellPreviewBadgeVisible({
        maintainerUi: false,
        onWorkspace: true,
        pendingTotal: null,
      }),
    ).toBe(false);
  });

  it("HU-437 · hides command palette chip on workspace for all roles (⌘K remains)", () => {
    expect(
      adminShellCommandPaletteTriggerVisible({
        maintainerUi: true,
        onWorkspace: true,
        pendingTotal: 0,
      }),
    ).toBe(false);
    expect(
      adminShellCommandPaletteTriggerVisible({
        maintainerUi: false,
        onWorkspace: true,
        pendingTotal: null,
      }),
    ).toBe(false);
    expect(
      adminShellCommandPaletteTriggerVisible({
        maintainerUi: true,
        onWorkspace: false,
        pendingTotal: 0,
      }),
    ).toBe(true);
  });

  it("HU-437 · deploy env quiet + ops chrome demoted only on workspace", () => {
    expect(adminShellDeployEnvBadgeQuiet({ onWorkspace: true })).toBe(true);
    expect(adminShellDeployEnvBadgeQuiet({ onWorkspace: false })).toBe(false);
    expect(adminShellWorkspaceOpsChromeDemoted(true)).toBe(true);
    expect(adminShellWorkspaceOpsChromeDemoted(false)).toBe(false);
    expect(TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK).toBe(
      "tt_admin_shell_workspace_ops_demoted_hu437",
    );
  });

  it("keeps maintainer role switcher on workspace with pending (search chip demoted HU-437)", () => {
    const input = { maintainerUi: true, onWorkspace: true, pendingTotal: 78 };
    expect(adminShellRolePerspectiveSwitcherVisible(input)).toBe(true);
    expect(adminShellCommandPaletteTriggerVisible(input)).toBe(false);
    expect(adminShellPreviewBadgeVisible(input)).toBe(true);
  });

  it("WP-03: maintainer fold only when maintainerUi (both layouts)", () => {
    expect(adminHomeMaintainerFoldVisible({ maintainerUi: false, focusInbox: true })).toBe(false);
    expect(adminHomeMaintainerFoldVisible({ maintainerUi: true, focusInbox: true })).toBe(true);
    expect(adminHomeMaintainerFoldVisible({ maintainerUi: false, focusInbox: false })).toBe(false);
    expect(adminHomeMaintainerFoldVisible({ maintainerUi: true, focusInbox: false })).toBe(true);
  });

  it("HU-474 · collapsed-default set empty; more stays open for Finance filter (was HU-224)", () => {
    // Batch-12 HU-474 removed dead finance/governance group ids from collapse set
    expect(adminShellNavGroupDefaultOpen("finance", { groupActive: false, pendingRollup: 0 })).toBe(
      true,
    );
    expect(
      adminShellNavGroupDefaultOpen("more", {
        groupActive: false,
        pendingRollup: 0,
        shellFilterRole: "Finance",
      }),
    ).toBe(true);
    expect(adminShellNavGroupDefaultOpen("governance", { groupActive: false, pendingRollup: 0 })).toBe(
      true,
    );
    expect(adminShellNavGroupDefaultOpen("more", { groupActive: false, pendingRollup: 0 })).toBe(
      true,
    );
    expect(adminShellNavGroupDefaultOpen("onboarding", { groupActive: false, pendingRollup: 0 })).toBe(
      true,
    );
    expect(adminShellNavGroupDefaultOpen("more", { groupActive: true, pendingRollup: 0 })).toBe(true);
    expect(adminShellNavGroupDefaultOpen("community", { groupActive: false, pendingRollup: 3 })).toBe(
      true,
    );
  });

  it("HU-441 · ops detail fold defaults collapsed; opens only when disputes>0", () => {
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: 0, disputesKpi: 0, ordersKpi: 0 }),
    ).toBe(false);
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: 78, disputesKpi: 0, ordersKpi: 162 }),
    ).toBe(false);
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: 78, disputesKpi: 2, ordersKpi: 162 }),
    ).toBe(true);
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: null, disputesKpi: 0, ordersKpi: 0 }),
    ).toBe(false);
  });

  it("hides preview badges on subpages when shell preview active (capability strip SSOT)", () => {
    expect(
      adminShellPreviewBadgeVisible({
        maintainerUi: true,
        onWorkspace: false,
        pendingTotal: null,
        shellPreviewActive: true,
      }),
    ).toBe(false);
  });
});
