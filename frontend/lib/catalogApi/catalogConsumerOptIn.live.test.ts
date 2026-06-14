/**
 * C-S6 · Catalog Consumer opt-in live drift gate
 * ENABLED=1 + live API → resolve* must return catalog-api (not ts fallback)
 */
import { describe, expect, it } from "vitest";

import { createDefaultCatalogResolveDeps } from "./deps";
import {
  resolveCatalogCities,
  resolveCatalogCountries,
  resolveCatalogPricing,
} from "./resolve";
import { readCountriesFromTs } from "./catalogGeoAdapter";
import { getPricingForCountry } from "../countries/index";

const skipLive =
  process.env.CATALOG_API_PARITY_SKIP === "1" ||
  process.env.SKIP_CATALOG_API_PARITY === "1" ||
  process.env.CATALOG_CONSUMER_OPT_IN_SKIP === "1";

const apiBase = process.env.CATALOG_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

async function probeApi(): Promise<boolean> {
  if (!apiBase) return false;
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/catalog/countries`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { count?: number };
    return (body.count ?? 0) > 0;
  } catch {
    return false;
  }
}

describe("catalogConsumerOptIn · live drift (C-S6 staging ENABLED=1)", () => {
  it("C6-LIVE-01 countries resolve → catalog-api + parity with TS labels", async () => {
    if (skipLive || process.env.NEXT_PUBLIC_CATALOG_API_ENABLED !== "1") {
      console.warn("skip C6-LIVE-01: live opt-in requires API up + ENABLED=1");
      return;
    }
    if (!(await probeApi())) {
      console.warn("skip C6-LIVE-01: catalog API unreachable");
      return;
    }

    const r = await resolveCatalogCountries(createDefaultCatalogResolveDeps());
    expect(r.source).toBe("catalog-api");
    expect(r.data.length).toBeGreaterThan(0);
    const tsLabels = new Set(readCountriesFromTs().map((c) => c.label));
    for (const row of r.data) {
      expect(tsLabels.has(row.label), `missing TS label ${row.label}`).toBe(true);
    }
  });

  it("C6-LIVE-02 cities resolve 中国 → catalog-api + non-empty", async () => {
    if (skipLive || process.env.NEXT_PUBLIC_CATALOG_API_ENABLED !== "1") {
      console.warn("skip C6-LIVE-02: live opt-in requires API up + ENABLED=1");
      return;
    }
    if (!(await probeApi())) {
      console.warn("skip C6-LIVE-02: catalog API unreachable");
      return;
    }

    const r = await resolveCatalogCities("中国", createDefaultCatalogResolveDeps());
    expect(r.source).toBe("catalog-api");
    expect(r.data.length).toBeGreaterThan(0);
    expect(r.data.some((c) => c.label === "北京")).toBe(true);
  });

  it("C6-LIVE-03 pricing resolve 中国 → catalog-api + yuan parity with TS", async () => {
    if (skipLive || process.env.NEXT_PUBLIC_CATALOG_API_ENABLED !== "1") {
      console.warn("skip C6-LIVE-03: live opt-in requires API up + ENABLED=1");
      return;
    }
    if (!(await probeApi())) {
      console.warn("skip C6-LIVE-03: catalog API unreachable");
      return;
    }

    const r = await resolveCatalogPricing("中国", createDefaultCatalogResolveDeps());
    expect(r.source).toBe("catalog-api");
    expect(r.data).toEqual(getPricingForCountry("中国"));
  });
});
