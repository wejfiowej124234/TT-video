"use client";

/**
 * Custom Itinerary POI 展示读链路 · 首屏 TS · ENABLED=1 client 升级
 */
import { useEffect, useMemo, useState } from "react";
import { isCatalogApiEnabled } from "@/lib/catalogApi/client";
import type { CatalogPoiDetail, CatalogPoiType } from "@/lib/catalogApi/catalogPoiAdapter";
import { readPoiDetailsFromTs } from "@/lib/catalogApi/catalogPoiAdapter";
import { resolveCatalogPoiDetails } from "@/lib/catalogApi/resolve";

export function useCatalogPoiDetails(
  cityNameZh: string,
  countryNameZh: string,
  type: CatalogPoiType,
): CatalogPoiDetail[] {
  const tsDetails = useMemo(
    () => readPoiDetailsFromTs(cityNameZh, type),
    [cityNameZh, type],
  );
  const [details, setDetails] = useState(tsDetails);

  useEffect(() => {
    setDetails(tsDetails);
    if (!cityNameZh.trim() || !countryNameZh.trim() || !isCatalogApiEnabled()) return;
    let cancelled = false;
    void resolveCatalogPoiDetails(cityNameZh, countryNameZh, type).then((r) => {
      if (!cancelled) setDetails(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [cityNameZh, countryNameZh, type, tsDetails]);

  return details;
}
