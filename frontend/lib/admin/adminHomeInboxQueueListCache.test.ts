import { describe, expect, it } from "vitest";

import { adminInboxQueueListFetchConfig, adminInboxQueueListCacheKey } from "./adminHomeInboxQueueListCache";
import { adminListFetchCacheKey } from "./adminListFetchCache";

describe("adminHomeInboxQueueListCache", () => {
  it("aligns inbox channels with list SWR scopes", () => {
    for (const key of ["provider", "guide", "steward", "approvals", "reports"] as const) {
      const cfg = adminInboxQueueListFetchConfig(key);
      expect(cfg.scope.length).toBeGreaterThan(0);
      expect(cfg.listUrl.startsWith("/api/v1/admin/")).toBe(true);
      expect(adminInboxQueueListCacheKey(key)).toBe(
        adminListFetchCacheKey(cfg.scope, cfg.listUrl),
      );
    }
  });

  it("uses limit=100 pending approvals to match default list page", () => {
    const cfg = adminInboxQueueListFetchConfig("approvals");
    expect(cfg.listUrl).toContain("limit=100");
    expect(cfg.listUrl).toContain("status=pending");
  });
});
