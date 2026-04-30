/**
 * 自由市场子站详情页（SSR）：**先读已发布目录** `GET …/market/{provider|acquisition}/listings/:id`，
 * 与 `marketSubsite.rs` / `marketCatalogAdapter` 对齐；**仅**在命中内置 slug 演示卡时回退 `marketSubsiteDemo`
 *（离线、无池、或 404）；**production** 默认关闭，须 `NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK=1` 才允许 slug 演示回退（见 `marketSubsiteProductionGate`）。
 */

import { cache } from "react";
import { apiUrl, routes } from "@/lib/api";
import { apiFetch } from "@/lib/apiClient/core";
import {
  catalogDetailToDemoAcquisitionListing,
  catalogDetailToDemoMerchantListing,
} from "@/lib/marketCatalogAdapter";
import {
  getDemoAcquisitionListing,
  getDemoMerchantListing,
} from "@/lib/marketSubsiteDemo";
import type { DemoAcquisitionListing, DemoMerchantListing } from "@/lib/marketSubsiteDemo";
import { marketSubsiteDemoStudioFallbackEnabled } from "@/lib/marketSubsiteProductionGate";

export type MarketListingDetailProvenance = "postgres_catalog" | "demo_studio";

export type ResolvedMerchantShowcaseListing = {
  listing: DemoMerchantListing;
  provenance: MarketListingDetailProvenance;
};

export type ResolvedAcquisitionListing = {
  listing: DemoAcquisitionListing;
  provenance: MarketListingDetailProvenance;
};

function ssrRequestId(suffix: string): string {
  return `ssr-market-detail-${suffix}-${Date.now()}`;
}

async function fetchCatalogListingJson(url: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    const res = await apiFetch(url, {
      headers: { "x-request-id": ssrRequestId("listing") },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: {} };
  }
}

export async function resolveMerchantShowcaseListing(id: string): Promise<ResolvedMerchantShowcaseListing | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const url = apiUrl(routes.marketProviderListingById(trimmed));
  const { ok, status, body } = await fetchCatalogListingJson(url);
  // 503：目录读路径明确不可服务，**禁止**再回落演示卡冒充已发布目录（与列表页 `database_required` 一致）。
  if (status === 503) return null;
  if (ok && body && typeof body === "object" && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    if (o.status === "ok" && o.listing != null && typeof o.listing === "object" && !Array.isArray(o.listing)) {
      const row = o.listing as Record<string, unknown>;
      const lid = typeof row.id === "string" ? row.id.trim() : "";
      const updated_at = typeof row.updated_at === "string" ? row.updated_at : "";
      const payload = row.payload;
      if (lid && updated_at && payload != null && typeof payload === "object" && !Array.isArray(payload)) {
        return {
          listing: catalogDetailToDemoMerchantListing({
            id: lid,
            payload: payload as Record<string, unknown>,
            updated_at,
          }),
          provenance: "postgres_catalog",
        };
      }
    }
  }

  if (marketSubsiteDemoStudioFallbackEnabled()) {
    const demo = getDemoMerchantListing(trimmed);
    if (demo) {
      return { listing: demo, provenance: "demo_studio" };
    }
  }

  return null;
}

export async function resolveAcquisitionListing(id: string): Promise<ResolvedAcquisitionListing | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const url = apiUrl(routes.marketAcquisitionListingById(trimmed));
  const { ok, status, body } = await fetchCatalogListingJson(url);
  if (status === 503) return null;
  if (ok && body && typeof body === "object" && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    if (o.status === "ok" && o.listing != null && typeof o.listing === "object" && !Array.isArray(o.listing)) {
      const row = o.listing as Record<string, unknown>;
      const lid = typeof row.id === "string" ? row.id.trim() : "";
      const updated_at = typeof row.updated_at === "string" ? row.updated_at : "";
      const payload = row.payload;
      if (lid && updated_at && payload != null && typeof payload === "object" && !Array.isArray(payload)) {
        return {
          listing: catalogDetailToDemoAcquisitionListing({
            id: lid,
            payload: payload as Record<string, unknown>,
            updated_at,
          }),
          provenance: "postgres_catalog",
        };
      }
    }
  }

  if (marketSubsiteDemoStudioFallbackEnabled()) {
    const demo = getDemoAcquisitionListing(trimmed);
    if (demo) {
      return { listing: demo, provenance: "demo_studio" };
    }
  }

  return null;
}

/** 同请求内 `generateMetadata` 与 `page` 去重（React `cache`）。 */
export const loadMerchantShowcaseListingPage = cache(resolveMerchantShowcaseListing);
export const loadAcquisitionListingPage = cache(resolveAcquisitionListing);
