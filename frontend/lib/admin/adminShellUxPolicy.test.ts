import { describe, expect, it } from "vitest";

import {
  adminHomeInboxFocusLayoutActive,
  adminHomeKpiFoldDefaultOpen,
  adminHomeSystemOverviewDefaultOpen,
  adminShellCommandPaletteTriggerVisible,
  adminShellNavGroupDefaultOpen,
  adminShellPreviewBadgeVisible,
  adminShellRolePerspectiveSwitcherVisible,
  adminHomeMaintainerFoldVisible,
} from "./adminShellUxPolicy";
import { writeAdminHomeInboxPendingTotalCache } from "./adminHomeInboxPendingTotalCache";

describe("adminShellUxPolicy", () => {
  it("defers focus layout while inbox loading (no flash to four-card grid)", () => {
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
    ).toBe(false);
    writeAdminHomeInboxPendingTotalCache(78);
    expect(
      adminHomeInboxFocusLayoutActive({
        pendingTotal: null,
        inboxLoading: true,
        permissionsLoaded: true,
        inboxError: false,
      }),
    ).toBe(true);
  });

  it("collapses system overview in idle grid when pending; focus layout uses static section", () => {
    expect(adminHomeSystemOverviewDefaultOpen(0)).toBe(true);
    expect(adminHomeSystemOverviewDefaultOpen(78)).toBe(false);
    expect(adminHomeSystemOverviewDefaultOpen(null)).toBe(false);
  });

  it("hides role perspective and command palette on workspace when pending (non-maintainer)", () => {
    const input = { maintainerUi: false, onWorkspace: true, pendingTotal: 78 };
    expect(adminShellRolePerspectiveSwitcherVisible(input)).toBe(false);
    expect(adminShellCommandPaletteTriggerVisible(input)).toBe(false);
    expect(adminShellPreviewBadgeVisible(input)).toBe(false);
  });

  it("keeps maintainer controls on workspace with pending", () => {
    const input = { maintainerUi: true, onWorkspace: true, pendingTotal: 78 };
    expect(adminShellRolePerspectiveSwitcherVisible(input)).toBe(true);
    expect(adminShellCommandPaletteTriggerVisible(input)).toBe(true);
    expect(adminShellPreviewBadgeVisible(input)).toBe(true);
  });

  it("hides maintainer fold for non-maintainers during inbox focus", () => {
    expect(adminHomeMaintainerFoldVisible({ maintainerUi: false, focusInbox: true })).toBe(false);
    expect(adminHomeMaintainerFoldVisible({ maintainerUi: true, focusInbox: true })).toBe(true);
    expect(adminHomeMaintainerFoldVisible({ maintainerUi: false, focusInbox: false })).toBe(true);
  });

  it("collapses finance/governance/more nav groups by default", () => {
    expect(adminShellNavGroupDefaultOpen("finance", { groupActive: false, pendingRollup: 0 })).toBe(
      false,
    );
    expect(
      adminShellNavGroupDefaultOpen("finance", {
        groupActive: false,
        pendingRollup: 0,
        shellFilterRole: "Finance",
      }),
    ).toBe(true);
    expect(adminShellNavGroupDefaultOpen("governance", { groupActive: false, pendingRollup: 0 })).toBe(
      false,
    );
    expect(adminShellNavGroupDefaultOpen("more", { groupActive: false, pendingRollup: 0 })).toBe(
      false,
    );
    expect(adminShellNavGroupDefaultOpen("onboarding", { groupActive: false, pendingRollup: 0 })).toBe(
      true,
    );
    expect(adminShellNavGroupDefaultOpen("more", { groupActive: true, pendingRollup: 0 })).toBe(true);
    expect(adminShellNavGroupDefaultOpen("community", { groupActive: false, pendingRollup: 3 })).toBe(
      true,
    );
  });

  it("opens KPI fold when idle; when inbox focused only disputes open KPI", () => {
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: 0, disputesKpi: 0, ordersKpi: 0 }),
    ).toBe(true);
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: 78, disputesKpi: 0, ordersKpi: 162 }),
    ).toBe(false);
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: 78, disputesKpi: 2, ordersKpi: 162 }),
    ).toBe(true);
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: null, disputesKpi: 0, ordersKpi: 0 }),
    ).toBe(false);
    expect(
      adminHomeKpiFoldDefaultOpen({ pendingTotal: null, disputesKpi: 0, ordersKpi: 162 }),
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
