/**
 * 50-O-F10：useDidRankData 单测（缓存键、成功路径列表形状）
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import type { Period } from "@/lib/didRankUtils";

import { useDidRankData } from "./useDidRankData";

const t = (k: string) => k;

const { getDidRankTravelers, getDidRankGuides } = vi.hoisted(() => ({
  getDidRankTravelers: vi.fn(),
  getDidRankGuides: vi.fn(),
}));

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...actual,
    getDidRankTravelers,
    getDidRankGuides,
  };
});

describe("useDidRankData", () => {
  beforeEach(() => {
    getDidRankTravelers.mockReset();
    getDidRankGuides.mockReset();
    getDidRankTravelers.mockResolvedValue({ travelers: [] });
    getDidRankGuides.mockResolvedValue({ guides: [] });
  });

  it("loads travelers and guides for period", async () => {
    getDidRankTravelers.mockResolvedValue({
      travelers: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          rank: 1,
          nickname: "T1",
          is_me: false,
        },
      ],
    });
    getDidRankGuides.mockResolvedValue({
      guides: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          rank: 1,
          nickname: "G1",
          totalAmountUsdt: 20,
          reception_count: 2,
          is_me: false,
        },
      ],
    });

    const { result, rerender } = renderHook(
      ({ period }: { period: Period }) => useDidRankData(period, "weighted", t),
      {
      initialProps: { period: "all" as Period },
    },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.listTravelers).toHaveLength(1);
    expect(result.current.listGuides).toHaveLength(1);
    expect(result.current.listTravelers[0]?.nickname).toBe("T1");
    expect(result.current.fetchError).toBeNull();
    expect(result.current.apiDataConnected).toBe(true);

    getDidRankTravelers.mockClear();
    getDidRankGuides.mockClear();

    rerender({ period: "week" });
    await waitFor(() => expect(getDidRankTravelers).toHaveBeenCalled());
    expect(getDidRankTravelers.mock.calls.some((c) => c[0] === "week")).toBe(true);
  });

  it("preserves rank_delta from API when present", async () => {
    getDidRankTravelers.mockResolvedValue({
      travelers: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          rank: 2,
          nickname: "T1",
          rank_delta: 3,
        },
      ],
    });
    getDidRankGuides.mockResolvedValue({ guides: [] });

    const { result } = renderHook(() => useDidRankData("all", "weighted", t));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.listTravelers[0]?.rank_delta).toBe(3);
  });

  it("retryFetch clears error path without throw", async () => {
    getDidRankTravelers.mockRejectedValueOnce(new Error("network"));
    getDidRankGuides.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useDidRankData("all", "weighted", t));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.fetchError).toBeTruthy();

    getDidRankTravelers.mockResolvedValue({ travelers: [] });
    getDidRankGuides.mockResolvedValue({ guides: [] });
    result.current.retryFetch();

    await waitFor(() => expect(result.current.fetchError).toBeNull());
  });
});
