import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { getMeFull } from "@/lib/apiClient";
import { useGuideApiStakeAmount } from "./useGuideApiStakeAmount";

vi.mock("@/lib/apiClient", () => ({
  getMeFull: vi.fn(),
}));

describe("useGuideApiStakeAmount", () => {
  beforeEach(() => {
    vi.mocked(getMeFull).mockReset();
  });

  it("parses guide.stake_amount when enabled", async () => {
    vi.mocked(getMeFull).mockResolvedValue({ guide: { stake_amount: "250" } } as never);

    const { result } = renderHook(() => useGuideApiStakeAmount(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.amount).toBe("250");
    expect(result.current.error).toBe(false);
  });

  it("skips fetch when disabled", () => {
    const { result } = renderHook(() => useGuideApiStakeAmount(false));
    expect(result.current.amount).toBeNull();
    expect(getMeFull).not.toHaveBeenCalled();
  });
});
