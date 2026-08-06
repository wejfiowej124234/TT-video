import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import {
  adminShellNavGroupPendingRollup,
  adminShellNavGroupSummaryAttentionDotVisible,
  adminShellNavGroupSummaryBadgeVisible,
  adminShellPendingBadgeVisible,
} from "./adminShellPendingBadgePolicy";

describe("adminShellPendingBadgePolicy", () => {
  const counts = { provider: 2, guide: 0, steward: 0, approvals: 1, disputes: 0, reports: 78 };
  const channels = {
    provider: { permissionDenied: false },
    guide: { permissionDenied: false },
    steward: { permissionDenied: false },
    approvals: { permissionDenied: false },
    disputes: { permissionDenied: false },
    reports: { permissionDenied: false },
  } as const;

  it("top inbox hub shows numeric badge unless suppressed on workspace focus", () => {
    expect(
      adminShellPendingBadgeVisible({
        placement: "top_inbox_hub",
        sidebarLayoutActive: true,
        count: 81,
      }),
    ).toBe(true);
    expect(
      adminShellPendingBadgeVisible({
        placement: "top_inbox_hub",
        sidebarLayoutActive: true,
        count: 81,
        suppressTopInboxHubOnWorkspace: true,
      }),
    ).toBe(false);
  });

  it("hides top nav dropdown badges when sidebar layout is active", () => {
    expect(
      adminShellPendingBadgeVisible({
        placement: "top_nav_dropdown",
        sidebarLayoutActive: true,
        count: 78,
      }),
    ).toBe(false);
    expect(
      adminShellPendingBadgeVisible({
        placement: "top_nav_dropdown",
        sidebarLayoutActive: false,
        count: 78,
      }),
    ).toBe(true);
  });

  it("never shows sidebar inbox hub badge (leaf breakdown only)", () => {
    expect(
      adminShellPendingBadgeVisible({
        placement: "sidebar_inbox_hub",
        sidebarLayoutActive: true,
        count: 81,
      }),
    ).toBe(false);
  });

  it("shows sidebar leaf badges only when sidebar layout active", () => {
    expect(
      adminShellPendingBadgeVisible({
        placement: "sidebar_queue_leaf",
        sidebarLayoutActive: true,
        count: 78,
      }),
    ).toBe(true);
    expect(
      adminShellPendingBadgeVisible({
        placement: "sidebar_queue_leaf",
        sidebarLayoutActive: true,
        count: 78,
        suppressSidebarLeafOnWorkspaceInboxFocus: true,
      }),
    ).toBe(false);
    expect(
      adminShellPendingBadgeVisible({
        placement: "sidebar_queue_leaf",
        sidebarLayoutActive: false,
        count: 78,
      }),
    ).toBe(false);
  });

  it("rolls up queue pending for nav group summary on narrow layout", () => {
    const rollup = adminShellNavGroupPendingRollup(
      [{ href: ADMIN_INBOX_QUEUE_HREFS.reports }],
      counts,
      channels,
      false,
      false,
      () => true,
      true,
    );
    expect(rollup).toBe(78);
    expect(
      adminShellNavGroupSummaryBadgeVisible({ sidebarLayoutActive: false, rollup: 78 }),
    ).toBe(true);
    expect(
      adminShellNavGroupSummaryBadgeVisible({ sidebarLayoutActive: true, rollup: 78 }),
    ).toBe(false);
    expect(
      adminShellNavGroupSummaryBadgeVisible({
        sidebarLayoutActive: true,
        rollup: 78,
        workspaceInboxFocus: true,
      }),
    ).toBe(false);
    expect(
      adminShellNavGroupSummaryAttentionDotVisible({
        sidebarLayoutActive: true,
        rollup: 78,
        workspaceInboxFocus: true,
      }),
    ).toBe(true);
  });
});
