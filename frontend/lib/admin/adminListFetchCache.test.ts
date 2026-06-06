import { describe, expect, it } from "vitest";

import {
  adminListFetchCacheKey,
  dedupeAdminListFetch,
  invalidateAdminListFetchCache,
  readAdminListFetchCache,
  resetAdminListFetchCacheForTests,
  writeAdminListFetchCache,
} from "./adminListFetchCache";

describe("adminListFetchCache", () => {
  it("reads and writes by key", () => {
    resetAdminListFetchCacheForTests();
    const key = adminListFetchCacheKey("orders", "/api/v1/admin/orders?limit=100");
    expect(readAdminListFetchCache(key)).toBeNull();
    writeAdminListFetchCache(key, { items: [1] });
    expect(readAdminListFetchCache<{ items: number[] }>(key)?.items).toEqual([1]);
  });

  it("dedupes in-flight fetches", async () => {
    resetAdminListFetchCacheForTests();
    const key = adminListFetchCacheKey("orders", "dedupe");
    let runs = 0;
    const p1 = dedupeAdminListFetch(key, async () => {
      runs += 1;
      await new Promise((r) => setTimeout(r, 10));
      return "ok";
    });
    const p2 = dedupeAdminListFetch(key, async () => {
      runs += 1;
      return "other";
    });
    expect(await p1).toBe("ok");
    expect(await p2).toBe("ok");
    expect(runs).toBe(1);
  });

  it("invalidates by scope prefix", () => {
    resetAdminListFetchCacheForTests();
    writeAdminListFetchCache(adminListFetchCacheKey("users", "a"), { ok: true });
    writeAdminListFetchCache(adminListFetchCacheKey("orders", "b"), { ok: true });
    invalidateAdminListFetchCache("users::");
    expect(readAdminListFetchCache(adminListFetchCacheKey("users", "a"))).toBeNull();
    expect(readAdminListFetchCache(adminListFetchCacheKey("orders", "b"))).toBeTruthy();
  });
});
