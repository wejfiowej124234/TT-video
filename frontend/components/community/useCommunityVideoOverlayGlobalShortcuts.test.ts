import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCommunityVideoOverlayGlobalShortcuts } from "./useCommunityVideoOverlayGlobalShortcuts";

describe("useCommunityVideoOverlayGlobalShortcuts", () => {
  beforeEach(() => {
    vi.stubGlobal("addEventListener", vi.fn());
    vi.stubGlobal("removeEventListener", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers keydown when open", () => {
    renderHook(() =>
      useCommunityVideoOverlayGlobalShortcuts({
        open: true,
        goNext: vi.fn(),
        goPrev: vi.fn(),
        togglePlay: vi.fn(),
        setMuted: vi.fn(),
      }),
    );
    expect(window.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("f key toggles fullscreen when enabled", () => {
    const toggleStageFullscreen = vi.fn();
    renderHook(() =>
      useCommunityVideoOverlayGlobalShortcuts({
        open: true,
        goNext: vi.fn(),
        goPrev: vi.fn(),
        togglePlay: vi.fn(),
        setMuted: vi.fn(),
        fullscreenShortcutEnabled: true,
        toggleStageFullscreen,
      }),
    );
    const addCall = vi.mocked(window.addEventListener).mock.calls.find((c) => c[0] === "keydown");
    const handler = addCall?.[1] as (ev: KeyboardEvent) => void;
    expect(handler).toBeTypeOf("function");
    handler({ key: "f", preventDefault: vi.fn(), target: document.body } as unknown as KeyboardEvent);
    expect(toggleStageFullscreen).toHaveBeenCalledTimes(1);
  });
});
