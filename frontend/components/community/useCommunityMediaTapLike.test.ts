import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCommunityMediaTapLike } from "./useCommunityMediaTapLike";

describe("useCommunityMediaTapLike", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires onLike on double tap within window", () => {
    const onLike = vi.fn();
    const onSingleTap = vi.fn();
    const { result } = renderHook(() =>
      useCommunityMediaTapLike({ enabled: true, onLike, onSingleTap, singleTapDelayMs: 300 }),
    );

    act(() => {
      result.current.handleTap(10, 10);
      result.current.handleTap(12, 12);
    });

    expect(onLike).toHaveBeenCalledTimes(1);
    expect(onSingleTap).not.toHaveBeenCalled();
    expect(result.current.heartBurst).toBeTruthy();
  });

  it("fires onSingleTap after delay when only one tap", () => {
    const onLike = vi.fn();
    const onSingleTap = vi.fn();
    const { result } = renderHook(() =>
      useCommunityMediaTapLike({ enabled: true, onLike, onSingleTap, singleTapDelayMs: 300 }),
    );

    act(() => {
      result.current.handleTap(10, 10);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSingleTap).toHaveBeenCalledTimes(1);
    expect(onLike).not.toHaveBeenCalled();
  });
});
