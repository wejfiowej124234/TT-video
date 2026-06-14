/**
 * useCatalogGeo · W2 hydration 与 client 升级
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COUNTRY_OPTIONS, CITIES_BY_COUNTRY } from "../geoOptions";
import { PRODUCT_COUNTRIES } from "../productCountries";
import {
  useCatalogCityOptions,
  useCatalogCountryOptions,
  useCatalogProductCountries,
  useGuideRegisterCountryOptions,
} from "./useCatalogGeo";

vi.mock("./client.ts", () => ({
  isCatalogApiEnabled: vi.fn(() => false),
}));

vi.mock("./resolve.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./resolve.ts")>();
  return {
    ...actual,
    resolveCatalogCountries: vi.fn(actual.resolveCatalogCountries),
    resolveCatalogCities: vi.fn(actual.resolveCatalogCities),
    resolveCatalogProductCountries: vi.fn(actual.resolveCatalogProductCountries),
  };
});

import { isCatalogApiEnabled } from "./client";
import {
  resolveCatalogCities,
  resolveCatalogCountries,
  resolveCatalogProductCountries,
} from "./resolve";

const TS_COUNTRIES = COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: c.label }));
const TS_CN_CITIES = (CITIES_BY_COUNTRY["中国"] ?? []).map((c) => ({ value: c.value, label: c.label }));
const TS_PRODUCT = PRODUCT_COUNTRIES.map((c) => ({
  iso: c.iso,
  nameZh: c.nameZh,
  guideRegisterLabelKey: c.guideRegisterLabelKey,
}));

afterEach(() => {
  vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
  vi.mocked(resolveCatalogCountries).mockReset();
  vi.mocked(resolveCatalogCities).mockReset();
  vi.mocked(resolveCatalogProductCountries).mockReset();
});

describe("useCatalogCountryOptions", () => {
  it("flag=0: stable TS options", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
    const { result } = renderHook(() => useCatalogCountryOptions());
    expect(result.current).toEqual(TS_COUNTRIES);
    await waitFor(() => {
      expect(resolveCatalogCountries).not.toHaveBeenCalled();
    });
  });

  it("flag=1: initial TS then API upgrade", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogCountries).mockResolvedValue({
      data: TS_COUNTRIES,
      source: "catalog-api",
    });
    const { result } = renderHook(() => useCatalogCountryOptions());
    expect(result.current).toEqual(TS_COUNTRIES);
    await waitFor(() => {
      expect(resolveCatalogCountries).toHaveBeenCalled();
    });
  });

  it("flag=1 API fallback: stays TS", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogCountries).mockResolvedValue({ data: TS_COUNTRIES, source: "ts" });
    const { result } = renderHook(() => useCatalogCountryOptions());
    expect(result.current).toEqual(TS_COUNTRIES);
    await waitFor(() => expect(resolveCatalogCountries).toHaveBeenCalled());
    expect(result.current).toEqual(TS_COUNTRIES);
  });

  it("no hydration mismatch: first render equals TS", () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogCountries).mockResolvedValue({
      data: [{ value: "日本", label: "日本" }],
      source: "catalog-api",
    });
    const { result } = renderHook(() => useCatalogCountryOptions());
    expect(result.current).toEqual(TS_COUNTRIES);
  });
});

describe("useCatalogCityOptions", () => {
  it("flag=0: TS cities for country", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
    const { result } = renderHook(() => useCatalogCityOptions("中国"));
    expect(result.current).toEqual(TS_CN_CITIES);
    await waitFor(() => expect(resolveCatalogCities).not.toHaveBeenCalled());
  });

  it("flag=1: upgrades after resolve", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogCities).mockResolvedValue({
      data: TS_CN_CITIES,
      source: "catalog-api",
    });
    const { result } = renderHook(() => useCatalogCityOptions("中国"));
    expect(result.current).toEqual(TS_CN_CITIES);
    await waitFor(() => expect(resolveCatalogCities).toHaveBeenCalledWith("中国"));
  });

  it("empty country: TS empty without API", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    const { result } = renderHook(() => useCatalogCityOptions(""));
    expect(result.current).toEqual([]);
    await waitFor(() => expect(resolveCatalogCities).not.toHaveBeenCalled());
  });

  it("country/city field shape parity", () => {
    const { result } = renderHook(() => useCatalogCityOptions("中国"));
    for (const row of result.current) {
      expect(row).toEqual(expect.objectContaining({ value: expect.any(String), label: expect.any(String) }));
    }
  });
});

describe("useCatalogProductCountries", () => {
  it("flag=1 fallback keeps TS product rows", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogProductCountries).mockResolvedValue({ data: TS_PRODUCT, source: "ts" });
    const { result } = renderHook(() => useCatalogProductCountries());
    expect(result.current).toEqual(TS_PRODUCT);
    await waitFor(() => expect(resolveCatalogProductCountries).toHaveBeenCalled());
  });
});

describe("useGuideRegisterCountryOptions", () => {
  it("includes pleaseSelect and ISO rows with labelKey", () => {
    const { result } = renderHook(() => useGuideRegisterCountryOptions());
    expect(result.current[0]).toEqual({ value: "", labelKey: "guideRegister_pleaseSelect" });
    expect(result.current.length).toBe(PRODUCT_COUNTRIES.length + 1);
  });
});
