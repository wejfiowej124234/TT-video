"use client";

/**
 * W2 geo 读链路 hooks · 首屏 TS（hydration 安全）· ENABLED=1 时 client 升级 Catalog API
 */
import { useEffect, useMemo, useState } from "react";
import { isCatalogApiEnabled } from "@/lib/catalogApi/client";
import type { CatalogProductCountryRow } from "@/lib/catalogApi/catalogGeoAdapter";
import {
  readCitiesFromTs,
  readCountriesFromTs,
  readProductCountriesFromTs,
} from "@/lib/catalogApi/catalogGeoAdapter";
import {
  resolveCatalogCities,
  resolveCatalogCountries,
  resolveCatalogProductCountries,
} from "@/lib/catalogApi/resolve";
import type { CatalogCityOption, CatalogCountryOption } from "@/lib/catalogApi/types";

export function useCatalogCountryOptions(): CatalogCountryOption[] {
  const tsOptions = useMemo(() => readCountriesFromTs(), []);
  const [options, setOptions] = useState(tsOptions);

  useEffect(() => {
    setOptions(tsOptions);
    if (!isCatalogApiEnabled()) return;
    let cancelled = false;
    void resolveCatalogCountries().then((r) => {
      if (!cancelled) setOptions(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [tsOptions]);

  return options;
}

export function useCatalogCityOptions(countryNameZh: string): CatalogCityOption[] {
  const tsOptions = useMemo(() => readCitiesFromTs(countryNameZh), [countryNameZh]);
  const [options, setOptions] = useState(tsOptions);

  useEffect(() => {
    setOptions(tsOptions);
    if (!countryNameZh.trim() || !isCatalogApiEnabled()) return;
    let cancelled = false;
    void resolveCatalogCities(countryNameZh).then((r) => {
      if (!cancelled) setOptions(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [countryNameZh, tsOptions]);

  return options;
}

export function useCatalogProductCountries(): CatalogProductCountryRow[] {
  const tsRows = useMemo(() => readProductCountriesFromTs(), []);
  const [rows, setRows] = useState(tsRows);

  useEffect(() => {
    setRows(tsRows);
    if (!isCatalogApiEnabled()) return;
    let cancelled = false;
    void resolveCatalogProductCountries().then((r) => {
      if (!cancelled) setRows(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [tsRows]);

  return rows;
}

export type GuideRegisterCountryOption = {
  value: string;
  labelKey: (typeof import("@/lib/productCountries").PRODUCT_COUNTRIES)[number]["guideRegisterLabelKey"] | "guideRegister_pleaseSelect";
};

export function useGuideRegisterCountryOptions(): GuideRegisterCountryOption[] {
  const productCountries = useCatalogProductCountries();
  return useMemo(
    () => [
      { value: "", labelKey: "guideRegister_pleaseSelect" as const },
      ...productCountries.map((c) => ({
        value: c.iso,
        labelKey: c.guideRegisterLabelKey,
      })),
    ],
    [productCountries],
  );
}
