/**
 * 旅行收购创作台：打开态标题与基础校验
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import AcquisitionCarryStudioModal from "./AcquisitionCarryStudioModal";
import { LocaleProvider } from "@/components/LocaleProvider";

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

describe("AcquisitionCarryStudioModal", () => {
  it("renders dialog title when open", () => {
    render(
      <LocaleProvider>
        <AcquisitionCarryStudioModal open onClose={() => {}} />
      </LocaleProvider>,
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { level: 2, name: /收购需求创作台|Acquisition request studio/i }),
    ).toBeTruthy();
  });

  it("requires title, country, bounty, and escrow ack before save", () => {
    const onClose = vi.fn();
    render(
      <LocaleProvider>
        <AcquisitionCarryStudioModal open onClose={onClose} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /保存收购草稿|Save acquisition draft/i }));
    // Gate strip (assertive) + form validation may both expose role=alert.
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
