import { describe, expect, it } from "vitest";

import {
  markAdminRoutePrefetchSessionStarted,
  adminRoutePrefetchSessionActive,
  resetAdminRoutePrefetchSession,
} from "./adminRoutePrefetchSession";

describe("adminRoutePrefetchSession", () => {
  it("starts inactive and latches once per session", () => {
    resetAdminRoutePrefetchSession();
    expect(adminRoutePrefetchSessionActive()).toBe(false);
    markAdminRoutePrefetchSessionStarted();
    expect(adminRoutePrefetchSessionActive()).toBe(true);
    resetAdminRoutePrefetchSession();
    expect(adminRoutePrefetchSessionActive()).toBe(false);
  });
});
