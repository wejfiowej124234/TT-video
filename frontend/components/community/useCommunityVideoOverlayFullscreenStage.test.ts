import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createRef } from "react";
import { useCommunityVideoOverlayFullscreenStage } from "./useCommunityVideoOverlayFullscreenStage";

describe("useCommunityVideoOverlayFullscreenStage (B2 · ① fullscreen stage)", () => {
  const stage = document.createElement("motion-div") as HTMLDivElement;

  beforeEach(() => {
    stage.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      writable: true,
      value: null,
    });
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports fsSupported when Fullscreen API is available", () => {
    const ref = createRef<HTMLDivElement>();
    ref.current = stage;
    const { result } = renderHook(() => useCommunityVideoOverlayFullscreenStage(ref));
    expect(result.current.fsSupported).toBe(true);
  });

  it("syncs inFullscreen on fullscreenchange when stage is active element", () => {
    const ref = createRef<HTMLDivElement>();
    ref.current = stage;
    const { result } = renderHook(() => useCommunityVideoOverlayFullscreenStage(ref));

    act(() => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: stage,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.inFullscreen).toBe(true);

    act(() => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.inFullscreen).toBe(false);
  });

  it("toggleStageFullscreen requests fullscreen when not active", () => {
    const ref = createRef<HTMLDivElement>();
    ref.current = stage;
    const { result } = renderHook(() => useCommunityVideoOverlayFullscreenStage(ref));

    act(() => {
      result.current.toggleStageFullscreen();
    });
    expect(stage.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("toggleStageFullscreen exits when stage is fullscreenElement", () => {
    const ref = createRef<HTMLDivElement>();
    ref.current = stage;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: stage,
    });
    const { result } = renderHook(() => useCommunityVideoOverlayFullscreenStage(ref));

    act(() => {
      result.current.toggleStageFullscreen();
    });
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });
});
