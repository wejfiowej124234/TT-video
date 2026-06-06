import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { useDidRankSecondaryBoard } from "./useDidRankSecondaryBoard";

const { getDidRankProviders } = vi.hoisted(() => ({
  getDidRankProviders: vi.fn(),
}));

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...actual,
    getDidRankProviders,
    getDidRankAcquisitions: vi.fn(),
  };
});

describe("useDidRankSecondaryBoard", () => {
  beforeEach(() => {
    getDidRankProviders.mockReset();
    getDidRankProviders.mockResolvedValue({ providers: [] });
  });

  it("preserves rank_delta from API when present", async () => {
    getDidRankProviders.mockResolvedValue({
      providers: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          rank: 2,
          nickname: "P1",
          published_listings: 4,
          rank_delta: -1,
        },
      ],
    });

    const { result } = renderHook(() => useDidRankSecondaryBoard("provider", "week"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items[0]?.rank_delta).toBe(-1);
  });

  it("preserves is_me from API when present", async () => {
    getDidRankProviders.mockResolvedValue({
      providers: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          rank: 1,
          nickname: "Me",
          is_me: true,
          published_listings: 1,
        },
      ],
    });

    const { result } = renderHook(() => useDidRankSecondaryBoard("provider", "all"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items[0]?.is_me).toBe(true);
  });

  it("sets fetchError on network failure", async () => {
    getDidRankProviders.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useDidRankSecondaryBoard("provider", "all"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.fetchError).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it("skips fetch when enabled is false", async () => {
    const { result } = renderHook(() => useDidRankSecondaryBoard("provider", "all", { enabled: false }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getDidRankProviders).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });
});
