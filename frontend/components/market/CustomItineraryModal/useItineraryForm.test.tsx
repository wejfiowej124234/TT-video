/**
 * 43 §5.3 第 9 项：useItineraryForm 单测（表单状态与返回值形状）
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useItineraryForm } from "./useItineraryForm";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/apiClient", () => ({
  getMe: vi.fn(() => Promise.resolve({})),
}));

describe("useItineraryForm", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onSuccess.mockClear();
  });

  it("returns expected shape when open is false", () => {
    const { result } = renderHook(() =>
      useItineraryForm({ open: false, onClose, onSuccess })
    );

    expect(result.current.form).toBeDefined();
    expect(result.current.form.totalDays).toBe(5);
    expect(result.current.form.creatorType).toBeDefined();
    expect(typeof result.current.setForm).toBe("function");
    expect(result.current.submitError).toBe(null);
    expect(result.current.submitting).toBe(false);
    expect(result.current.quote).toBeDefined();
    expect(result.current.quote.budgetBreakdown).toBeDefined();
    expect(result.current.quote.guideQuoteBreakdown).toBeDefined();
    expect(Array.isArray(result.current.cities)).toBe(true);
    expect(typeof result.current.setTotalDays).toBe("function");
    expect(typeof result.current.setDayPlan).toBe("function");
    expect(typeof result.current.setGuideDayPlan).toBe("function");
    expect(typeof result.current.resetForm).toBe("function");
    expect(typeof result.current.handleSubmit).toBe("function");
  });

  it("cities is empty when form.country is empty", () => {
    const { result } = renderHook(() =>
      useItineraryForm({ open: false, onClose, onSuccess })
    );
    expect(result.current.cities).toEqual([]);
  });
});
