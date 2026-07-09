"use client";

/**
 * Landing ambient URL · 首屏 TS（hydration 安全）· ENABLED=1 时 client 升级 API
 */
import { useEffect, useMemo, useState } from "react";
import { landingAmbientImageUrl } from "@/lib/landingAmbientByCountry";
import { isCatalogApiEnabled } from "@/lib/catalogApi/client";
import { resolveLandingAmbientUrl } from "@/lib/catalogApi/resolveLandingAmbient";

export type LandingAmbientResolution = {
  selectedCountry: string;
  tsUrl: string;
  catalogUrl: string | null;
  runtimeUrl: string;
};

export function useLandingAmbientResolution(
  country: string,
  emptyFallback?: string,
): LandingAmbientResolution {
  const selectedCountry = country;
  const tsUrl = useMemo(() => {
    if (!country.trim()) return emptyFallback ?? landingAmbientImageUrl("");
    return landingAmbientImageUrl(country);
  }, [country, emptyFallback]);

  const [catalogUrl, setCatalogUrl] = useState<string | null>(null);

  useEffect(() => {
    setCatalogUrl(null);
    if (!isCatalogApiEnabled() || !country.trim()) return;
    let cancelled = false;
    void resolveLandingAmbientUrl(country).then((r) => {
      if (!cancelled && r.source === "catalog-api") setCatalogUrl(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const runtimeUrl = catalogUrl ?? tsUrl;

  return { selectedCountry, tsUrl, catalogUrl, runtimeUrl };
}

export function useLandingAmbientUrl(country: string, emptyFallback?: string): string {
  return useLandingAmbientResolution(country, emptyFallback).runtimeUrl;
}
