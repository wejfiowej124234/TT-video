/**
 * `/me/security` 数据入口：`page.tsx` → `apiClient/meSecurity.ts` → `routes.*`（96-20 §0.2 机读锚）
 */
import { describe, it, expect } from "vitest";
import { routes } from "./api";

describe("me security routes (api.ts)", () => {
  it("exposes fixed session list and current-session delete paths", () => {
    expect(routes.meSessions).toBe("/api/v1/me/sessions");
    expect(routes.meSessionCurrent).toBe("/api/v1/me/sessions/current");
  });

  it("builds security-notifications URL with optional query params", () => {
    expect(routes.meSecurityNotifications()).toBe("/api/v1/me/security-notifications");
    expect(routes.meSecurityNotifications({ limit: 20 })).toBe("/api/v1/me/security-notifications?limit=20");
    expect(routes.meSecurityNotifications({ status: "failed", event_type: "reset" })).toBe(
      "/api/v1/me/security-notifications?status=failed&event_type=reset"
    );
    expect(routes.meSecurityNotifications({ limit: 50, status: "pending", event_type: "x" })).toBe(
      "/api/v1/me/security-notifications?limit=50&status=pending&event_type=x"
    );
  });

  it("encodes session suffix for DELETE path (align with axum Path)", () => {
    expect(routes.meSessionBySuffix("abcd1234")).toBe("/api/v1/me/sessions/abcd1234");
    expect(routes.meSessionBySuffix("a b")).toBe("/api/v1/me/sessions/a%20b");
    expect(routes.meSessionBySuffix("尾/段")).toContain("/api/v1/me/sessions/");
  });
});
