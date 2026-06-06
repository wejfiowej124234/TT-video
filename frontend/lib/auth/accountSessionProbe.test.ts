// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_SESSION_TOKEN_KEY, AUTH_USER_ID_KEY } from "@/lib/apiClient/core/authSession";

const getMeMock = vi.fn<() => Promise<unknown | null>>();
const getMeFullMock = vi.fn<(opts?: { force?: boolean }) => Promise<unknown | null>>();

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...actual,
    getMe: () => getMeMock(),
    getMeFull: (opts?: { force?: boolean }) => getMeFullMock(opts),
    clearGetMeCache: vi.fn(),
  };
});

import {
  hasAccountSessionCredentials,
  onAccountSessionChange,
  probeAccountLoggedInViaGetMe,
  probeAccountMeViaGetMeFull,
} from "./accountSessionProbe";

describe("accountSessionProbe", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    getMeFullMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("hasAccountSessionCredentials is false without storage", () => {
    expect(hasAccountSessionCredentials()).toBe(false);
  });

  it("probeAccountLoggedInViaGetMe skips fetch without credentials", async () => {
    await expect(probeAccountLoggedInViaGetMe()).resolves.toBe(false);
    expect(getMeMock).not.toHaveBeenCalled();
  });

  it("probeAccountMeViaGetMeFull returns null without credentials", async () => {
    await expect(probeAccountMeViaGetMeFull()).resolves.toBeNull();
    expect(getMeFullMock).not.toHaveBeenCalled();
  });

  it("onAccountSessionChange notifies listeners", () => {
    const listener = vi.fn();
    const off = onAccountSessionChange(listener);
    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("probeAccountLoggedInViaGetMe uses getMe when token present", async () => {
    localStorage.setItem(AUTH_SESSION_TOKEN_KEY, "tts_x");
    getMeMock.mockResolvedValue({ user: { id: "u1" } });
    await expect(probeAccountLoggedInViaGetMe()).resolves.toBe(true);
  });

  it("probeAccountMeViaGetMeFull uses bearer session", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "dev-user");
    getMeFullMock.mockResolvedValue({ user: { id: "dev-user" } });
    await expect(probeAccountMeViaGetMeFull()).resolves.toEqual({ user: { id: "dev-user" } });
  });
});
