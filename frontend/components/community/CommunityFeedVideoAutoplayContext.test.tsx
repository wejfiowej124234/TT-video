import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import {
  CommunityFeedVideoAutoplayProvider,
  useCommunityFeedCardVideoAutoplay,
} from "./CommunityFeedVideoAutoplayContext";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public cb: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }
}

function wrapper({ children }: { children: ReactNode }) {
  return <CommunityFeedVideoAutoplayProvider>{children}</CommunityFeedVideoAutoplayProvider>;
}

describe("CommunityFeedVideoAutoplayContext", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver as unknown as typeof IntersectionObserver);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLVideoElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not exceed update depth when autoplay target changes", () => {
    const videoRef = { current: document.createElement("video") };
    const { result, rerender } = renderHook(
      ({ postId }) =>
        useCommunityFeedCardVideoAutoplay(postId, videoRef, true),
      { wrapper, initialProps: { postId: "video-a" } },
    );

    act(() => {
      result.current.containerRef.current = document.createElement("div");
    });
    rerender({ postId: "video-a" });

    for (let i = 0; i < 8; i += 1) {
      rerender({ postId: i % 2 === 0 ? "video-a" : "video-b" });
      act(() => {
        const obs = MockIntersectionObserver.instances.at(-1);
        obs?.cb(
          [{ isIntersecting: true, intersectionRatio: 0.8, target: document.createElement("div") } as IntersectionObserverEntry],
          obs as unknown as IntersectionObserver,
        );
      });
    }

    expect(result.current.isAutoplayActive).toBeTypeOf("boolean");
  });
});
