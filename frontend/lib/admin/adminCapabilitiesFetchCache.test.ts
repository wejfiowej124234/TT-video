import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_CAPABILITIES_FETCH_CACHE_TTL_MS,
  invalidateAdminCapabilitiesFetchCache,
  readAdminCapabilitiesFetchCache,
  resetAdminCapabilitiesFetchCacheForTests,
  writeAdminCapabilitiesFetchCache,
} from "./adminCapabilitiesFetchCache";

describe("adminCapabilitiesFetchCache", () => {
  afterEach(() => {
    resetAdminCapabilitiesFetchCacheForTests();
  });

  it("reads warm cache within TTL", () => {
    writeAdminCapabilitiesFetchCache({
      role: "admin",
      consoleRole70: "Ops",
      consoleRoleSource: "db",
      permissions: ["admin.users.read"],
      matrixVersion: "v3",
      roleMatrixPreview: null,
      phase2Prep: null,
    });
    expect(readAdminCapabilitiesFetchCache()?.role).toBe("admin");
  });

  it("expires after TTL", () => {
    writeAdminCapabilitiesFetchCache({
      role: "admin",
      consoleRole70: null,
      consoleRoleSource: null,
      permissions: [],
      matrixVersion: null,
      roleMatrixPreview: null,
      phase2Prep: null,
    });
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + ADMIN_CAPABILITIES_FETCH_CACHE_TTL_MS + 1);
    expect(readAdminCapabilitiesFetchCache()).toBeNull();
    vi.restoreAllMocks();
  });

  it("invalidates on auth change hook contract", () => {
    writeAdminCapabilitiesFetchCache({
      role: "admin",
      consoleRole70: null,
      consoleRoleSource: null,
      permissions: [],
      matrixVersion: null,
      roleMatrixPreview: null,
      phase2Prep: null,
    });
    invalidateAdminCapabilitiesFetchCache();
    expect(readAdminCapabilitiesFetchCache()).toBeNull();
  });
});
