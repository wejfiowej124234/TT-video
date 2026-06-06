// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
const probeMock = vi.fn<() => Promise<boolean>>();

vi.mock("./accountSessionProbe", () => ({
  probeAccountLoggedInViaGetMe: () => probeMock(),
  onAccountSessionChange: (listener: () => void) => {
    const handler = () => listener();
    window.addEventListener("traveltrust:auth-change", handler);
    return () => window.removeEventListener("traveltrust:auth-change", handler);
  },
}));

import { useRegisterPageAccountSession } from "./registerPageAccountSession";

describe("useRegisterPageAccountSession", () => {
  beforeEach(() => {
    probeMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns false when probe reports logged out", async () => {
    probeMock.mockResolvedValue(false);
    const { result } = renderHook(() => useRegisterPageAccountSession());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("returns true when probe reports logged in", async () => {
    probeMock.mockResolvedValue(true);
    const { result } = renderHook(() => useRegisterPageAccountSession());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("re-probes on traveltrust:auth-change", async () => {
    probeMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useRegisterPageAccountSession());
    await waitFor(() => expect(result.current).toBe(true));

    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
    await waitFor(() => expect(result.current).toBe(false));
    expect(probeMock).toHaveBeenCalledTimes(2);
  });
});
