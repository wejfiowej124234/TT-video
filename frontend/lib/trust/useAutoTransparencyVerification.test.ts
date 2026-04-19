import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAutoTransparencyVerification } from "./useAutoTransparencyVerification";

vi.mock("@/lib/trust/buildTransparencyBundle", () => ({
  buildTransparencyBundle: vi.fn(),
}));

vi.mock("@/lib/trust/stableStringify", () => ({
  stableStringify: (x: unknown) => JSON.stringify(x),
  sha256HexUtf8: async () => "ab".repeat(32),
}));

import { buildTransparencyBundle } from "@/lib/trust/buildTransparencyBundle";

describe("useAutoTransparencyVerification", () => {
  const t = (k: string) => k;

  beforeEach(() => {
    vi.mocked(buildTransparencyBundle).mockResolvedValue({
      schema: "traveltrust_transparency_bundle.v1",
      fetched_at: "2026-01-01T00:00:00.000Z",
      build: { git_sha: "deadbeef", deployed_at: null },
      meta_slice: {},
      protocol_reference_summary: { doc_version: "v1" },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs initial verify and reaches verified", async () => {
    const { result } = renderHook(() =>
      useAutoTransparencyVerification({ t, refreshKey: "a:1", pollIntervalMs: 0 }),
    );
    await waitFor(() => {
      expect(result.current.trustState).toBe("verified");
    });
    expect(result.current.bundle?.build.git_sha).toBe("deadbeef");
    expect(result.current.fingerprint).toHaveLength(64);
  });

  it("re-runs when refreshKey changes", async () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useAutoTransparencyVerification({ t, refreshKey: key, pollIntervalMs: 0 }),
      { initialProps: { key: "x:1" } },
    );
    await waitFor(() => expect(result.current.trustState).toBe("verified"));
    const firstCalls = vi.mocked(buildTransparencyBundle).mock.calls.length;
    act(() => {
      rerender({ key: "x:2" });
    });
    await waitFor(() => {
      expect(vi.mocked(buildTransparencyBundle).mock.calls.length).toBeGreaterThan(firstCalls);
    });
  });
});
