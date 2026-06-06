import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_DATA_MUTATED_EVENT,
  invalidateAdminCachesAfterWrite,
} from "./adminPostWriteCacheInvalidation";
import {
  readAdminListFetchCache,
  resetAdminListFetchCacheForTests,
  writeAdminListFetchCache,
} from "./adminListFetchCache";

describe("invalidateAdminCachesAfterWrite", () => {
  beforeEach(() => {
    resetAdminListFetchCacheForTests();
  });

  it("dispatches data-mutated and clears all list cache by default", () => {
    writeAdminListFetchCache("users::/a", { items: [], appliedFilters: null, meta: null });
    writeAdminListFetchCache("flags::/b", { items: [], appliedFilters: null, meta: null });
    const listener = vi.fn();
    window.addEventListener(ADMIN_DATA_MUTATED_EVENT, listener);

    invalidateAdminCachesAfterWrite();

    expect(readAdminListFetchCache("users::/a")).toBeNull();
    expect(readAdminListFetchCache("flags::/b")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(ADMIN_DATA_MUTATED_EVENT, listener);
  });

  it("can scope invalidation to one list scope", () => {
    writeAdminListFetchCache("users::/a", { items: [], appliedFilters: null, meta: null });
    writeAdminListFetchCache("flags::/b", { items: [], appliedFilters: null, meta: null });

    invalidateAdminCachesAfterWrite(["users"]);

    expect(readAdminListFetchCache("users::/a")).toBeNull();
    expect(readAdminListFetchCache("flags::/b")).not.toBeNull();
  });
});
