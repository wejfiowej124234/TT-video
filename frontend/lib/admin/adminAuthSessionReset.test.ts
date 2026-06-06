import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminSubpageBootBlocked,
  markAdminCapabilitiesBootReady,
  resetAdminCapabilitiesBootState,
} from "./adminCapabilitiesBootState";
import {
  ADMIN_AUTH_SESSION_RESET_EVENT,
  resetAdminAuthSessionState,
} from "./adminAuthSessionReset";
import {
  adminRoutePrefetchSessionActive,
  markAdminRoutePrefetchSessionStarted,
  resetAdminRoutePrefetchSession,
} from "./adminRoutePrefetchSession";
import {
  readAdminListFetchCache,
  resetAdminListFetchCacheForTests,
  writeAdminListFetchCache,
} from "./adminListFetchCache";

describe("resetAdminAuthSessionState", () => {
  beforeEach(() => {
    resetAdminListFetchCacheForTests();
    resetAdminCapabilitiesBootState();
    resetAdminRoutePrefetchSession();
  });

  it("clears boot latch, prefetch session, and list cache", () => {
    markAdminCapabilitiesBootReady(true);
    expect(
      adminSubpageBootBlocked({
        loading: true,
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
      }),
    ).toBe(false);

    markAdminRoutePrefetchSessionStarted();
    writeAdminListFetchCache("users::/x", { items: [], appliedFilters: null, meta: null });

    const listener = vi.fn();
    window.addEventListener(ADMIN_AUTH_SESSION_RESET_EVENT, listener);

    resetAdminAuthSessionState();

    expect(
      adminSubpageBootBlocked({
        loading: true,
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
      }),
    ).toBe(true);
    expect(adminRoutePrefetchSessionActive()).toBe(false);
    expect(readAdminListFetchCache("users::/x")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(ADMIN_AUTH_SESSION_RESET_EVENT, listener);
  });
});
