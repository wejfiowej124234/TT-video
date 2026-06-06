import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePostDetailMediaWheel } from "./usePostDetailMediaWheel";

function WheelStage({
  enabled,
  mode,
  onNext,
  onPrev,
}: {
  enabled: boolean;
  mode: "images" | "videoFeed" | null;
  onNext: () => void;
  onPrev: () => void;
}) {
  const ref = usePostDetailMediaWheel({ enabled, mode, onNext, onPrev });
  return <div ref={ref} data-testid="stage" />;
}

describe("usePostDetailMediaWheel", () => {
  it("calls onNext/onPrev on wheel when enabled", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const { getByTestId } = render(
      <WheelStage enabled mode="images" onNext={onNext} onPrev={onPrev} />,
    );
    const stage = getByTestId("stage");
    stage.dispatchEvent(new WheelEvent("wheel", { deltaY: 40, bubbles: true }));
    expect(onNext).toHaveBeenCalledTimes(1);
    stage.dispatchEvent(new WheelEvent("wheel", { deltaY: -40, bubbles: true }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("ignores small wheel deltas", () => {
    const onNext = vi.fn();
    const { getByTestId } = render(
      <WheelStage enabled mode="videoFeed" onNext={onNext} onPrev={vi.fn()} />,
    );
    getByTestId("stage").dispatchEvent(new WheelEvent("wheel", { deltaY: 8, bubbles: true }));
    expect(onNext).not.toHaveBeenCalled();
  });
});
