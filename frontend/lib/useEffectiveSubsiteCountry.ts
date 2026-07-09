"use client";

import { useSyncExternalStore } from "react";
import {
  MARKET_SUBSITE_COUNTRY_SAVED_STORAGE,
  MARKET_SUBSITE_COUNTRY_STORAGE,
  parseCountryParam,
  readStoredSubsiteCountryPref,
  type MarketSubsiteCountryParam,
} from "@/lib/marketSubsiteFilters";

function subscribeSubsiteCountryPref(
  variant: keyof typeof MARKET_SUBSITE_COUNTRY_STORAGE,
  onStoreChange: () => void,
) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    const k = e.key;
    if (
      k === MARKET_SUBSITE_COUNTRY_STORAGE[variant] ||
      k === MARKET_SUBSITE_COUNTRY_SAVED_STORAGE[variant] ||
      k === null
    ) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/** URL country → explicit user save → default ALL. */
export function useEffectiveSubsiteCountry(
  searchParams: Pick<URLSearchParams, "get">,
  variant: keyof typeof MARKET_SUBSITE_COUNTRY_STORAGE,
): MarketSubsiteCountryParam {
  const fromUrl = parseCountryParam(searchParams.get("country"));
  const stored = useSyncExternalStore(
    (onStoreChange) => subscribeSubsiteCountryPref(variant, onStoreChange),
    () => readStoredSubsiteCountryPref(variant),
    () => "all" as MarketSubsiteCountryParam,
  );
  return fromUrl !== "all" ? fromUrl : stored;
}
