"use client";

/**
 * Landing ambient URL · 首屏 TS（hydration 安全）· ENABLED=1 时 client 升级 API
 */
import { useEffect, useMemo, useState } from "react";
import { landingAmbientImageUrl } from "@/lib/landingAmbientByCountry";
import { isCatalogApiEnabled } from "@/lib/catalogApi/client";
import { resolveLandingAmbientUrl } from "@/lib/catalogApi/resolveLandingAmbient";

export function useLandingAmbientUrl(country: string, emptyFallback?: string): string {
  const tsUrl = useMemo(() => {
    if (!country.trim()) return emptyFallback ?? landingAmbientImageUrl("");
    return landingAmbientImageUrl(country);
  }, [country, emptyFallback]);

  const [url, setUrl] = useState(tsUrl);

  useEffect(() => {
    setUrl(tsUrl);
    if (!isCatalogApiEnabled()) return;
    let cancelled = false;
    void resolveLandingAmbientUrl(country).then((r) => {
      if (!cancelled) setUrl(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [country, tsUrl]);

  return url;
}
