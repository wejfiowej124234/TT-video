/**
 * P8-1 单测：lib/apiClient getAuthHeaders、与 04 一致
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthHeaders } from "./apiClient";

describe("lib/apiClient", () => {
  const origEnv = process.env.NEXT_PUBLIC_DEV_USER_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEV_USER_ID = origEnv;
    vi.restoreAllMocks();
  });

  it("getAuthHeaders returns empty when no localStorage and no env", () => {
    expect(getAuthHeaders()).toEqual({});
  });

  it("getAuthHeaders returns X-User-Id from NEXT_PUBLIC_DEV_USER_ID in node", () => {
    process.env.NEXT_PUBLIC_DEV_USER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(getAuthHeaders()).toEqual({
      "X-User-Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
  });

  it("getAuthHeaders returns X-User-Id from localStorage when in jsdom", () => {
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
    });
    storage["traveltrust_user_id"] = "f0000000-0000-4000-8000-000000000001";
    expect(getAuthHeaders()).toEqual({
      "X-User-Id": "f0000000-0000-4000-8000-000000000001",
    });
  });

  it("getAuthHeaders prefers Bearer session token over X-User-Id when both set", () => {
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
    });
    storage["traveltrust_session_token"] = "tts_abc";
    storage["traveltrust_user_id"] = "f0000000-0000-4000-8000-000000000001";
    expect(getAuthHeaders()).toEqual({ Authorization: "Bearer tts_abc" });
  });
});
