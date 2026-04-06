import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DidRankFetchErrorBanner from "./DidRankFetchErrorBanner";

const t = (key: string) => key;

describe("DidRankFetchErrorBanner", () => {
  it("renders nothing when fetchError is null", () => {
    const { container } = render(
      <DidRankFetchErrorBanner fetchError={null} onRetry={() => {}} t={t} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("uses role=alert + polite live region and 44px retry (650 CI lock)", () => {
    const onRetry = vi.fn();
    render(<DidRankFetchErrorBanner fetchError="x" onRetry={onRetry} t={t} />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText("didRank_fetchFailedHint")).toBeTruthy();
    const btn = screen.getByRole("button", { name: "didRank_retry" });
    expect(btn.className).toContain("min-h-[44px]");
    btn.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
