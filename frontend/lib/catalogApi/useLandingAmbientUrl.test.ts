/**
 * useLandingAmbientUrl · hydration 与 client 升级（W1）
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LANDING_AMBIENT_BY_COUNTRY_ZH, landingAmbientImageUrl } from "../landingAmbientByCountry";
import { useLandingAmbientUrl } from "./useLandingAmbientUrl";

vi.mock("./client.ts", () => ({
  isCatalogApiEnabled: vi.fn(() => false),
}));

vi.mock("./resolveLandingAmbient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./resolveLandingAmbient.ts")>();
  return {
    ...actual,
    resolveLandingAmbientUrl: vi.fn(actual.resolveLandingAmbientUrl),
  };
});

import { isCatalogApiEnabled } from "./client";
import { resolveLandingAmbientUrl } from "./resolveLandingAmbient";

const CN_TS = landingAmbientImageUrl("中国");
const CN_API = LANDING_AMBIENT_BY_COUNTRY_ZH["中国"]!;

afterEach(() => {
  vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
  vi.mocked(resolveLandingAmbientUrl).mockReset();
});

describe("useLandingAmbientUrl", () => {
  it("flag=0: initial and stable TS url (no API upgrade)", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
    const { result } = renderHook(() => useLandingAmbientUrl("中国"));
    expect(result.current).toBe(CN_TS);
    await waitFor(() => {
      expect(resolveLandingAmbientUrl).not.toHaveBeenCalled();
    });
    expect(result.current).toBe(CN_TS);
  });

  it("flag=1: initial TS then upgrades to API url after resolve", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveLandingAmbientUrl).mockResolvedValue({
      data: CN_API,
      source: "catalog-api",
    });
    const { result } = renderHook(() => useLandingAmbientUrl("中国"));
    expect(result.current).toBe(CN_TS);
    await waitFor(() => {
      expect(result.current).toBe(CN_API);
    });
    expect(resolveLandingAmbientUrl).toHaveBeenCalledWith("中国");
  });

  it("flag=1 API fallback: stays on TS when resolve returns ts", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveLandingAmbientUrl).mockResolvedValue({ data: CN_TS, source: "ts" });
    const { result } = renderHook(() => useLandingAmbientUrl("中国"));
    expect(result.current).toBe(CN_TS);
    await waitFor(() => {
      expect(resolveLandingAmbientUrl).toHaveBeenCalled();
    });
    expect(result.current).toBe(CN_TS);
  });

  it("country switch from empty uses TS immediately before catalog upgrade", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveLandingAmbientUrl).mockResolvedValue({
      data: "https://api.example/ocs-kyoto-culture-community-media.jpg",
      source: "catalog-api",
    });
    const { result, rerender } = renderHook(({ c }) => useLandingAmbientUrl(c), {
      initialProps: { c: "" },
    });
    expect(result.current).toBe(landingAmbientImageUrl(""));
    rerender({ c: "中国" });
    expect(result.current).toBe(CN_TS);
    await waitFor(() => {
      expect(result.current).toBe("https://api.example/ocs-kyoto-culture-community-media.jpg");
    });
  });

  it("no hydration mismatch: first render equals TS before effect", () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveLandingAmbientUrl).mockResolvedValue({
      data: CN_API,
      source: "catalog-api",
    });
    const { result, rerender } = renderHook(({ c }) => useLandingAmbientUrl(c), {
      initialProps: { c: "中国" },
    });
    const firstPaint = result.current;
    expect(firstPaint).toBe(CN_TS);
    rerender({ c: "中国" });
    expect(result.current).toBe(firstPaint);
  });
});
