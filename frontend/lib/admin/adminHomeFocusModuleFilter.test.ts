import { describe, expect, it } from "vitest";

import { ADMIN_HOME_CARDS } from "./adminHomeModel";
import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import {
  adminHomeCardVisibleInFocusMode,
  filterAdminHomeCardsForFocusMode,
} from "./adminHomeFocusModuleFilter";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "./useAdminHomeInbox";

const counts: AdminHomeInboxCounts = {
  provider: 0,
  steward: 0,
  approvals: 0,
  reports: 78,
};

const channels = {
  provider: { permissionDenied: false, errorKind: null },
  steward: { permissionDenied: false, errorKind: null },
  approvals: { permissionDenied: false, errorKind: null },
  reports: { permissionDenied: false, errorKind: null },
} as AdminHomeInboxChannels;

describe("adminHomeFocusModuleFilter", () => {
  it("shows reports queue and community adjacency when reports pending", () => {
    const reportsCard = ADMIN_HOME_CARDS.find((c) => c.href === ADMIN_INBOX_QUEUE_HREFS.reports)!;
    const appealsCard = ADMIN_HOME_CARDS.find((c) => c.href === "/admin/community/appeals")!;
    const usersCard = ADMIN_HOME_CARDS.find((c) => c.href === "/admin/users")!;

    expect(
      adminHomeCardVisibleInFocusMode({
        card: reportsCard,
        counts,
        channels,
        loading: false,
        consoleRole70: "Ops",
      }),
    ).toBe(true);
    expect(
      adminHomeCardVisibleInFocusMode({
        card: appealsCard,
        counts,
        channels,
        loading: false,
        consoleRole70: "Ops",
      }),
    ).toBe(true);
    expect(
      adminHomeCardVisibleInFocusMode({
        card: usersCard,
        counts,
        channels,
        loading: false,
        consoleRole70: "Ops",
      }),
    ).toBe(false);
  });

  it("includes unified inbox card when any queue pending", () => {
    const inboxCard = ADMIN_HOME_CARDS.find((c) => c.href === "/admin/inbox")!;
    expect(
      adminHomeCardVisibleInFocusMode({
        card: inboxCard,
        counts,
        channels,
        loading: false,
        consoleRole70: "Ops",
      }),
    ).toBe(true);
  });

  it("filter reduces card count vs full list when only reports pending", () => {
    const filtered = filterAdminHomeCardsForFocusMode(ADMIN_HOME_CARDS, {
      counts,
      channels,
      loading: false,
      consoleRole70: "Ops",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(ADMIN_HOME_CARDS.length);
  });
});
