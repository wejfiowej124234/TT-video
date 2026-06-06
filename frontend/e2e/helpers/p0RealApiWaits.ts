/**
 * P0：**真实** JSON API 响应等待（与测试网/生产同源路径），供 smoke / `p0-spine-real-api` 复用。
 */
import type { Page } from "@playwright/test";

export function waitCommunityFeedGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/community/feed") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

export function waitCommunityUserPostsGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      /\/api\/v1\/community\/users\/[^/]+\/posts/i.test(res.url()) &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

export function waitDiscoverOrdersGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/discover/orders") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

/** `GET /api/v1/guides` 列表（**不含** `/api/v1/guides/:id` 详情） */
export function waitGuidesGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      return new URL(res.url()).pathname.replace(/\/+$/, "") === "/api/v1/guides";
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

/** `GET /api/v1/orders` 列表（无 `/orders/:id` 子路径） */
export function waitOrdersListGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      const p = new URL(res.url()).pathname.replace(/\/+$/, "");
      return p === "/api/v1/orders";
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

export function waitMeGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      return new URL(res.url()).pathname.replace(/\/+$/, "") === "/api/v1/me";
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

export function waitCommunityMeFollowingGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/community/me/following") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

export function waitCommunityMeFollowersGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/community/me/followers") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

export function waitCommunityFriendsListGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/community/friends/list") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

export function waitCommunityMeLikesReceivedGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/community/me/likes-received") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

/** `GET /api/v1/community/me/posts`（可带 query） */
export function waitCommunityMePostsGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      return new URL(res.url()).pathname.replace(/\/+$/, "") === "/api/v1/community/me/posts";
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

/** `GET /api/v1/community/me/collects`（可带 query） */
export function waitCommunityMeCollectsGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      return new URL(res.url()).pathname.replace(/\/+$/, "") === "/api/v1/community/me/collects";
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

/** `GET /api/v1/community/me/likes`（可带 query；赞过列表关时前端可能不请求 → 用例须 **probe** 或 **skip**） */
export function waitCommunityMeLikesGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      return new URL(res.url()).pathname.replace(/\/+$/, "") === "/api/v1/community/me/likes";
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

export function waitMeSessionsGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      return new URL(res.url()).pathname.replace(/\/+$/, "") === "/api/v1/me/sessions";
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

export function waitMeSecurityNotificationsGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/me/security-notifications") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

/** `GET /api/v1/orders/:id`（与 04 订单详情同源） */
export function waitOrderByIdGet200(page: Page, orderId: string, timeoutMs = 120_000) {
  const id = orderId.trim();
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      const p = new URL(res.url()).pathname.replace(/\/+$/, "");
      return p === `/api/v1/orders/${id}`;
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

/** `GET /api/v1/orders/:id/chain-sync-status`（托管页 FinalityBadge 等与 110 同源） */
export function waitOrderChainSyncStatusGet200(page: Page, orderId: string, timeoutMs = 120_000) {
  const id = orderId.trim();
  return page.waitForResponse((res) => {
    if (res.request().method() !== "GET" || res.status() !== 200) return false;
    try {
      const p = new URL(res.url()).pathname.replace(/\/+$/, "");
      return p === `/api/v1/orders/${id}/chain-sync-status`;
    } catch {
      return false;
    }
  }, { timeout: timeoutMs });
}

/** 匿名 **`GET /api/v1/onboarding/quote`**（`/me/onboarding` 首屏） */
export function waitOnboardingQuoteGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/onboarding/quote") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}

/** 登录态 **`GET /api/v1/onboarding/entitlements/me`** */
export function waitOnboardingEntitlementsMeGet200(page: Page, timeoutMs = 120_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/onboarding/entitlements/me") &&
      res.request().method() === "GET" &&
      res.status() === 200,
    { timeout: timeoutMs },
  );
}
