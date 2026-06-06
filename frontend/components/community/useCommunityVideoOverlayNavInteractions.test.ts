import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { useCommunityVideoOverlayNavInteractions } from "./useCommunityVideoOverlayNavInteractions";

describe("useCommunityVideoOverlayNavInteractions · at last", () => {
  it("calls onAtLastAdvance when goNext at last item", () => {
    const onAtLastAdvance = vi.fn();
    const { result } = renderHook(() => {
      const [index, setIndex] = useState(2);
      const nav = useCommunityVideoOverlayNavInteractions({
        open: true,
        itemsLength: 3,
        atFirst: false,
        onClose: vi.fn(),
        setIndex,
        setPaused: vi.fn(),
        setVideoError: vi.fn(),
        setProgress: vi.fn(),
        setSlideDir: vi.fn(),
        onAtLastAdvance,
      });
      return { nav, index };
    });

    act(() => {
      result.current.nav.goNext();
    });

    expect(onAtLastAdvance).toHaveBeenCalledTimes(1);
    expect(result.current.index).toBe(2);
  });
});
