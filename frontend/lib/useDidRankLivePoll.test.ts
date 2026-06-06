import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDidRankLivePoll } from "@/lib/useDidRankLivePoll";

describe("useDidRankLivePoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.NEXT_PUBLIC_DID_RANK_POLL_MS;
  });

  it("returns inactive when poll ms below threshold", () => {
    process.env.NEXT_PUBLIC_DID_RANK_POLL_MS = "5000";
    const onPoll = vi.fn();
    const { result } = renderHook(() => useDidRankLivePoll(onPoll, true));
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onPoll).not.toHaveBeenCalled();
  });

  it("polls on interval when enabled and ms configured", () => {
    process.env.NEXT_PUBLIC_DID_RANK_POLL_MS = "30000";
    const onPoll = vi.fn();
    const { result } = renderHook(() => useDidRankLivePoll(onPoll, true));
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(onPoll).toHaveBeenCalledTimes(1);
  });
});
