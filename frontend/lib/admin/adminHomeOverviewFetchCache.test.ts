import { afterEach, describe, expect, it } from "vitest";

import {
  readAdminHomeOverviewCache,
  resetAdminHomeOverviewCacheForTests,
  writeAdminHomeOverviewCache,
} from "./adminHomeOverviewFetchCache";

describe("adminHomeOverviewFetchCache", () => {
  afterEach(() => {
    resetAdminHomeOverviewCacheForTests();
  });

  it("stores and reads snapshot within TTL", () => {
    expect(readAdminHomeOverviewCache()).toBeNull();
    writeAdminHomeOverviewCache({
      metrics: null,
      metricsDenied: false,
      metricsError: false,
      users: null,
      usersDenied: false,
      usersError: false,
      observability: { chainId: "31337", indexerLagBlocks: 0, alertsActive: null },
      observabilityDenied: false,
      observabilityError: false,
    });
    expect(readAdminHomeOverviewCache()?.observability?.chainId).toBe("31337");
  });

  it("clears on reset", () => {
    writeAdminHomeOverviewCache({
      metrics: null,
      metricsDenied: false,
      metricsError: false,
      users: null,
      usersDenied: false,
      usersError: false,
      observability: null,
      observabilityDenied: false,
      observabilityError: false,
    });
    resetAdminHomeOverviewCacheForTests();
    expect(readAdminHomeOverviewCache()).toBeNull();
  });
});
