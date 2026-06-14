/**
 * useCatalogPoiDetails · W3 hydration 与 client 升级
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAttractionDetails } from "../cityDetails/index";
import { useCatalogPoiDetails } from "./useCatalogPoi";

vi.mock("./client.ts", () => ({
  isCatalogApiEnabled: vi.fn(() => false),
}));

vi.mock("./resolve.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./resolve.ts")>();
  return {
    ...actual,
    resolveCatalogPoiDetails: vi.fn(actual.resolveCatalogPoiDetails),
  };
});

import { isCatalogApiEnabled } from "./client";
import { resolveCatalogPoiDetails } from "./resolve";

const TS_BEIJING = getAttractionDetails("北京");

afterEach(() => {
  vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
  vi.mocked(resolveCatalogPoiDetails).mockReset();
});

describe("useCatalogPoiDetails", () => {
  it("flag=0: stable TS POI list", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    expect(result.current.map((d) => d.value)).toEqual(TS_BEIJING.map((d) => d.value));
    await waitFor(() => expect(resolveCatalogPoiDetails).not.toHaveBeenCalled());
  });

  it("flag=1: initial TS then API upgrade", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogPoiDetails).mockResolvedValue({
      data: TS_BEIJING,
      source: "catalog-api",
    });
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    expect(result.current.map((d) => d.value)).toEqual(TS_BEIJING.map((d) => d.value));
    await waitFor(() => expect(resolveCatalogPoiDetails).toHaveBeenCalledWith("北京", "中国", "attraction"));
  });

  it("flag=1 fallback: stays TS", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogPoiDetails).mockResolvedValue({ data: TS_BEIJING, source: "ts" });
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    await waitFor(() => expect(resolveCatalogPoiDetails).toHaveBeenCalled());
    expect(result.current).toEqual(TS_BEIJING);
  });

  it("POI display shape parity", () => {
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    for (const row of result.current) {
      expect(row).toEqual(
        expect.objectContaining({
          value: expect.any(String),
          label: expect.any(String),
          image: expect.any(String),
          description: expect.any(String),
        }),
      );
    }
  });

  it("no hydration mismatch: first render equals TS", () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogPoiDetails).mockResolvedValue({
      data: [{ value: "测试", label: "测试", image: "", description: "" }],
      source: "catalog-api",
    });
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    expect(result.current.map((d) => d.value)).toEqual(TS_BEIJING.map((d) => d.value));
  });
});
