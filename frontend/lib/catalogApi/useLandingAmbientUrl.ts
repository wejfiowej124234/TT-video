"use client";

/**
 * Landing ambient URL · 首屏 TS（hydration 安全）· ENABLED=1 时 client 升级 API
 *
 * Anti-stutter（Owner 2026-07-22）：
 * - 国家切换时 **不**先 `setCatalogUrl(null)` 再拉 API（避免 TS→Catalog 二次换图）
 * - Catalog URL 与 TS 相同时 **不**再 setState（单次换图）
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

function urlsEquivalent(a: string, b: string): boolean {
  const x = a.trim();
  const y = b.trim();
  if (!x || !y) return false;
  if (x === y) return true;
  try {
    const ua = new URL(x);
    const ub = new URL(y);
    return ua.origin === ub.origin && ua.pathname === ub.pathname;
  } catch {
    return false;
  }
}

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
    if (!isCatalogApiEnabled() || !country.trim()) {
      setCatalogUrl(null);
      return;
    }
    let cancelled = false;
    // Keep previous catalogUrl until resolve completes — do not null-flash.
    void resolveLandingAmbientUrl(country).then((r) => {
      if (cancelled) return;
      if (r.source !== "catalog-api") {
        setCatalogUrl(null);
        return;
      }
      const next = r.data?.trim();
      if (!next) {
        setCatalogUrl(null);
        return;
      }
      const ts = landingAmbientImageUrl(country).trim();
      if (urlsEquivalent(next, ts)) {
        // Same COS asset — stay on tsUrl path (single paint on country change).
        setCatalogUrl(null);
        return;
      }
      setCatalogUrl(next);
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
